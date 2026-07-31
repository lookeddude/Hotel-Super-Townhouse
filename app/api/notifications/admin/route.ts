/**
 * app/api/notifications/admin/route.ts
 * Internal API — creates in-app notifications for ALL admin/super_admin users.
 * Uses service role key so it works from any context (guest booking, contact form, etc.)
 * POST /api/notifications/admin
 * Body: { type, title, body, data?, booking_id? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { type, title, body, data = {}, booking_id } = await req.json();

    if (!type || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields: type, title, body' }, { status: 400 });
    }

    // Get all admin / super_admin user IDs
    const { data: adminRoles, error: roleErr } = await serviceClient
      .from('user_roles')
      .select('user_id, roles(name)')
      .in('roles.name', ['admin', 'super_admin']);

    if (roleErr) {
      console.error('[AdminNotif] role lookup error:', roleErr);
      return NextResponse.json({ error: 'Failed to lookup admin users' }, { status: 500 });
    }

    // Filter only admin/super_admin entries
    const adminUserIds: string[] = (adminRoles ?? [])
      .filter((r: any) => ['admin', 'super_admin'].includes(r.roles?.name))
      .map((r: any) => r.user_id)
      .filter(Boolean);

    if (adminUserIds.length === 0) {
      console.warn('[AdminNotif] No admin users found');
      return NextResponse.json({ success: true, inserted: 0 });
    }

    // Insert one notification per admin user
    const rows = adminUserIds.map(userId => ({
      user_id:    userId,
      type,
      channel:    'in_app',
      title,
      body,
      data,
      ...(booking_id ? { booking_id } : {}),
    }));

    const { data: inserted, error: insertErr } = await serviceClient
      .from('notifications')
      .insert(rows)
      .select('id');

    if (insertErr) {
      console.error('[AdminNotif] insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: inserted?.length ?? 0 });
  } catch (err: any) {
    console.error('[AdminNotif] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
