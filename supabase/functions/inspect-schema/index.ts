
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get one order to see the fields
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1)

    return new Response(
        JSON.stringify({ data, error }),
        { headers: { 'Content-Type': 'application/json' } }
    )
})
