import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { user_id, year, month } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    }

    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth(); // previous month default
    const adjustedMonth = targetMonth || (new Date().getMonth() === 0 ? 12 : new Date().getMonth());
    const adjustedYear = targetMonth === 0 ? targetYear - 1 : targetYear;

    const monthStart = `${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}-01`;
    const daysInMonth = new Date(adjustedYear, adjustedMonth, 0).getDate();
    const monthEnd = `${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}-${daysInMonth}`;

    // Fetch financial profile
    const { data: profile } = await supabase
      .from('financial_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Fetch all expenses for the month
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category, date, merchant_name, description')
      .eq('user_id', user_id)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({ error: 'No expenses for this month' }), { status: 404 });
    }

    // Aggregate by category
    const byCategory: Record<string, number> = {};
    const byMerchant: Record<string, number> = {};
    let totalSpent = 0;

    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      if (e.merchant_name) {
        byMerchant[e.merchant_name] = (byMerchant[e.merchant_name] || 0) + e.amount;
      }
      totalSpent += e.amount;
    }

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({ category, amount }));

    const topMerchants = Object.entries(byMerchant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([merchant, amount]) => ({ merchant, amount }));

    const monthlyIncome = profile?.monthly_income || 0;
    const savingsAmount = Math.max(0, monthlyIncome - totalSpent);
    const savingsPct = monthlyIncome > 0 ? Math.round((savingsAmount / monthlyIncome) * 100) : 0;

    // Fetch leaks
    const { data: leaks } = await supabase
      .from('financial_leaks')
      .select('category, amount, threshold, severity')
      .eq('user_id', user_id)
      .eq('month_year', `${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}`);

    // Fetch goals progress
    const { data: goals } = await supabase
      .from('goals')
      .select('name, target_amount, current_amount, monthly_contribution')
      .eq('user_id', user_id)
      .eq('is_active', true);

    // Generate AI summary
    const prompt = `Ты финансовый аналитик. Составь краткий месячный отчёт на русском языке.

Данные за ${adjustedMonth}/${adjustedYear}:
- Доход: ${monthlyIncome.toLocaleString('ru-KZ')} ₸
- Расходы: ${totalSpent.toLocaleString('ru-KZ')} ₸
- Сэкономлено: ${savingsAmount.toLocaleString('ru-KZ')} ₸ (${savingsPct}%)
- Транзакций: ${expenses.length}

Топ категорий расходов:
${topCategories.map(c => `- ${c.category}: ${c.amount.toLocaleString('ru-KZ')} ₸`).join('\n')}

${leaks && leaks.length > 0 ? `Выявленные утечки:\n${leaks.map((l: any) => `- ${l.category}: ${l.amount.toLocaleString('ru-KZ')} ₸ (превышение в ${Math.round(l.amount / l.threshold)}x)`).join('\n')}` : ''}

${goals && goals.length > 0 ? `Цели:\n${goals.map((g: any) => `- ${g.name}: ${Math.round((g.current_amount / g.target_amount) * 100)}% выполнено`).join('\n')}` : ''}

Требуется вернуть JSON:
{
  "summary": "3-4 предложения: итог месяца, главные достижения и провалы",
  "top_insight": "Самый важный вывод за месяц (1 предложение)",
  "next_month_goal": "Конкретная рекомендация на следующий месяц",
  "savings_comment": "Оценка % накоплений (хорошо/плохо и почему)",
  "trend": "better|worse|stable — по сравнению с типичным месяцем"
}

Только JSON, без markdown.`;

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      }),
    });

    const aiData = await aiResp.json();
    const aiResult = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Save to monthly_reports
    const reportData = {
      user_id,
      year: adjustedYear,
      month: adjustedMonth,
      total_income: monthlyIncome,
      total_expenses: totalSpent,
      savings_amount: savingsAmount,
      savings_pct: savingsPct,
      transaction_count: expenses.length,
      top_categories: topCategories,
      top_merchants: topMerchants,
      leaks_total: (leaks || []).reduce((s: number, l: any) => s + l.amount, 0),
      ai_summary: aiResult.summary,
      top_insight: aiResult.top_insight,
      next_month_goal: aiResult.next_month_goal,
      savings_comment: aiResult.savings_comment,
      trend: aiResult.trend || 'stable',
    };

    const { error: reportError } = await supabase
      .from('monthly_reports')
      .upsert(reportData, { onConflict: 'user_id,year,month' });

    if (reportError) throw reportError;

    // Log AI usage
    await supabase.from('ai_logs').insert({
      user_id,
      function_name: 'generate-monthly-report',
      model: 'gpt-4o-mini',
      tokens_used: aiData.usage?.total_tokens || 0,
      success: true,
    });

    return new Response(
      JSON.stringify({ success: true, report: reportData }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('generate-monthly-report error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
