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
        const redirectTo = url.searchParams.get('redirect_to')

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
                paymentStatus = 'authorized'
                orderStatus = 'pending'
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

        // Fetch order to get redirect URL stored in notes
        const { data: orderData, error: fetchError } = await supabase
            .from('orders')
            .select('notes')
            .eq('id', orderId)
            .single()

        // Extract redirect URL from notes and clean it up
        let frontendUrlRedirect = null
        let cleanNotes = orderData?.notes

        if (orderData?.notes && orderData.notes.includes(':::REDIRECT=')) {
            const match = orderData.notes.match(/:::REDIRECT=(http[^:\s]+)/)
            if (match && match[1]) {
                frontendUrlRedirect = match[1]
                // Remove the tag from notes so user doesn't see it
                cleanNotes = orderData.notes.replace(/:::REDIRECT=[^:\s]+/, '')
            }
        }

        // Update order status in database (and clean notes)
        const updatePayload: any = {
            payment_status: paymentStatus,
            status: orderStatus,
            updated_at: new Date().toISOString()
        }

        if (cleanNotes !== orderData?.notes) {
            updatePayload.notes = cleanNotes
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)

        if (updateError) {
            console.error('Error updating order status:', updateError)
        }

        // Get frontend URL for redirect - prefer notes extracted, then param, then env, then default
        const frontendUrl = frontendUrlRedirect || redirectTo || Deno.env.get('FRONTEND_URL') || 'https://cloudcafe-theta.vercel.app'
        const cleanFrontendUrl = frontendUrl.replace(/\/$/, '')

        // Construct final redirect URL
        const redirectUrl = `${cleanFrontendUrl}/payment/${status}?order=${orderId}`

        console.log(`Redirecting user to: ${redirectUrl}`)

        return Response.redirect(redirectUrl, 303)

    } catch (error) {
        console.error('Callback error:', error)
        // Fallback redirect to a generic error page if something goes wrong
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://cloudcafe-theta.vercel.app'
        return Response.redirect(`${frontendUrl}/payment/error`, 303)
    }
})
