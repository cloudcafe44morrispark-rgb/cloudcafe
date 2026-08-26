// Supabase Edge Function: print-sweep
// Safety net for auto-print. Scans for paid-but-unprinted orders and
// (re)triggers print-receipt for each. Meant to be invoked on a schedule
// (pg_cron, every minute) so a dropped auto-print is recovered automatically.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Grace period: skip orders younger than this so we don't race the normal
// payment-callback → print-receipt path that fires immediately after payment.
const GRACE_SECONDS = 90
// Only look back this far — old unpaid/abandoned rows shouldn't be reprinted.
const LOOKBACK_HOURS = 24

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const now = Date.now()
    const before = new Date(now - GRACE_SECONDS * 1000).toISOString()
    const after  = new Date(now - LOOKBACK_HOURS * 3600 * 1000).toISOString()

    // Paid, not yet printed, past the grace window, within lookback.
    // Orders without a phone wait longer so the customer can add it first.
    const PHONELESS_GRACE_SECONDS = 300
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_phone, created_at')
      .eq('payment_status', 'completed')
      .is('printed_at', null)
      .lt('created_at', before)
      .gt('created_at', after)
      .limit(50)

    if (error) throw new Error(`Query failed: ${error.message}`)

    const due = (orders || []).filter((o: { customer_phone?: string | null; created_at: string }) => {
      const hasPhone = !!(o.customer_phone || '').trim()
      if (hasPhone) return true
      const ageSec = (now - new Date(o.created_at).getTime()) / 1000
      return ageSec >= PHONELESS_GRACE_SECONDS
    })

    if (due.length === 0) {
      return new Response(JSON.stringify({ ok: true, swept: 0 }), { status: 200 })
    }

    console.log(`print-sweep: ${due.length} unprinted paid order(s) found`)

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const results = await Promise.allSettled(
      due.map((o: { id: string }) =>
        fetch(`${supabaseUrl}/functions/v1/print-receipt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ orderId: o.id }),
        }).then(async r => {
          console.log(`print-sweep: order ${o.id.slice(0, 8)} → print-receipt ${r.status}`)
          if (!r.ok) throw new Error(`print-receipt ${r.status}`)
        }),
      ),
    )

    const printed = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.length - printed
    console.log(`print-sweep: printed=${printed} failed=${failed}`)

    return new Response(
      JSON.stringify({ ok: true, swept: due.length, printed, failed }),
      { status: 200 },
    )
  } catch (err) {
    console.error('print-sweep error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
})
