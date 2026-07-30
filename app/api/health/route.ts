/**
 * app/api/health/route.ts
 * ────────────────────────
 * Health check endpoint — verifies Supabase connection.
 * Uses auth.getSession() ping — works with zero tables (pre-Phase 3).
 *
 * GET /api/health
 * Returns: { status, supabase, timestamp, project }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();

  try {
    const supabase = await createServerClient();

    // Ping via auth session — zero schema required, pure network check
    const { error } = await supabase.auth.getSession();
    const isConnected = !error;
    const latency = Date.now() - start;

    return NextResponse.json(
      {
        status: isConnected ? 'healthy' : 'degraded',
        supabase: {
          connected: isConnected,
          project: 'Hotel Super Townhouse',
          ref: 'jzcmfpvscdsvkijpgdlj',
          region: 'ap-northeast-1',
          latencyMs: latency,
          note: 'Schema not yet created — Phase 3 will add tables',
          error: error ? error.message : null,
        },
        app: {
          environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'unknown',
          version: process.env.npm_package_version ?? '0.1.0',
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: isConnected ? 200 : 503,
        headers: { 'Cache-Control': 'no-store, no-cache' },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        supabase: { connected: false },
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
