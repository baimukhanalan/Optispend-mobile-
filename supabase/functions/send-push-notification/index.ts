import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const payload: PushPayload = await req.json();
    const { user_id, type, title, body, data } = payload;

    // Get Expo push token for user
    const { data: integration } = await supabase
      .from('integrations')
      .select('token')
      .eq('user_id', user_id)
      .eq('type', 'expo_push')
      .single();

    // Save notification to DB
    await supabase.from('notifications').insert({
      user_id,
      type,
      title,
      body,
      data: data ?? {},
    });

    if (!integration?.token) {
      return new Response(JSON.stringify({ saved: true, pushed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send via Expo Push Service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: integration.token,
        sound: 'default',
        title,
        body,
        data: { type, ...data },
        badge: 1,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ saved: true, pushed: true, result }), {
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
