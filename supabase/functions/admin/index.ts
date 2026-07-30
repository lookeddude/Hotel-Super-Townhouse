// supabase/functions/admin/index.ts
// ───────────────────────────────────
// Edge Function: Admin Operations
//
// Phase 3 implementation:
// - Bulk room status updates
// - Admin role assignment
// - Dashboard data aggregation
// - Report generation triggers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ message: 'Phase 3: Admin operations — not yet implemented' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
