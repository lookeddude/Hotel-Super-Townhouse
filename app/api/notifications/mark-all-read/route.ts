/**
 * app/api/notifications/mark-all-read/route.ts
 * Phase 9 — Bulk mark all notifications read for the authenticated user
 * POST /api/notifications/mark-all-read
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { markAllNotificationsRead } from '@/services/notificationService';

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ok = await markAllNotificationsRead(supabase as any, user.id);
    if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
