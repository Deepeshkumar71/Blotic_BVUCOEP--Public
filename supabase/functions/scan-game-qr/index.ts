import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { eventId, qrCodeData } = await req.json()

    console.log('[scan-game-qr] Request:', { userId: user.id, eventId, qrCodeData })

    // Validate QR code format: EVENT_{eventId}_{token}
    if (!qrCodeData || !qrCodeData.startsWith('EVENT_')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid QR code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const parts = qrCodeData.split('_')
    if (parts.length !== 3 || parts[1] !== eventId) {
      return new Response(
        JSON.stringify({ success: false, error: 'QR code does not match event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is registered for this event
    const { data: registration, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('payment_status', 'paid')
      .single()

    if (regError || !registration) {
      console.error('[scan-game-qr] Registration error:', regError)
      return new Response(
        JSON.stringify({ success: false, error: 'Not registered for this event or payment not approved' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has games remaining
    if (!registration.games_remaining || registration.games_remaining <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No games remaining' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrement games_remaining
    const newGamesRemaining = registration.games_remaining - 1
    const { error: updateError } = await supabaseClient
      .from('event_registrations')
      .update({ games_remaining: newGamesRemaining })
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (updateError) {
      console.error('[scan-game-qr] Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update games remaining' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[scan-game-qr] Success:', { userId: user.id, eventId, gamesRemaining: newGamesRemaining })

    return new Response(
      JSON.stringify({
        success: true,
        games_remaining: newGamesRemaining,
        message: `Game played successfully! ${newGamesRemaining} games remaining`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[scan-game-qr] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
