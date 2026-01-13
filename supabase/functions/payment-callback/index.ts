// Supabase Edge Function: payment-callback
// Handles redirects from Worldpay after payment attempt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const status = url.searchParams.get('status') // success, failure, cancel, pending, error
        const orderId = url.searchParams.get('order')

        console.log(`Payment callback received: status=${status}, orderId=${orderId}`)

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
            .from('orders') // Ensure table reference
            .update({
                payment_status: paymentStatus,
                status: orderStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (updateError) {
            console.error('Error updating order status:', updateError)
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
