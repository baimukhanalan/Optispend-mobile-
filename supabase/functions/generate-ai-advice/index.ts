import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
  const startTime = Date.now();

  try {
    const { user_id } = await req.json();

    // Gather context
    const [profileRes, expensesRes, leaksRes] = await Promise.all([
      supabase.from('financial_profiles').select('*').eq('user_id', user_id).single(),
      supabase
        .from('expenses')
        .select('category, amount, date')
        .eq('user_id', user_id)
        .gte('date', new Date(new Date().setDate(1)).toISOString())
        .order('amount', { ascending: false }),
      supabase
        .from('financial_leaks')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'detected')
        .order('total_amount', { ascending: false })
        .limit(5),
    ]);

    const profile = profileRes.data;
    const expenses = expensesRes.data ?? [];
    const leaks = leaksRes.data ?? [];

    const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
    const spendingRate = profile?.monthly_income > 0
      ? ((totalExpenses / profile.monthly_income) * 100).toFixed(1)
      : 'N/A';

    const categoryTotals: Record<string, number> = {};
    for (const e of expenses as any[]) {
      categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
    }

    const prompt = `Ты — финансовый директор семьи. Дай конкретный, честный совет без воды. Используй только реальные цифры из данных.

ФИНАНСОВЫЙ ПРОФИЛЬ:
- Доход в месяц: ${profile?.monthly_income?.toLocaleString('ru-KZ') ?? 'не указан'} ₸
- Фиксированные расходы: ${profile?.monthly_fixed_expenses?.toLocaleString('ru-KZ') ?? '0'} ₸
- Долговая нагрузка: ${profile?.total_debt?.toLocaleString('ru-KZ') ?? '0'} ₸
- Резервный фонд: ${profile?.emergency_fund_months ?? 0} месяцев

РАСХОДЫ ЗА ТЕКУЩИЙ МЕСЯЦ:
- Итого: ${totalExpenses.toLocaleString('ru-KZ')} ₸ (${spendingRate}% дохода)
${Object.entries(categoryTotals)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, amt]) => `- ${cat}: ${(amt as number).toLocaleString('ru-KZ')} ₸`)
  .join('\n')}

ОБНАРУЖЕННЫЕ УТЕЧКИ:
${leaks.map((l: any) => `- ${l.category}: ${l.total_amount.toLocaleString('ru-KZ')} ₸/мес (${l.severity})`).join('\n') || 'Нет'}

Верни JSON объект строго в этой структуре:
{
  "main_conclusion": "1-2 предложения. Конкретно, с цифрами.",
  "top_leaks": [{"category": "food_delivery", "amount": 42000}, ...],
  "what_to_cut_this_week": "Конкретное действие с цифрами.",
  "safe_to_save": 76000,
  "debt_advice": "Конкретный совет по долгам.",
  "can_invest": false,
  "investment_advice": "Почему нельзя/можно инвестировать сейчас.",
  "forbidden_actions": ["Конкретное запрещённое действие 1", "2", "3"],
  "disclaimer": "Не является финансовой консультацией. Только для информационных целей."
}

ВАЖНО: Без мотивации, без общих фраз. Только конкретика с числами. Не обещай доходность. Не советуй конкретные акции или крипту.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const advice = JSON.parse(aiData.choices?.[0]?.message?.content ?? '{}');

    // Save to DB
    const { data: saved } = await supabase
      .from('ai_recommendations')
      .insert({ user_id, ...advice })
      .select()
      .single();

    // Log AI usage
    await supabase.from('ai_logs').insert({
      user_id,
      function_name: 'generate-ai-advice',
      model: 'gpt-4o',
      prompt_tokens: aiData.usage?.prompt_tokens,
      completion_tokens: aiData.usage?.completion_tokens,
      status: 'success',
    });

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('ai_logs').insert({
      function_name: 'generate-ai-advice',
      model: 'gpt-4o',
      status: 'failed',
      error_message: message,
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
