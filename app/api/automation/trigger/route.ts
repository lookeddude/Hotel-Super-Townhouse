/**
 * app/api/automation/trigger/route.ts
 * Phase 9 — Internal Automation Trigger Endpoint
 *
 * POST /api/automation/trigger
 * Body: { trigger, entityType, entityId, userId, adminId, data }
 *
 * Called internally from other API routes (payments, bookings, reviews, etc.)
 * Protected: requires Authorization: Bearer <INTERNAL_API_SECRET>
 * OR an authenticated admin session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { triggerAutomation, type AutomationTrigger, type AutomationContext } from '@/services/automationEngine';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Allow either internal API secret OR authenticated admin
    const authHeader = req.headers.get('authorization');
    const isInternal = INTERNAL_SECRET && authHeader === `Bearer ${INTERNAL_SECRET}`;

    let isAdmin = false;
    if (!isInternal) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .single();
        const role = (roleData as any)?.roles?.name;
        isAdmin = ['admin', 'super_admin'].includes(role ?? '');
      }
    }

    if (!isInternal && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      trigger:     AutomationTrigger;
      entityType?: string;
      entityId?:   string;
      userId?:     string;
      adminId?:    string;
      data?:       Record<string, string>;
    };

    if (!body.trigger) {
      return NextResponse.json({ error: 'trigger is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const ctx: AutomationContext = {
      entityType: body.entityType,
      entityId:   body.entityId,
      userId:     body.userId,
      adminId:    body.adminId,
      data:       body.data ?? {},
    };

    const result = await triggerAutomation(supabase as any, body.trigger, ctx);

    return NextResponse.json({
      success:     result.success,
      actions:     result.actions,
      durationMs:  result.durationMs,
      trigger:     body.trigger,
    }, { status: result.success ? 200 : 207 });

  } catch (err: any) {
    console.error('[api/automation/trigger]', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
