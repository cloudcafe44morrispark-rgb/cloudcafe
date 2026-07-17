// Supabase Edge Function: wallet-issue
// Mints (or refreshes) the caller's "Add to Wallet" card via the guka wallet
// API and returns the Apple + Google save links. The guka API key is a Supabase
// secret held here server-side — it is never exposed to the browser.
//
// Flow:
//   1. Verify the caller's Supabase session (they can only issue THEIR own card).
//   2. Read their authoritative stamp count from user_rewards.
//   3. Call guka POST /v1/cloudcafe/wallet/issue with the shared API key.
//   4. Return { googleSaveUrl, applePassUrl } to the browser.
//
// Secrets (supabase secrets set ...):
//   GUKA_API_URL   e.g. https://api.guka.co.uk   (no trailing slash)
//   GUKA_API_KEY   shared secret, must match guka's CLOUDCAFE_API_KEY

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
    // ── 1. Authenticate the caller ──
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

    // ── 2. Read the caller's authoritative stamp count ──
    const admin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: rewards } = await admin
      .from('user_rewards')
      .select('stamps, pending_reward')
      .eq('user_id', user.id)
      .maybeSingle()
    // While a free drink is pending, report a FULL card — the wallet then shows
    // the gold gift badge + "10 / 10 🎁". After redemption the real (reset)
    // count is reported and the badge disappears.
    const stampCount = rewards?.pending_reward ? 10 : (rewards?.stamps ?? 0)

    // King of Coffee all-time points — shown as a second metric on the card.
    const { data: rankRows } = await admin.rpc('get_user_rank_all_time', {
      p_user_id: user.id,
    })
    const points = Number(rankRows?.[0]?.points ?? 0)

    const meta = (user.user_metadata ?? {}) as Record<string, string>
    const name =
      [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
      user.email?.split('@')[0] ||
      'Member'

    // ── 3. Call guka to mint / refresh the card ──
    const gukaUrl = Deno.env.get('GUKA_API_URL')?.replace(/\/$/, '')
    const gukaKey = Deno.env.get('GUKA_API_KEY')
    if (!gukaUrl || !gukaKey) {
      return json({ success: false, error: 'Wallet integration not configured' }, 503)
    }

    const gukaRes = await fetch(`${gukaUrl}/v1/cloudcafe/wallet/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gukaKey },
      body: JSON.stringify({
        userId: user.id,
        name,
        stampCount,
        stampGoal: 10,
        points,
      }),
    })

    if (!gukaRes.ok) {
      const detail = await gukaRes.text()
      console.error('guka issue failed:', gukaRes.status, detail)
      return json({ success: false, error: 'Failed to issue wallet card' }, 502)
    }

    const { googleSaveUrl, applePassUrl } = await gukaRes.json()
    return json({ success: true, googleSaveUrl, applePassUrl })
  } catch (err) {
    console.error('wallet-issue error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
