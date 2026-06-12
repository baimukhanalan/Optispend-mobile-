import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY')!;

// Map RevenueCat product IDs to plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  'optispend_plus_monthly': 'plus',
  'optispend_family_monthly': 'family',
  'optispend_premium_monthly': 'premium',
  'optispend_plus_yearly': 'plus',
  'optispend_family_yearly': 'family',
  'optispend_premium_yearly': 'premium',
};

serve(async (req) => {
  try {
    // Handle RevenueCat webhook or manual sync
    const body = await req.json().catch(() => ({}));

    // RevenueCat webhook event
    if (body.event) {
      const event = body.event;
      const appUserId = event.app_user_id;
      const productId = event.product_id;
      const eventType = event.type;

      if (!appUserId) {
        return new Response('Missing app_user_id', { status: 400 });
      }

      const plan = PRODUCT_TO_PLAN[productId] || 'free';

      if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL' || eventType === 'PRODUCT_CHANGE') {
        const expiresAt = event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null;

        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: appUserId,
              plan,
              status: 'active',
              revenuecat_customer_id: appUserId,
              current_period_end: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        await supabase
          .from('users')
          .update({ subscription_plan: plan })
          .eq('id', appUserId);

        await supabase
          .from('financial_profiles')
          .update({ subscription_plan: plan })
          .eq('user_id', appUserId);
      } else if (
        eventType === 'CANCELLATION' ||
        eventType === 'EXPIRATION' ||
        eventType === 'BILLING_ISSUE'
      ) {
        await supabase
          .from('subscriptions')
          .update({ plan: 'free', status: eventType === 'BILLING_ISSUE' ? 'past_due' : 'cancelled' })
          .eq('user_id', appUserId);

        await supabase
          .from('users')
          .update({ subscription_plan: 'free' })
          .eq('id', appUserId);

        await supabase
          .from('financial_profiles')
          .update({ subscription_plan: 'free' })
          .eq('user_id', appUserId);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Manual sync: verify from RevenueCat API
    const { user_id } = body;
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id or event required' }), { status: 400 });
    }

    const rcResp = await fetch(`https://api.revenuecat.com/v1/subscribers/${user_id}`, {
      headers: {
        Authorization: `Bearer ${REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rcResp.ok) {
      // User has no RevenueCat record — they're on free plan
      await supabase
        .from('subscriptions')
        .upsert({ user_id, plan: 'free', status: 'active' }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ plan: 'free', synced: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rcData = await rcResp.json();
    const subscriber = rcData.subscriber;
    const entitlements = subscriber?.entitlements || {};

    let activePlan = 'free';
    let expiresAt = null;

    if (entitlements.premium?.is_active) {
      activePlan = 'premium';
      expiresAt = entitlements.premium.expires_date;
    } else if (entitlements.family?.is_active) {
      activePlan = 'family';
      expiresAt = entitlements.family.expires_date;
    } else if (entitlements.plus?.is_active) {
      activePlan = 'plus';
      expiresAt = entitlements.plus.expires_date;
    }

    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id,
          plan: activePlan,
          status: activePlan === 'free' ? 'active' : 'active',
          current_period_end: expiresAt,
          revenuecat_customer_id: subscriber.original_app_user_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    await supabase
      .from('users')
      .update({ subscription_plan: activePlan })
      .eq('id', user_id);

    await supabase
      .from('financial_profiles')
      .update({ subscription_plan: activePlan })
      .eq('user_id', user_id);

    return new Response(
      JSON.stringify({ plan: activePlan, expires_at: expiresAt, synced: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('sync-subscription-status error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
