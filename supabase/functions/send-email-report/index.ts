import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'noreply@familycfo.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { user_id, report_type, report_id } = await req.json();

    // Fetch user and plan
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name, subscription_plan')
      .eq('id', user_id)
      .single();

    if (!user) throw new Error('User not found');

    // Only Plus+ gets email reports
    if (user.subscription_plan === 'free') {
      return new Response(JSON.stringify({ skipped: 'free plan' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = '';
    let html = '';

    if (report_type === 'weekly') {
      const { data: report } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', report_id)
        .single();

      if (!report) throw new Error('Report not found');

      subject = `📊 Недельный отчёт — ${new Date(report.week_start).toLocaleDateString('ru-KZ', { day: 'numeric', month: 'long' })}`;
      html = buildWeeklyReportHtml(user.full_name, report);

      await supabase.from('weekly_reports').update({ email_sent: true }).eq('id', report_id);
    }

    if (!html) throw new Error('Unknown report type');

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Family CFO AI <${FROM_EMAIL}>`,
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!response.ok) throw new Error(`Resend error: ${await response.text()}`);

    return new Response(JSON.stringify({ sent: true }), {
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

function buildWeeklyReportHtml(name: string, report: any): string {
  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';
  const topCats = (report.top_categories as any[])
    .slice(0, 5)
    .map((c: any) => `<tr><td style="padding:6px 0;color:#667085;">${c.category}</td><td style="padding:6px 0;font-weight:600;text-align:right;">${fmt(c.amount)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F9FC;color:#172033">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
    <tr><td style="padding:0 0 24px">
      <p style="font-size:13px;color:#94A3B8;margin:0 0 4px">Привет, ${name}</p>
      <h1 style="font-size:24px;font-weight:600;margin:0;color:#172033">Недельный отчёт</h1>
      <p style="font-size:14px;color:#667085;margin:4px 0 0">${new Date(report.week_start).toLocaleDateString('ru-KZ', { day:'numeric', month:'long' })} — ${new Date(report.week_end).toLocaleDateString('ru-KZ', { day:'numeric', month:'long', year:'numeric' })}</p>
    </td></tr>

    <!-- Summary cards -->
    <tr><td style="padding:0 0 16px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="32%" style="background:#fff;border:1px solid #E5EAF2;border-radius:12px;padding:16px;text-align:center">
          <p style="font-size:11px;color:#94A3B8;margin:0 0 4px">РАСХОДЫ</p>
          <p style="font-size:20px;font-weight:600;color:#EF4444;margin:0">${fmt(report.total_expenses)}</p>
        </td>
        <td width="4%"></td>
        <td width="32%" style="background:#fff;border:1px solid #E5EAF2;border-radius:12px;padding:16px;text-align:center">
          <p style="font-size:11px;color:#94A3B8;margin:0 0 4px">ОТЛОЖЕНО</p>
          <p style="font-size:20px;font-weight:600;color:#22C55E;margin:0">${fmt(report.savings_amount)}</p>
        </td>
        <td width="4%"></td>
        <td width="32%" style="background:#fff;border:1px solid #E5EAF2;border-radius:12px;padding:16px;text-align:center">
          <p style="font-size:11px;color:#94A3B8;margin:0 0 4px">НОРМА СБЕРЕЖЕНИЙ</p>
          <p style="font-size:20px;font-weight:600;color:#4F8CFF;margin:0">${report.savings_rate?.toFixed(0)}%</p>
        </td>
      </tr></table>
    </td></tr>

    <!-- AI Summary -->
    <tr><td style="background:#fff;border:1px solid #E5EAF2;border-radius:12px;padding:20px;margin-bottom:16px">
      <p style="font-size:12px;font-weight:600;color:#94A3B8;margin:0 0 10px">AI ВЫВОД</p>
      <p style="font-size:15px;color:#172033;line-height:1.6;margin:0">${report.ai_summary}</p>
    </td></tr>

    <!-- Categories -->
    <tr><td style="height:16px"></td></tr>
    <tr><td style="background:#fff;border:1px solid #E5EAF2;border-radius:12px;padding:20px">
      <p style="font-size:12px;font-weight:600;color:#94A3B8;margin:0 0 10px">ТОП КАТЕГОРИЙ</p>
      <table width="100%">${topCats}</table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 0 0;text-align:center">
      <p style="font-size:11px;color:#94A3B8;line-height:1.6;margin:0">
        Не является финансовой консультацией. Только для информационных целей.<br>
        <a href="https://familycfo.app/unsubscribe" style="color:#94A3B8">Отписаться</a>
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}
