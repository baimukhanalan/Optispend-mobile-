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

  try {
    const { user_id } = await req.json();

    // Calculate week bounds
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setHours(0, 0, 0, 0);

    const [profileRes, expensesRes, prevExpensesRes, leaksRes] = await Promise.all([
      supabase.from('financial_profiles').select('*').eq('user_id', user_id).single(),
      supabase.from('expenses').select('*').eq('user_id', user_id)
        .gte('date', weekStart.toISOString()).lte('date', weekEnd.toISOString()),
      supabase.from('expenses').select('amount').eq('user_id', user_id)
        .gte('date', prevWeekStart.toISOString()).lte('date', prevWeekEnd.toISOString()),
      supabase.from('financial_leaks').select('*').eq('user_id', user_id)
        .eq('status', 'detected').order('total_amount', { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const expenses: any[] = expensesRes.data ?? [];
    const prevExpenses: any[] = prevExpensesRes.data ?? [];

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const weeklyIncome = profile?.monthly_income ? profile.monthly_income / 4.3 : 0;
    const savingsAmount = Math.max(0, weeklyIncome - totalExpenses);
    const savingsRate = weeklyIncome > 0 ? (savingsAmount / weeklyIncome) * 100 : 0;
    const vsPrev = prevTotal > 0 ? totalExpenses - prevTotal : 0;

    // Category breakdown
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    const merchantMap: Record<string, { amount: number; count: number }> = {};

    for (const e of expenses) {
      if (!categoryMap[e.category]) categoryMap[e.category] = { amount: 0, count: 0 };
      categoryMap[e.category].amount += e.amount;
      categoryMap[e.category].count += 1;

      if (e.merchant_name) {
        if (!merchantMap[e.merchant_name]) merchantMap[e.merchant_name] = { amount: 0, count: 0 };
        merchantMap[e.merchant_name].amount += e.amount;
        merchantMap[e.merchant_name].count += 1;
      }
    }

    const topCategories = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transaction_count: data.count,
        vs_previous: 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topMerchants = Object.entries(merchantMap)
      .map(([merchant_name, data]) => ({ merchant_name, amount: data.amount, transaction_count: data.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Generate AI summary
    const aiSummary = await generateWeeklySummary({
      totalExpenses,
      weeklyIncome,
      savingsAmount,
      topCategories,
      vsPrev,
      mainLeak: leaksRes.data,
    });

    // Build reduction plan
    const reductionPlan = buildReductionPlan(topCategories, leaksRes.data);

    // Save report
    const { data: report } = await supabase.from('weekly_reports').upsert({
      user_id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      total_income: weeklyIncome,
      total_expenses: totalExpenses,
      savings_amount: savingsAmount,
      savings_rate: savingsRate,
      top_categories: topCategories,
      top_merchants: topMerchants,
      main_leak_id: leaksRes.data?.id,
      limits_exceeded: [],
      vs_previous_week: vsPrev,
      reduction_plan: reductionPlan,
      ai_summary: aiSummary,
    }, { onConflict: 'user_id,week_start' }).select().single();

    // Send email report
    await supabase.functions.invoke('send-email-report', {
      body: { user_id, report_type: 'weekly', report_id: report?.id },
    });

    // Send push notification
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id,
        type: 'weekly_report_ready',
        title: 'Недельный отчёт готов',
        body: `Расходы: ${totalExpenses.toLocaleString('ru-KZ')} ₸. Можно отложить: ${savingsAmount.toLocaleString('ru-KZ')} ₸.`,
      },
    });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWeeklySummary(data: Record<string, any>): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) return 'AI-анализ недоступен.';

  const prompt = `Напиши краткий (3-4 предложения) недельный финансовый итог. Только факты и цифры. Тон: конкретный и прямой.

Данные: расходы ${data.totalExpenses?.toLocaleString('ru-KZ')} ₸, доход в неделю ~${data.weeklyIncome?.toFixed(0)} ₸, накоплено ${data.savingsAmount?.toLocaleString('ru-KZ')} ₸, изменение vs прошлая неделя: ${data.vsPrev > 0 ? '+' : ''}${data.vsPrev?.toLocaleString('ru-KZ')} ₸.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });
  const d = await response.json();
  return d.choices?.[0]?.message?.content ?? 'Анализ недоступен.';
}

function buildReductionPlan(topCategories: any[], mainLeak: any): string[] {
  const plan: string[] = [];
  if (mainLeak) {
    plan.push(`Сократить "${mainLeak.category}": ${mainLeak.recommendation}`);
  }
  const dangerCats = topCategories.filter((c) => ['food_delivery', 'taxi', 'cafe_restaurants'].includes(c.category));
  for (const cat of dangerCats.slice(0, 2)) {
    plan.push(`Лимит на "${cat.category}" — не более ${Math.round(cat.amount * 0.6).toLocaleString('ru-KZ')} ₸/нед.`);
  }
  plan.push('Перевести освободившиеся средства в резервный фонд.');
  return plan;
}
