import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/services/emailService';

/**
 * POST /api/email/send
 * Sends a booking confirmation email via Resend.
 * Called from the client after a successful booking.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      templateId,
      to,
      toName,
      vars,
    } = body;

    if (!templateId || !to) {
      return NextResponse.json({ error: 'Missing required fields: templateId, to' }, { status: 400 });
    }

    const result = await sendEmail({ templateId, to, toName, vars });

    if (!result.success) {
      console.error('[/api/email/send] Failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId, provider: result.provider });
  } catch (err: any) {
    console.error('[/api/email/send] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
