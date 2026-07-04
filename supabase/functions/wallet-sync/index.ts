// Supabase Edge Function: wallet-sync
// Pushes a user's current stamp count to their wallet card (Apple + Google) via
// the guka wallet API, so the card face refreshes after staff add a stamp or
// redeem a reward. Fire-and-forget from the staff flow — best-effort, never
// blocks stamping.
//
// The caller (staff) is authenticated, but the target row belongs to a customer,
// so the authoritative count is re-read here with the service role rather than
// trusted from the request body. If the user never added a wallet card, guka
// simply reports { synced: false } and nothing happens.
//
// Secrets: GUKA_API_URL, GUKA_API_KEY (see wallet-issue).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Require an authenticated caller (staff/admin performing the stamp).
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ success: false, error: 'Missing authorization header' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return json({ success: false, error: 'Invalid or expired token' }, 401)
    }

    const { userId } = await req.json().catch(() => ({}))
    if (!userId || typeof userId !== 'string') {
      return json({ success: false, error: 'userId is required' }, 400)
    }

    // Re-read the authoritative stamp count (don't trust the request body).
    const admin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: rewards } = await admin
      .from('user_rewards')
      .select('stamps')
      .eq('user_id', userId)
      .maybeSingle()
    if (!rewards) {
      return json({ success: true, synced: false })
    }

    // King of Coffee all-time points — kept in sync on the card alongside stamps.
    const { data: rankRows } = await admin.rpc('get_user_rank_all_time', {
      p_user_id: userId,
    })
    const points = Number(rankRows?.[0]?.points ?? 0)

    const gukaUrl = Deno.env.get('GUKA_API_URL')?.replace(/\/$/, '')
    const gukaKey = Deno.env.get('GUKA_API_KEY')
    if (!gukaUrl || !gukaKey) {
      return json({ success: false, error: 'Wallet integration not configured' }, 503)
    }

    const gukaRes = await fetch(`${gukaUrl}/v1/cloudcafe/wallet/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gukaKey },
      body: JSON.stringify({ userId, stampCount: rewards.stamps, stampGoal: 10, points }),
    })

    if (!gukaRes.ok) {
      const detail = await gukaRes.text()
      console.error('guka sync failed:', gukaRes.status, detail)
      return json({ success: false, error: 'Failed to sync wallet card' }, 502)
    }

    const { synced } = await gukaRes.json()
    return json({ success: true, synced })
  } catch (err) {
    console.error('wallet-sync error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
