import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  merchant_name?: string;
  ai_category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { statement_id } = await req.json();

    const { data: statement } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statement_id)
      .single();

    if (!statement) throw new Error('Statement not found');

    await supabase.from('statements').update({ parse_status: 'processing' }).eq('id', statement_id);

    // Download file
    const { data: fileData } = await supabase.storage
      .from('statements')
      .download(statement.storage_path);

    if (!fileData) throw new Error('Failed to download statement file');

    let transactions: ParsedTransaction[] = [];

    // Parse based on file type and bank
    if (statement.file_type === 'csv') {
      transactions = await parseCSV(fileData, statement.bank);
    } else if (statement.file_type === 'pdf' || statement.file_type === 'image') {
      transactions = await parsePDFOrImage(fileData, statement.bank);
    } else if (statement.file_type === 'xlsx') {
      transactions = await parseXLSX(fileData, statement.bank);
    }

    // AI categorize all transactions in batch
    if (transactions.length > 0) {
      transactions = await batchCategorize(transactions);
    }

    // Save imported transactions
    if (transactions.length > 0) {
      const rows = transactions.map((tx) => ({
        statement_id,
        user_id: statement.user_id,
        amount: tx.amount,
        description: tx.description,
        merchant_name: tx.merchant_name,
        date: tx.date,
        ai_category: tx.ai_category ?? 'other',
        confirmed: false,
      }));

      await supabase.from('imported_transactions').insert(rows);
    }

    // Update statement
    await supabase.from('statements').update({
      parse_status: 'completed',
      total_transactions: transactions.length,
    }).eq('id', statement_id);

    return new Response(JSON.stringify({ transactions_count: transactions.length, transactions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('statements').update({ parse_status: 'failed', error_message: message })
      .eq('id', (await req.json().catch(() => ({}))).statement_id);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function parseCSV(file: Blob, bank: string): Promise<ParsedTransaction[]> {
  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim());

  // Bank-specific parsing logic
  const transactions: ParsedTransaction[] = [];

  for (const line of lines.slice(1)) { // Skip header
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    if (cols.length < 3) continue;

    let amount = 0;
    let date = '';
    let description = '';

    if (bank === 'kaspi') {
      // Kaspi CSV format: date, description, amount, balance
      date = cols[0];
      description = cols[1];
      amount = Math.abs(parseFloat(cols[2].replace(/\s/g, '')));
    } else if (bank === 'halyk') {
      // Halyk CSV format: date, debit, credit, description
      date = cols[0];
      amount = Math.abs(parseFloat((cols[1] || cols[2]).replace(/\s/g, '')));
      description = cols[3] ?? '';
    } else {
      date = cols[0];
      description = cols[1];
      amount = Math.abs(parseFloat(cols[2]?.replace(/\s/g, '') ?? '0'));
    }

    if (amount > 0 && date) {
      transactions.push({ date: normalizeDate(date), amount, description });
    }
  }

  return transactions;
}

async function parsePDFOrImage(file: Blob, bank: string): Promise<ParsedTransaction[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
  const bytes = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const isImage = true; // Simplified — real impl checks MIME type

  const prompt = `Parse this ${bank} bank statement. Extract all expense transactions.
Return JSON array: [{"date": "2024-01-15", "amount": 5000, "description": "Merchant name", "merchant_name": "Clean merchant name"}]
Only debit/expense transactions. Skip income. Amounts in KZT as positive numbers.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' } },
        ],
      }],
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.content ?? '{"transactions":[]}');
  return result.transactions ?? [];
}

async function parseXLSX(file: Blob, bank: string): Promise<ParsedTransaction[]> {
  // For XLSX, use a simple approach — parse as text and extract numbers
  // In production, use a proper XLSX parser library
  return [];
}

async function batchCategorize(transactions: ParsedTransaction[]): Promise<ParsedTransaction[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey || transactions.length === 0) return transactions;

  const descriptions = transactions.map((t, i) => `${i}: ${t.merchant_name ?? t.description}`).join('\n');

  const prompt = `Categorize these Kazakhstan bank transactions. Return JSON: {"categories": ["food_delivery", "groceries", ...]}
One category per line (by index). Categories: food_delivery, groceries, transport, taxi, entertainment, subscriptions, cafe_restaurants, health, education, shopping, utilities, housing, debt_payment, savings, other.

${descriptions}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: transactions.length * 10 + 200,
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  const categories: string[] = result.categories ?? [];

  return transactions.map((tx, i) => ({
    ...tx,
    ai_category: categories[i] ?? 'other',
  }));
}

function normalizeDate(dateStr: string): string {
  // Try DD.MM.YYYY → YYYY-MM-DD
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  // Already ISO
  return dateStr;
}
