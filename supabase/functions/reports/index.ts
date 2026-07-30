// supabase/functions/reports/index.ts
// ─────────────────────────────────────
// Edge Function: Report Generation
//
// Phase 6 implementation:
// - Occupancy reports
// - Revenue reports
// - Guest reports
// - Booking source reports

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ message: 'Phase 6: Reports generation — not yet implemented' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
