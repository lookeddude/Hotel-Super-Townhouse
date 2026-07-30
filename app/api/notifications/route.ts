/**
 * app/api/notifications/route.ts
 * Phase 9 — Notifications REST API
 * GET  /api/notifications        — list user's notifications
 * POST /api/notifications        — create notification (admin/system only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getUserNotifications,
  createNotification,
  type CreateNotificationPayload,
} from '@/services/notificationService';

export async function GET(req: NextRequest) {
  try {
    const supabase  = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit      = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const unreadOnly = searchParams.get('unread') === 'true';

    const notifications = await getUserNotifications(supabase as any, user.id, { limit, unreadOnly });
    return NextResponse.json({ notifications, count: notifications.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single();
    const role = (roleData as any)?.roles?.name;
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json() as CreateNotificationPayload;
    if (!body.userId || !body.type || !body.title || !body.body) {
      return NextResponse.json({ error: 'Missing required fields: userId, type, title, body' }, { status: 400 });
    }

    const notification = await createNotification(supabase as any, body);
    if (!notification) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
