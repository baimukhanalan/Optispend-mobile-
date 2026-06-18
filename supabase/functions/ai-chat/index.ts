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

  try {
    const { user_id, session_id, message } = await req.json();

    // Save user message
    await supabase.from('ai_chat_messages').insert({
      session_id,
      user_id,
      role: 'user',
      content: message,
    });

    await supabase
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);

    // Load conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from('ai_chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Load financial context
    const [profileRes, expensesRes, leaksRes] = await Promise.all([
      supabase.from('financial_profiles').select('*').eq('user_id', user_id).single(),
      supabase
        .from('expenses')
        .select('category, amount, date')
        .eq('user_id', user_id)
        .gte('date', new Date(new Date().setDate(1)).toISOString())
        .order('amount', { ascending: false })
        .limit(50),
      supabase
        .from('financial_leaks')
        .select('category, total_amount, severity, recommendation')
        .eq('user_id', user_id)
        .eq('status', 'detected')
        .order('total_amount', { ascending: false })
        .limit(5),
    ]);

    const profile = profileRes.data;
    const expenses = expensesRes.data ?? [];
    const leaks = leaksRes.data ?? [];

    const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
    const categoryTotals: Record<string, number> = {};
    for (const e of expenses as any[]) {
      categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
    }

    const systemPrompt = `Ты — AI финансовый советник приложения OptiSpend для казахстанских пользователей. Общайся на русском языке. Давай конкретные, честные советы с цифрами из данных пользователя. Отвечай кратко (2-5 предложений), только по делу. Без общих фраз.

ФИНАНСОВЫЙ ПРОФИЛЬ:
- Доход: ${profile?.monthly_income?.toLocaleString('ru-KZ') ?? 'не указан'} ₸/мес
- Фикс. расходы: ${profile?.monthly_fixed_expenses?.toLocaleString('ru-KZ') ?? '0'} ₸/мес
- Долг: ${profile?.total_debt?.toLocaleString('ru-KZ') ?? '0'} ₸
- Резервный фонд: ${profile?.emergency_fund_months ?? 0} мес.

РАСХОДЫ ТЕКУЩЕГО МЕСЯЦА: ${totalExpenses.toLocaleString('ru-KZ')} ₸
${Object.entries(categoryTotals)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 7)
  .map(([cat, amt]) => `- ${cat}: ${(amt as number).toLocaleString('ru-KZ')} ₸`)
  .join('\n')}

УТЕЧКИ: ${leaks.length > 0
  ? leaks.map((l: any) => `${l.category} ${l.total_amount?.toLocaleString('ru-KZ')} ₸ (${l.severity})`).join(', ')
  : 'не обнаружены'}

Ограничения: не давай медицинских/юридических советов, не рекомендуй конкретные ценные бумаги или криптовалюты.`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: aiMessages,
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    const aiData = await response.json();
    const reply = aiData.choices?.[0]?.message?.content ?? 'Не удалось получить ответ. Попробуйте снова.';

    // Save assistant reply
    const { data: savedMsg } = await supabase
      .from('ai_chat_messages')
      .insert({ session_id, user_id, role: 'assistant', content: reply })
      .select()
      .single();

    await supabase.from('ai_logs').insert({
      user_id,
      function_name: 'ai-chat',
      model: 'gpt-4o',
      prompt_tokens: aiData.usage?.prompt_tokens,
      completion_tokens: aiData.usage?.completion_tokens,
      status: 'success',
    });

    return new Response(JSON.stringify(savedMsg), {
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
