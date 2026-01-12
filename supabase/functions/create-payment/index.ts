// Supabase Edge Function: create-payment
// Creates a Worldpay Hosted Payment Page session and returns the payment URL

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
    // Get Worldpay credentials from environment
    const merchantEntity = Deno.env.get('WORLDPAY_MERCHANT_ENTITY')
    const username = Deno.env.get('WORLDPAY_USERNAME')
    const password = Deno.env.get('WORLDPAY_PASSWORD')
    const wpEnv = Deno.env.get('WORLDPAY_ENV') || 'try' // 'try' for test, 'access' for live

    if (!merchantEntity || !username || !password) {
      throw new Error('Worldpay credentials not configured')
    }

    // Parse request body
    const { orderId, amount, currency }: PaymentRequest = await req.json()

    if (!orderId || !amount || !currency) {
      throw new Error('Missing required fields: orderId, amount, currency')
    }

    // Create Supabase client to verify order exists
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify order exists and belongs to authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    if (order.user_id !== user.id) {
      throw new Error('Order does not belong to user')
    }

    // Generate unique transaction reference
    const transactionReference = `ORDER-${orderId.substring(0, 8)}-${Date.now()}`

    // Get frontend URL for redirects
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://cloudcafe.vercel.app'

    // Build Worldpay API request
    const worldpayUrl = wpEnv === 'try'
      ? 'https://try.access.worldpay.com/payment_pages'
      : 'https://access.worldpay.com/payment_pages'

    const credentials = btoa(`${username}:${password}`)

    const worldpayRequest = {
      transactionReference,
      merchant: {
        entity: merchantEntity
      },
      narrative: {
        line1: 'Cloud Cafe'
      },
      value: {
        currency,
        amount: Math.round(amount) // Ensure whole number
      },
      resultURLs: {
        successUrl: `${frontendUrl}/payment/success?order=${orderId}&ref=${transactionReference}`,
        cancelUrl: `${frontendUrl}/payment/cancel?order=${orderId}`,
        failureUrl: `${frontendUrl}/payment/failure?order=${orderId}`,
        pendingUrl: `${frontendUrl}/payment/pending?order=${orderId}`,
        errorUrl: `${frontendUrl}/payment/error?order=${orderId}`
      }
    }

    // Call Worldpay API
    const wpResponse = await fetch(worldpayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/vnd.worldpay.payment_pages-v1.hal+json',
        'Accept': 'application/vnd.worldpay.payment_pages-v1.hal+json'
      },
      body: JSON.stringify(worldpayRequest)
    })

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text()
      console.error('Worldpay error:', errorText)
      throw new Error(`Worldpay API error: ${wpResponse.status}`)
    }

    const wpData = await wpResponse.json()

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({
        payment_reference: transactionReference,
        payment_status: 'pending',
        status: 'awaiting_payment'
      })
      .eq('id', orderId)

    // Return payment URL to frontend
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: wpData.url,
        transactionReference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
