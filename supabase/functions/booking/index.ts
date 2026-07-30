// supabase/functions/booking/index.ts
// ─────────────────────────────────────
// Edge Function: Booking Operations
//
// Phase 3 implementation:
// - POST /booking/create     → Create new booking + send confirmation email
// - POST /booking/cancel     → Cancel booking + initiate refund
// - POST /booking/check-in   → Check-in guest
// - POST /booking/check-out  → Check-out guest
//
// Runs on Supabase Edge Runtime (Deno)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    // TODO Phase 3: Implement booking actions
    switch (action) {
      case 'create':
        return new Response(
          JSON.stringify({ message: 'Phase 3: create booking' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      case 'cancel':
        return new Response(
          JSON.stringify({ message: 'Phase 3: cancel booking' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
