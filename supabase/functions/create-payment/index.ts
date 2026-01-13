// Supabase Edge Function: create-payment
// Creates a Worldpay Hosted Payment Page session and returns the payment URL
// PRODUCTION VERSION - handles auth internally

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  orderId: string
  amount: number // in pence/cents
  currency: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ============================================
    // STEP 1: Verify User Authentication
    // ============================================
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('✅ User verified:', user.id)

    // ============================================
    // STEP 2: Validate Worldpay Credentials
    // ============================================
    const merchantEntity = Deno.env.get('WORLDPAY_MERCHANT_ENTITY')
    const username = Deno.env.get('WORLDPAY_USERNAME')
    const password = Deno.env.get('WORLDPAY_PASSWORD')
    const wpEnv = Deno.env.get('WORLDPAY_ENV') || 'try'

    if (!merchantEntity || !username || !password) {
      console.error('Missing Worldpay credentials')
      throw new Error('Payment system not configured')
    }

    // ============================================
    // STEP 3: Parse and Validate Request
    // ============================================
    const { orderId, amount, currency }: PaymentRequest = await req.json()

    if (!orderId || !amount || !currency) {
      throw new Error('Missing required fields: orderId, amount, currency')
    }

    // ============================================
    // STEP 4: Verify Order Ownership
    // ============================================
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      throw new Error('Order not found')
    }

    // Verify the order belongs to the authenticated user
    if (order.user_id !== user.id) {
      console.error('Order ownership mismatch:', { orderUserId: order.user_id, requestUserId: user.id })
      return new Response(
        JSON.stringify({ success: false, error: 'Order does not belong to user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('✅ Order verified:', orderId)

    // ============================================
    // STEP 5: Create Worldpay Payment Session
    // ============================================
    const transactionReference = `ORDER-${orderId.substring(0, 8)}-${Date.now()}`

    const worldpayUrl = wpEnv === 'try'
      ? 'https://try.access.worldpay.com/payment_pages'
      : 'https://access.worldpay.com/payment_pages'

    // Worldpay uses username:password Basic Auth
    const credentials = btoa(`${username}:${password}`)

    const worldpayRequest = {
      transactionReference,
      merchant: {
        entity: merchantEntity
      },
      narrative: {
        line1: 'Cloud Cafe'
      },
      description: 'Cloud Cafe Order',
      value: {
        currency,
        amount: Math.round(amount)
      },
      resultURLs: {
        successURL: `${supabaseUrl}/functions/v1/payment-callback?status=success&order=${encodeURIComponent(orderId)}`,
        failureURL: `${supabaseUrl}/functions/v1/payment-callback?status=failure&order=${encodeURIComponent(orderId)}`,
        cancelURL: `${supabaseUrl}/functions/v1/payment-callback?status=cancel&order=${encodeURIComponent(orderId)}`,
        pendingURL: `${supabaseUrl}/functions/v1/payment-callback?status=pending&order=${encodeURIComponent(orderId)}`,
        errorURL: `${supabaseUrl}/functions/v1/payment-callback?status=error&order=${encodeURIComponent(orderId)}`
      },
      hostedProperties: {
        sendURLParameters: 'true'
      }
    }

    console.log('📤 Calling Worldpay API:', worldpayUrl)

    const wpResponse = await fetch(worldpayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/vnd.worldpay.payment_pages-v1.hal+json',
        'Accept': 'application/vnd.worldpay.payment_pages-v1.hal+json',
        'WP-CorrelationId': transactionReference
      },
      body: JSON.stringify(worldpayRequest)
    })

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text()
      console.error('Worldpay error:', wpResponse.status, errorText)
      throw new Error(`Payment provider error: ${wpResponse.status}`)
    }

    const wpData = await wpResponse.json()
    const paymentUrl = wpData.url || wpData._links?.['hpp:redirect']?.href

    if (!paymentUrl) {
      console.error('No payment URL in response:', wpData)
      throw new Error('Failed to get payment URL')
    }

    console.log('✅ Payment URL received:', paymentUrl.substring(0, 50) + '...')

    // ============================================
    // STEP 6: Update Order with Payment Reference
    // ============================================
    await supabaseAdmin
      .from('orders')
      .update({
        payment_reference: transactionReference,
        payment_status: 'pending',
        status: 'awaiting_payment'
      })
      .eq('id', orderId)

    // ============================================
    // STEP 7: Return Success Response
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        transactionReference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Payment creation error:', message)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
