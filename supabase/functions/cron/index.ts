// supabase/functions/cron/index.ts
// ──────────────────────────────────
// Edge Function: Scheduled Cron Jobs
//
// Phase 3 implementation (via pg_cron):
// - Daily: auto-checkout guests past checkout time
// - Daily: mark no-shows
// - Weekly: generate revenue reports
// - Hourly: cleanup expired reservations
// - Daily: send check-in reminder emails (T-24hrs)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { job } = await req.json().catch(() => ({ job: null }));

  // TODO Phase 3: Implement scheduled jobs
  const jobs: Record<string, string> = {
    'auto-checkout': 'Phase 3: Auto checkout past-due guests',
    'mark-no-shows': 'Phase 3: Mark no-show bookings',
    'weekly-report': 'Phase 6: Generate weekly revenue report',
    'cleanup-reservations': 'Phase 3: Cleanup expired reservations',
    'checkin-reminders': 'Phase 4: Send check-in reminder emails',
  };

  const message = jobs[job] ?? `Unknown cron job: ${job}`;

  return new Response(
    JSON.stringify({ message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
