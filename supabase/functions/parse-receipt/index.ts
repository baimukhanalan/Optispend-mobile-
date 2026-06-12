import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseReceiptPayload {
  receipt_id: string;
  storage_path: string;
}

interface OCRResult {
  merchant_name?: string;
  date?: string;
  total_amount?: number;
  items: Array<{ name: string; price: number; quantity: number; total: number }>;
  raw_text: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { receipt_id, storage_path }: ParseReceiptPayload = await req.json();
    const startTime = Date.now();

    // Mark as processing
    await supabase.from('receipts').update({ ocr_status: 'processing' }).eq('id', receipt_id);

    // Download image from Storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('receipts')
      .download(storage_path);

    if (downloadErr || !fileData) throw new Error('Failed to download receipt: ' + downloadErr?.message);

    const imageBytes = await fileData.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));

    // Use Google Cloud Vision or Mindee
    const ocrResult = await runOCR(base64Image);

    // Use OpenAI/Gemini to normalize and categorize
    const normalized = await normalizeWithAI(ocrResult);

    // Update receipt
    await supabase.from('receipts').update({
      ocr_status: 'completed',
      merchant_name: normalized.merchant_name,
      date: normalized.date,
      total_amount: normalized.total_amount,
      items: normalized.items,
      raw_ocr_text: normalized.raw_text,
      ai_category: normalized.category,
    }).eq('id', receipt_id);

    // Log OCR
    await supabase.from('ocr_logs').insert({
      receipt_id,
      provider: 'google_vision',
      status: 'success',
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ success: true, data: normalized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Log failure
    await supabase.from('ocr_logs').insert({
      status: 'failed',
      provider: 'google_vision',
      error_message: message,
    });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runOCR(base64Image: string): Promise<OCRResult> {
  const gcvKey = Deno.env.get('GOOGLE_CLOUD_VISION_KEY');

  if (!gcvKey) throw new Error('GOOGLE_CLOUD_VISION_KEY not set');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${gcvKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        }],
      }),
    },
  );

  const data = await response.json();
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text ?? '';

  return { raw_text: rawText, items: [] };
}

async function normalizeWithAI(ocrResult: OCRResult): Promise<OCRResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) return ocrResult;

  const prompt = `You are a receipt parser for Kazakhstan. Extract information from this receipt OCR text.
Return a JSON object with: merchant_name, date (ISO 8601), total_amount (number in KZT), items (array of {name, price, quantity, total}), category.
Categories: food_delivery, groceries, transport, taxi, entertainment, subscriptions, cafe_restaurants, health, education, shopping, utilities, housing, other.
If unsure about a field, omit it.

OCR TEXT:
${ocrResult.raw_text}

Return ONLY valid JSON, no explanation.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    }),
  });

  const aiData = await response.json();
  const parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? '{}');

  return { ...ocrResult, ...parsed };
}
