// supabase/functions/notifications/index.ts
// ──────────────────────────────────────────
// Edge Function: Notification Dispatch
//
// Phase 4 implementation:
// - Booking confirmation emails
// - Check-in reminders
// - Payment receipts
// - Admin alerts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ message: 'Phase 4: Notifications — not yet implemented' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
