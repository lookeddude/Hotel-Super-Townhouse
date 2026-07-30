// supabase/functions/payments/index.ts
// ─────────────────────────────────────
// Edge Function: Payment Processing
//
// Phase 5 implementation:
// - POST /payments/create-order    → Razorpay order creation
// - POST /payments/verify          → Payment signature verification
// - POST /payments/refund          → Initiate refund
// - POST /payments/webhook         → Razorpay webhook handler
//
// Runs on Supabase Edge Runtime (Deno)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ message: 'Phase 5: Payment processing — not yet implemented' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
