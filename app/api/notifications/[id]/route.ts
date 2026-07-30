/**
 * app/api/notifications/[id]/route.ts
 * Phase 9 — Single notification operations
 * PATCH /api/notifications/[id]  — mark as read
 * DELETE /api/notifications/[id] — delete notification
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { markNotificationRead, deleteNotification } from '@/services/notificationService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const { data: notif } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!notif || (notif as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const ok = await markNotificationRead(supabase as any, id);
    if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership (RLS also enforces this)
    const { data: notif } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!notif || (notif as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const ok = await deleteNotification(supabase as any, id);
    if (!ok) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
