import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // Get all active users with financial profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('financial_profiles')
      .select('user_id, monthly_income, fixed_expenses_total, debt_total');

    if (profilesError) throw profilesError;

    const results = [];

    for (const profile of profiles || []) {
      // Get today's expenses
      const { data: todayExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', profile.user_id)
        .eq('date', dateStr);

      const todaySpent = (todayExpenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);

      // Get month expenses so far
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', profile.user_id)
        .gte('date', monthStart)
        .lte('date', dateStr);

      const monthSpent = (monthExpenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);

      // Calculate safe to spend
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayOfMonth = today.getDate();
      const remainingDays = daysInMonth - dayOfMonth + 1;
      const availableForVariable =
        (profile.monthly_income || 0) - (profile.fixed_expenses_total || 0) - monthSpent;
      const safeToSpendToday = Math.max(0, availableForVariable / remainingDays);

      // Budget usage percentage
      const budgetUsagePct =
        profile.monthly_income > 0
          ? Math.round((monthSpent / profile.monthly_income) * 100)
          : 0;

      const snapshot = {
        user_id: profile.user_id,
        date: dateStr,
        total_spent_today: todaySpent,
        total_spent_month: monthSpent,
        safe_to_spend: safeToSpendToday,
        budget_usage_pct: budgetUsagePct,
        transaction_count_today: (todayExpenses || []).length,
      };

      const { error: upsertError } = await supabase
        .from('daily_snapshots')
        .upsert(snapshot, { onConflict: 'user_id,date' });

      if (upsertError) {
        console.error(`Snapshot failed for ${profile.user_id}:`, upsertError);
      } else {
        results.push(profile.user_id);

        // Send alert push if over budget
        if (budgetUsagePct >= 90) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: profile.user_id,
              title: 'Бюджет на исходе',
              body: `Использовано ${budgetUsagePct}% месячного бюджета. Осталось ${daysInMonth - dayOfMonth} дн.`,
              type: 'budget_warning',
            },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, date: dateStr }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('generate-daily-snapshot error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
