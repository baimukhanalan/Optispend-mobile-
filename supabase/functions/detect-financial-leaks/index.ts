import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeakRule {
  category: string;
  threshold_monthly: number;
  severity_thresholds: { critical: number; high: number; medium: number };
  reason_template: string;
  recommendation_template: string;
}

// Thresholds in KZT (approximate averages for Kazakhstan)
const LEAK_RULES: LeakRule[] = [
  {
    category: 'food_delivery',
    threshold_monthly: 15000,
    severity_thresholds: { critical: 60000, high: 35000, medium: 15000 },
    reason_template: '{{count}} заказов доставки еды за месяц',
    recommendation_template: 'Ограничьте доставку до 2 раз в неделю. Экономия — до {{saving}} ₸.',
  },
  {
    category: 'taxi',
    threshold_monthly: 10000,
    severity_thresholds: { critical: 40000, high: 25000, medium: 10000 },
    reason_template: '{{count}} поездок на такси за месяц',
    recommendation_template: 'Используйте общественный транспорт 3 дня в неделю. Экономия — до {{saving}} ₸.',
  },
  {
    category: 'subscriptions',
    threshold_monthly: 5000,
    severity_thresholds: { critical: 20000, high: 12000, medium: 5000 },
    reason_template: 'Подписки: {{count}} сервисов',
    recommendation_template: 'Отмените неиспользуемые подписки. Проверьте каждую.',
  },
  {
    category: 'cafe_restaurants',
    threshold_monthly: 20000,
    severity_thresholds: { critical: 60000, high: 35000, medium: 20000 },
    reason_template: '{{count}} посещений кафе и ресторанов',
    recommendation_template: 'Ограничьте до 4 посещений в неделю. Готовьте дома чаще.',
  },
  {
    category: 'shopping',
    threshold_monthly: 30000,
    severity_thresholds: { critical: 100000, high: 60000, medium: 30000 },
    reason_template: '{{count}} покупок на маркетплейсах и в магазинах',
    recommendation_template: 'Используйте список покупок. Избегайте спонтанных заказов на Kaspi.',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { user_id } = await req.json();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date();
    monthEnd.setHours(23, 59, 59, 999);

    // Fetch this month's expenses grouped by category
    const { data: expenses } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', user_id)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    if (!expenses?.length) {
      return new Response(JSON.stringify({ leaks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Aggregate by category
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    for (const e of expenses) {
      if (!categoryTotals[e.category]) categoryTotals[e.category] = { amount: 0, count: 0 };
      categoryTotals[e.category].amount += e.amount;
      categoryTotals[e.category].count += 1;
    }

    const detectedLeaks = [];

    for (const rule of LEAK_RULES) {
      const data = categoryTotals[rule.category];
      if (!data || data.amount < rule.threshold_monthly) continue;

      const { critical, high, medium } = rule.severity_thresholds;
      const severity =
        data.amount >= critical ? 'critical'
        : data.amount >= high ? 'high'
        : 'medium';

      // Estimate potential savings (40-60% of the excess over threshold)
      const excess = data.amount - rule.threshold_monthly;
      const estimatedSavings = Math.round(excess * 0.5);

      const reason = rule.reason_template.replace('{{count}}', String(data.count));
      const recommendation = rule.recommendation_template.replace(
        '{{saving}}',
        estimatedSavings.toLocaleString('ru-KZ'),
      );

      // Upsert leak (update if already detected this month)
      const { data: existing } = await supabase
        .from('financial_leaks')
        .select('id')
        .eq('user_id', user_id)
        .eq('category', rule.category)
        .gte('period_start', monthStart.toISOString())
        .single();

      if (existing) {
        await supabase
          .from('financial_leaks')
          .update({
            total_amount: data.amount,
            transaction_count: data.count,
            severity,
            estimated_savings: estimatedSavings,
            recommendation,
            reason,
            status: 'detected',
          })
          .eq('id', existing.id);
        detectedLeaks.push({ ...existing, category: rule.category, total_amount: data.amount });
      } else {
        const { data: newLeak } = await supabase.from('financial_leaks').insert({
          user_id,
          category: rule.category,
          period_start: monthStart.toISOString(),
          period_end: monthEnd.toISOString(),
          total_amount: data.amount,
          transaction_count: data.count,
          severity,
          estimated_savings: estimatedSavings,
          recommendation,
          reason,
          status: 'detected',
        }).select().single();

        if (newLeak) detectedLeaks.push(newLeak);
      }
    }

    // Send push notification for critical leaks
    const criticalLeaks = detectedLeaks.filter((l: any) => l.severity === 'critical');
    if (criticalLeaks.length > 0) {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id,
          type: 'large_leak_detected',
          title: 'Обнаружена крупная утечка',
          body: `${criticalLeaks.length} критических утечек найдено. Открыть отчёт.`,
        },
      });
    }

    return new Response(JSON.stringify({ leaks: detectedLeaks }), {
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
