import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

const CATEGORIES = [
  'food_groceries', 'food_delivery', 'cafe_restaurants', 'transport', 'taxi',
  'utilities', 'rent', 'healthcare', 'education', 'subscriptions',
  'entertainment', 'shopping', 'sports', 'kids', 'debt_payment', 'other',
];

// Fast keyword-based pre-categorization to avoid AI call when obvious
const KEYWORD_MAP: Record<string, string> = {
  'magnum': 'food_groceries', 'small': 'food_groceries', 'рамстор': 'food_groceries',
  'metro': 'food_groceries', 'есіл': 'food_groceries', 'зеленый': 'food_groceries',
  'wolt': 'food_delivery', 'glovo': 'food_delivery', 'яндекс еда': 'food_delivery',
  'кофе': 'cafe_restaurants', 'coffee': 'cafe_restaurants', 'starbucks': 'cafe_restaurants',
  'ресторан': 'cafe_restaurants', 'кафе': 'cafe_restaurants',
  'яндекс такси': 'taxi', 'yandex taxi': 'taxi', 'indriver': 'taxi', 'bolt': 'taxi',
  'автобус': 'transport', 'метро': 'transport', 'трамвай': 'transport',
  'netflix': 'subscriptions', 'spotify': 'subscriptions', 'youtube premium': 'subscriptions',
  'kaspi red': 'debt_payment', 'кредит': 'debt_payment', 'рассрочка': 'debt_payment',
};

function keywordCategorize(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return null;
}

serve(async (req) => {
  try {
    const { description, merchant_name, amount, expense_id } = await req.json();

    if (!description && !merchant_name) {
      return new Response(JSON.stringify({ error: 'description or merchant_name required' }), {
        status: 400,
      });
    }

    const text = [merchant_name, description].filter(Boolean).join(' — ');

    // Try keyword match first
    const keywordCategory = keywordCategorize(text);
    if (keywordCategory) {
      if (expense_id) {
        await supabase
          .from('expenses')
          .update({ category: keywordCategory, categorized_by: 'keyword' })
          .eq('id', expense_id);
      }
      return new Response(
        JSON.stringify({ category: keywordCategory, method: 'keyword' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // AI categorization
    const prompt = `Определи категорию расхода из списка. Ответь только названием категории.

Описание: "${text}"
Сумма: ${amount ? amount + ' ₸' : 'неизвестна'}

Доступные категории:
${CATEGORIES.join(', ')}

Категория:`;

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 30,
        temperature: 0,
      }),
    });

    const aiData = await aiResp.json();
    const rawCategory = aiData.choices?.[0]?.message?.content?.trim().toLowerCase() || 'other';
    const category = CATEGORIES.includes(rawCategory) ? rawCategory : 'other';

    if (expense_id) {
      await supabase
        .from('expenses')
        .update({ category, categorized_by: 'ai' })
        .eq('id', expense_id);
    }

    await supabase.from('ai_logs').insert({
      function_name: 'categorize-expense',
      model: 'gpt-4o-mini',
      tokens_used: aiData.usage?.total_tokens || 0,
      success: true,
    });

    return new Response(
      JSON.stringify({ category, method: 'ai' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('categorize-expense error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
