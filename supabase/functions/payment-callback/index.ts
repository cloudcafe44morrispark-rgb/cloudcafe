// Supabase Edge Function: payment-callback
// Handles redirects from Worldpay after payment attempt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STAMP_CATEGORIES = ['Coffee', 'Tea', 'Hot Drink']

async function handleStampsAndRewards(supabase: any, orderId: string) {
    // Fetch order
    const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, reward_applied')
        .eq('id', orderId)
        .single()

    if (!order?.user_id) return

    // Guard: check if already processed
    const { data: existing } = await supabase
        .from('reward_transactions')
        .select('id')
        .eq('order_id', orderId)
        .limit(1)
    if (existing && existing.length > 0) {
        console.log(`Stamps already processed for order ${orderId}`)
        return
    }

    // Get or create user_rewards record
    let { data: rewards } = await supabase
        .from('user_rewards')
        .select('stamps, pending_reward')
        .eq('user_id', order.user_id)
        .single()

    if (!rewards) {
        await supabase.from('user_rewards').insert({ user_id: order.user_id, stamps: 0, pending_reward: false })
        rewards = { stamps: 0, pending_reward: false }
    }

    if (order.reward_applied && rewards.pending_reward) {
        // Redeem reward — reset stamps and clear pending_reward
        await supabase.from('user_rewards')
            .update({ stamps: 0, pending_reward: false, updated_at: new Date().toISOString() })
            .eq('user_id', order.user_id)

        await supabase.from('reward_transactions').insert({
            user_id: order.user_id,
            type: 'reward_redeemed',
            amount: 1,
            order_id: orderId,
        })
        console.log(`Reward redeemed for user ${order.user_id}`)
        return
    }

    if (rewards.pending_reward) {
        // Has pending reward but didn't redeem — don't award stamps
        return
    }

    // Count stamp-eligible drinks from order_items
    const { data: items } = await supabase
        .from('order_items')
        .select('quantity, category')
        .eq('order_id', orderId)

    if (!items) return

    const drinksCount = items
        .filter((i: any) => i.category && STAMP_CATEGORIES.includes(i.category))
        .reduce((s: number, i: any) => s + i.quantity, 0)

    if (drinksCount === 0) return

    const newStamps = rewards.stamps + drinksCount
    const willConvert = newStamps >= 10

    await supabase.from('user_rewards').update({
        stamps: willConvert ? 0 : newStamps,
        pending_reward: willConvert,
        updated_at: new Date().toISOString(),
    }).eq('user_id', order.user_id)

    await supabase.from('reward_transactions').insert({
        user_id: order.user_id,
        type: 'stamp_earned',
        amount: drinksCount,
        order_id: orderId,
    })

    if (willConvert) {
        await supabase.from('reward_transactions').insert({
            user_id: order.user_id,
            type: 'reward_earned',
            amount: 1,
        })
        console.log(`Reward earned for user ${order.user_id} (${newStamps} stamps)`)
    }

    console.log(`Awarded ${drinksCount} stamp(s) to user ${order.user_id}`)
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)

        // Try to get parameters from URL first (GET request)
        let status = url.searchParams.get('status')
        let orderId = url.searchParams.get('order')

        // If POST request, also check body for parameters (Worldpay may send data in body)
        if (req.method === 'POST') {
            try {
                const contentType = req.headers.get('content-type') || ''

                if (contentType.includes('application/x-www-form-urlencoded')) {
                    const body = await req.text()
                    const params = new URLSearchParams(body)
                    status = status || params.get('status') || params.get('orderCode')
                    orderId = orderId || params.get('order') || params.get('orderId')

                    // Worldpay may send payment status differently
                    const paymentStatus = params.get('paymentStatus')
                    if (paymentStatus === 'AUTHORISED') status = 'success'
                    else if (paymentStatus === 'REFUSED') status = 'failure'
                    else if (paymentStatus === 'CANCELLED') status = 'cancel'
                    else if (paymentStatus === 'ERROR') status = 'error'
                } else if (contentType.includes('application/json')) {
                    const body = await req.json()
                    status = status || body.status || (body.paymentStatus === 'AUTHORISED' ? 'success' : body.paymentStatus?.toLowerCase())
                    orderId = orderId || body.order || body.orderId || body.orderCode
                }
            } catch (parseError) {
                console.log('Could not parse POST body, using URL params:', parseError)
            }
        }

        console.log(`Payment callback received: method=${req.method}, status=${status}, orderId=${orderId}`)

        if (!status || !orderId) {
            throw new Error('Missing status or orderId in callback')
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Map status to internal statuses
        let paymentStatus: string
        let orderStatus: string

        switch (status) {
            case 'success':
                paymentStatus = 'completed' // Changed from 'authorized' to match likely enum
                orderStatus = 'confirmed' // Changed from 'pending' to 'confirmed' (Blue badge)
                break
            case 'failure':
                paymentStatus = 'refused'
                orderStatus = 'awaiting_payment'
                break
            case 'cancel':
                paymentStatus = 'cancelled'
                orderStatus = 'awaiting_payment'
                break
            case 'pending':
                paymentStatus = 'pending'
                orderStatus = 'awaiting_payment'
                break
            case 'error':
            default:
                paymentStatus = 'error'
                orderStatus = 'awaiting_payment'
        }

        // Update order status in database
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: paymentStatus,
                status: orderStatus,
            })
            .eq('id', orderId)

        if (updateError) {
            console.error('Error updating order status:', updateError)
        }

        // Handle stamps + rewards server-side for successful payments
        if (status === 'success' && orderId && !updateError) {
            try {
                await handleStampsAndRewards(supabase, orderId)
            } catch (e) {
                console.error('Stamp/reward handling error:', e)
            }

            // Trigger receipt printing (fire-and-forget)
            const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
            fetch(`${supabaseUrl}/functions/v1/print-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`,
                },
                body: JSON.stringify({ orderId }),
            }).then(r => console.log(`print-receipt status: ${r.status}`))
              .catch(e => console.error('print-receipt call failed:', e))
        }

        // Get frontend URL for redirect - prefer APP_URL (standard) then FRONTEND_URL
        const frontendUrl = Deno.env.get('APP_URL') || Deno.env.get('FRONTEND_URL') || 'https://cloudcafe.vercel.app'
        const cleanFrontendUrl = frontendUrl.replace(/\/$/, '')

        // Construct final redirect URL
        const redirectUrl = `${cleanFrontendUrl}/payment/${status}?order=${orderId}`

        console.log(`Redirecting user to: ${redirectUrl}`)

        return Response.redirect(redirectUrl, 303)

    } catch (error) {
        console.error('Callback error:', error)
        // Fallback redirect to a generic error page if something goes wrong
        // Use a hardcoded fallback if env var is missing to avoid 500 loop
        const frontendUrl = Deno.env.get('APP_URL') || Deno.env.get('FRONTEND_URL') || 'https://cloudcafe.vercel.app'
        return Response.redirect(`${frontendUrl}/payment/error`, 303)
    }
})
