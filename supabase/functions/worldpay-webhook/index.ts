// Supabase Edge Function: worldpay-webhook
// Handles Worldpay webhook notifications for payment status updates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Worldpay webhook IP ranges (for validation)
// Reference: https://developer.worldpay.com/products/hosted-payment-pages/webhooks
const WORLDPAY_IPS = [
  '195.35.90.0/24',
  '195.35.91.0/24',
  // Add more IP ranges as needed from Worldpay documentation
]

interface WorldpayEvent {
  eventId: string
  eventTimestamp: string
  eventDetails: {
    classification: string
    transactionReference: string
    type: string
    amount?: {
      value: number
      currencyCode: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for validation (optional but recommended)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip')
    console.log('Webhook received from IP:', clientIP)

    // Parse webhook payload
    const event: WorldpayEvent = await req.json()
    console.log('Worldpay event:', JSON.stringify(event))

    const { eventId, eventDetails } = event
    const { transactionReference, type } = eventDetails

    if (!transactionReference || !type) {
      throw new Error('Invalid webhook payload')
    }

    // Extract order ID from transaction reference (format: ORDER-{orderIdPrefix}-{timestamp})
    // The transaction reference contains ORDER- prefix
    if (!orderIdMatch) {
      throw new Error('Invalid transaction reference format')
    }

    // Use ID for robust lookup (ignoring any suffixes in payment_reference)
    const orderId = orderIdMatch[1]

    // Find order by ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found for reference:', transactionReference)
      // Return 200 to acknowledge receipt even if order not found
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Map Worldpay event type to payment status and order status
    let paymentStatus: string
    let orderStatus: string

    switch (type) {
      case 'authorized':
        paymentStatus = 'authorized'
        orderStatus = 'pending' // Payment successful, order ready for processing
        break
      case 'sentForSettlement':
        paymentStatus = 'settled'
        orderStatus = 'pending'
        break
      case 'refused':
        paymentStatus = 'refused'
        orderStatus = 'cancelled'
        break
      case 'error':
        paymentStatus = 'error'
        orderStatus = 'awaiting_payment' // Keep awaiting, user may retry
        break
      case 'cancelled':
        paymentStatus = 'cancelled'
        orderStatus = 'cancelled'
        break
      case 'expired':
        paymentStatus = 'expired'
        orderStatus = 'cancelled'
        break
      default:
        // For other events, just log and update payment_status
        paymentStatus = type
        orderStatus = order.status // Keep existing order status
    }

    // Update order with new status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    console.log(`Order ${order.id} updated: payment_status=${paymentStatus}, status=${orderStatus}`)

    // Return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({
        received: true,
        orderId: order.id,
        paymentStatus,
        orderStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 even on error to prevent Worldpay retries for processing issues
    // Only return non-200 for actual webhook validation failures
    return new Response(
      JSON.stringify({
        received: true,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})
