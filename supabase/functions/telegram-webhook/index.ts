import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

// Parse quick expense: "кофе 1900" or "такси 3500 ₸"
function parseQuickExpense(text: string): { description: string; amount: number } | null {
  const match = text.match(/^(.+?)\s+(\d[\d\s]*(?:[.,]\d+)?)\s*₸?$/i);
  if (!match) return null;
  const description = match[1].trim();
  const amount = parseFloat(match[2].replace(/\s/g, '').replace(',', '.'));
  if (!amount || amount <= 0) return null;
  return { description, amount };
}

// Guess category from description
function guessCategory(description: string): string {
  const desc = description.toLowerCase();
  if (/wolt|glovo|яндекс.еда|доставка/.test(desc)) return 'food_delivery';
  if (/яндекс.такси|uber|inDrive|такси/.test(desc)) return 'taxi';
  if (/кофе|coffee|starbucks|кафе/.test(desc)) return 'cafe_restaurants';
  if (/magnum|малина|рамстор|супермаркет|продукт/.test(desc)) return 'groceries';
  if (/netflix|spotify|youtube|подписк/.test(desc)) return 'subscriptions';
  return 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const update = await req.json();
    const message = update.message;
    if (!message) return new Response('ok', { headers: corsHeaders });

    const chatId: number = message.chat.id;
    const text: string = message.text ?? '';
    const telegramUserId: number = message.from.id;

    // Find linked user
    const { data: telegramAccount } = await supabase
      .from('telegram_accounts')
      .select('user_id')
      .eq('telegram_id', telegramUserId)
      .single();

    // Commands without auth
    if (text === '/start') {
      await sendMessage(chatId,
        '👋 <b>Family CFO AI</b>\n\nЯ помогаю отслеживать расходы.\n\n' +
        '📌 Команды:\n' +
        '/link — привязать аккаунт\n' +
        '/limit — лимит на сегодня\n' +
        '/week — отчёт за неделю\n\n' +
        '💡 Быстрый расход: просто напишите "кофе 1900"'
      );
      return new Response('ok', { headers: corsHeaders });
    }

    if (!telegramAccount) {
      if (text.startsWith('/link ')) {
        const token = text.split(' ')[1];
        // Verify token and link account
        const { data: tokenData } = await supabase
          .from('integrations')
          .select('user_id')
          .eq('type', 'telegram_link')
          .eq('token', token)
          .single();

        if (tokenData) {
          await supabase.from('telegram_accounts').upsert({
            user_id: tokenData.user_id,
            telegram_id: telegramUserId,
            telegram_username: message.from.username,
          });
          await sendMessage(chatId, '✅ Аккаунт привязан. Теперь можно отправлять расходы!');
        } else {
          await sendMessage(chatId, '❌ Неверный токен. Получите новый в приложении → Настройки → Telegram.');
        }
        return new Response('ok', { headers: corsHeaders });
      }

      await sendMessage(chatId, '🔗 Сначала привяжите аккаунт: /link <токен>\n\nТокен доступен в приложении в разделе Настройки.');
      return new Response('ok', { headers: corsHeaders });
    }

    const userId = telegramAccount.user_id;

    // Commands
    if (text === '/limit') {
      const { data: snapshot } = await supabase
        .from('daily_snapshots')
        .select('safe_to_spend, spent_today, risk_level')
        .eq('user_id', userId)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (snapshot) {
        const risk = snapshot.risk_level === 'critical' ? '🔴' : snapshot.risk_level === 'warning' ? '🟡' : '🟢';
        await sendMessage(chatId,
          `${risk} <b>Лимит на сегодня</b>\n\n` +
          `✅ Можно потратить: <b>${snapshot.safe_to_spend.toLocaleString('ru-KZ')} ₸</b>\n` +
          `💸 Потрачено: ${snapshot.spent_today.toLocaleString('ru-KZ')} ₸`
        );
      } else {
        await sendMessage(chatId, 'Данные за сегодня ещё не готовы. Откройте приложение.');
      }
      return new Response('ok', { headers: corsHeaders });
    }

    if (text === '/week') {
      const { data: report } = await supabase
        .from('weekly_reports')
        .select('total_expenses, savings_amount, ai_summary')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (report) {
        await sendMessage(chatId,
          `📊 <b>Недельный отчёт</b>\n\n` +
          `💸 Расходы: <b>${report.total_expenses.toLocaleString('ru-KZ')} ₸</b>\n` +
          `🐷 Отложено: <b>${report.savings_amount.toLocaleString('ru-KZ')} ₸</b>\n\n` +
          `${report.ai_summary}`
        );
      } else {
        await sendMessage(chatId, 'Недельный отчёт ещё не готов. Попробуйте в воскресенье вечером.');
      }
      return new Response('ok', { headers: corsHeaders });
    }

    // Try to parse quick expense
    const parsed = parseQuickExpense(text);
    if (parsed) {
      const category = guessCategory(parsed.description);

      // Add expense
      const { data: expense } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount: parsed.amount,
          currency: '₸',
          category,
          merchant_name: parsed.description,
          date: new Date().toISOString(),
          source: 'telegram',
        })
        .select()
        .single();

      await sendMessage(chatId,
        `✅ Записано: <b>${parsed.description}</b> — ${parsed.amount.toLocaleString('ru-KZ')} ₸\n` +
        `📁 Категория: ${category}`
      );
      return new Response('ok', { headers: corsHeaders });
    }

    // Help fallback
    await sendMessage(chatId,
      '❓ Не понял. Попробуйте:\n\n' +
      '• Быстрый расход: "кофе 1900"\n' +
      '• /limit — лимит на сегодня\n' +
      '• /week — недельный отчёт'
    );

    return new Response('ok', { headers: corsHeaders });
  } catch (err: unknown) {
    console.error(err);
    return new Response('ok', { headers: corsHeaders });
  }
});
