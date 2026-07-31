/**
 * services/emailTemplates.ts
 * Phase 9 — HTML Email Templates
 *
 * 15 production-ready templates.
 * Every template is a pure function: (vars) => { subject, html, text }
 * Provider-agnostic — consumed by emailService.ts
 */

export type EmailTemplateId =
  | 'welcome'
  | 'verify_email'
  | 'password_reset'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_modified'
  | 'payment_success'
  | 'payment_failed'
  | 'invoice_generated'
  | 'receipt_generated'
  | 'checkin_reminder'
  | 'checkout_reminder'
  | 'review_request'
  | 'contact_confirmation'
  | 'admin_alert';

export interface EmailTemplate {
  subject: string;
  html:    string;
  text:    string;
}

// ─── Shared design tokens ─────────────────────────────────────────────────────
const PRIMARY   = '#7C3AED';
const BG        = '#F8F7FF';
const TEXT      = '#1C1B1F';
const SUBTEXT   = '#6B6B7C';
const BORDER    = '#E4E0F0';
const WHITE     = '#FFFFFF';

function baseLayout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Super Townhouse</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:${BG};">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <!-- HEADER -->
      <tr><td style="background:${PRIMARY};border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:${WHITE};font-size:24px;font-weight:700;letter-spacing:-0.5px;">🏨 Super Townhouse</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Premium Hospitality Experience</p>
      </td></tr>
      <!-- BODY -->
      <tr><td style="background:${WHITE};padding:40px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
        ${content}
      </td></tr>
      <!-- FOOTER -->
      <tr><td style="background:${BG};border:1px solid ${BORDER};border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:${SUBTEXT};">Super Townhouse &middot; CA Plot 87, near Aster Hospital, Sadara Mangala Industrial Area, Bengaluru 560048</p>
        <p style="margin:6px 0 0;font-size:11px;color:${SUBTEXT};">
          <a href="tel:+918000000000" style="color:${SUBTEXT};text-decoration:none;">+91 80 0000 0000</a> &middot;
          <a href="mailto:info@supertownhouse.com" style="color:${SUBTEXT};text-decoration:none;">info@supertownhouse.com</a> &middot;
          <a href="https://www.google.com/travel/hotels/s/wwt7siZmQoKJDQ6f7" style="color:${SUBTEXT};text-decoration:none;">📍 Get Directions</a>
        </p>
        <p style="margin:12px 0 0;font-size:11px;color:${SUBTEXT};">
          You received this email because you have an account at Super Townhouse.<br/>
          <a href="{{unsubscribe_url}}" style="color:${SUBTEXT};">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(label: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${PRIMARY};color:${WHITE};font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">${label}</a>
  </div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;font-size:14px;color:${SUBTEXT};width:40%;">${label}</td>
    <td style="padding:10px 0;font-size:14px;color:${TEXT};font-weight:600;">${value}</td>
  </tr>`;
}

function infoTable(...rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:8px;padding:8px 16px;margin:20px 0;">
    ${rows.map(([l, v]) => infoRow(l, v)).join('')}
  </table>`;
}

function heading(text: string, emoji = ''): string {
  return `<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${TEXT};">${emoji ? emoji + ' ' : ''}${text}</h2>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${SUBTEXT};line-height:1.6;">${text}</p>`;
}

// ─── Template implementations ─────────────────────────────────────────────────

export function renderEmailTemplate(
  templateId: EmailTemplateId,
  vars: Record<string, string>
): EmailTemplate {
  const v = (key: string, fallback = '') => vars[key] ?? fallback;

  switch (templateId) {

    // ── 1. Welcome ──────────────────────────────────────────────────────────
    case 'welcome': {
      const html = baseLayout(`
        ${heading('Welcome to Super Townhouse!', '🎉')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, we're thrilled to have you. Your account is all set — explore our premium rooms and make your first booking today.`)}
        ${btn('Explore Rooms', v('rooms_url', 'https://supertownhouse.com/rooms'))}
        ${para('Questions? Reply to this email anytime — we\'re always here to help.')}
      `, `Welcome, ${v('name', 'Guest')}! Your Super Townhouse account is ready.`);

      return {
        subject: `Welcome to Super Townhouse, ${v('name', 'Guest')}!`,
        html,
        text: `Welcome, ${v('name')}! Your account is ready. Visit: ${v('rooms_url')}`,
      };
    }

    // ── 2. Email Verification ───────────────────────────────────────────────
    case 'verify_email': {
      const html = baseLayout(`
        ${heading('Verify Your Email', '✉️')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, please verify your email address to activate your account.`)}
        ${btn('Verify Email Address', v('verify_url'))}
        ${para('This link expires in 24 hours. If you didn\'t create an account, you can ignore this email.')}
      `, 'Please verify your email to activate your Super Townhouse account.');

      return {
        subject: 'Verify your Super Townhouse account',
        html,
        text: `Hi ${v('name')}, verify your email: ${v('verify_url')}`,
      };
    }

    // ── 3. Password Reset ───────────────────────────────────────────────────
    case 'password_reset': {
      const html = baseLayout(`
        ${heading('Reset Your Password', '🔐')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, we received a request to reset your password. Click below to create a new one.`)}
        ${btn('Reset Password', v('reset_url'))}
        ${para('This link expires in 1 hour. If you didn\'t request this, please ignore this email — your password is safe.')}
      `, 'Reset your Super Townhouse password.');

      return {
        subject: 'Reset your Super Townhouse password',
        html,
        text: `Hi ${v('name')}, reset your password: ${v('reset_url')}`,
      };
    }

    // ── 4. Booking Confirmed ─────────────────────────────────────────────────────
    case 'booking_confirmed': {
      const html = baseLayout(`
        ${heading('Booking Confirmed!', '✅')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, your reservation at Super Townhouse is confirmed. We look forward to hosting you!`)}
        ${infoTable(
          ['Booking Reference', v('booking_ref')],
          ['Room', v('room_name')],
          ['Check-in', v('check_in')],
          ['Check-out', v('check_out')],
          ['Guests', v('guests', '1')],
          ['Total Amount', v('total_amount')],
          ['Payment Status', v('payment_status', 'Pending')]
        )}
        ${btn('View My Booking', v('booking_url'))}
        <div style="background:#F8F7FF;border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1C1B1F;">📍 Hotel Location</p>
          <p style="margin:0 0 10px;font-size:13px;color:#6B6B7C;line-height:1.6;">CA, Plot Number 1, 87, near Aster Hospital,<br/>Sadara Mangala Industrial Area,<br/>Bengaluru, Karnataka 560048</p>
          <a href="https://www.google.com/travel/hotels/s/wwt7siZmQoKJDQ6f7" target="_blank"
            style="display:inline-block;font-size:12px;font-weight:600;color:#7C3AED;text-decoration:none;border:1px solid #7C3AED;border-radius:6px;padding:6px 14px;">
            🗺️ Open in Google Maps
          </a>
        </div>
        ${para('Check-in: 2:00 PM &nbsp;|&nbsp; Check-out: 12:00 PM &nbsp;|&nbsp; Need help? <a href="tel:+918000000000" style="color:#7C3AED;">Call us</a>')}
      `, `Booking ${v('booking_ref')} confirmed — ${v('check_in')} to ${v('check_out')}`);

      return {
        subject: `Booking Confirmed — ${v('booking_ref')} · Super Townhouse`,
        html,
        text: `Booking ${v('booking_ref')} confirmed. Check-in: ${v('check_in')} Check-out: ${v('check_out')}. Total: ${v('total_amount')}. View: ${v('booking_url')}`,
      };
    }

    // ── 5. Booking Cancelled ─────────────────────────────────────────────────
    case 'booking_cancelled': {
      const html = baseLayout(`
        ${heading('Booking Cancelled', '❌')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, your booking has been cancelled as requested.`)}
        ${infoTable(
          ['Booking Reference', v('booking_ref')],
          ['Room', v('room_name')],
          ['Check-in', v('check_in')],
          ['Refund Amount', v('refund_amount', '₹0')],
          ['Refund Status', v('refund_status', 'Processing')]
        )}
        ${para('If you cancelled by mistake or would like to rebook, we\'d love to have you back.')}
        ${btn('Book Again', v('rooms_url', 'https://supertownhouse.com/rooms'))}
      `, `Booking ${v('booking_ref')} has been cancelled.`);

      return {
        subject: `Booking Cancelled — ${v('booking_ref')} · Super Townhouse`,
        html,
        text: `Booking ${v('booking_ref')} cancelled. Refund: ${v('refund_amount')}. Rebook: ${v('rooms_url')}`,
      };
    }

    // ── 6. Booking Modified ──────────────────────────────────────────────────
    case 'booking_modified': {
      const html = baseLayout(`
        ${heading('Booking Updated', '✏️')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, your booking details have been updated.`)}
        ${infoTable(
          ['Booking Reference', v('booking_ref')],
          ['New Check-in',  v('check_in')],
          ['New Check-out', v('check_out')],
          ['New Total',     v('total_amount')]
        )}
        ${btn('View Updated Booking', v('booking_url'))}
      `, `Your booking ${v('booking_ref')} has been updated.`);

      return {
        subject: `Booking Updated — ${v('booking_ref')} · Super Townhouse`,
        html,
        text: `Booking ${v('booking_ref')} updated. New dates: ${v('check_in')} to ${v('check_out')}. View: ${v('booking_url')}`,
      };
    }

    // ── 7. Payment Successful ────────────────────────────────────────────────
    case 'payment_success': {
      const html = baseLayout(`
        ${heading('Payment Successful', '💳')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, we've received your payment. Thank you!`)}
        ${infoTable(
          ['Payment Reference', v('payment_ref')],
          ['Booking Reference', v('booking_ref')],
          ['Amount Paid',       v('amount')],
          ['Payment Method',    v('method', 'Online')],
          ['Date',              v('paid_at')]
        )}
        ${btn('View Invoice', v('invoice_url'))}
      `, `Payment of ${v('amount')} received for booking ${v('booking_ref')}.`);

      return {
        subject: `Payment Received — ${v('amount')} · Super Townhouse`,
        html,
        text: `Payment of ${v('amount')} for booking ${v('booking_ref')} received. Invoice: ${v('invoice_url')}`,
      };
    }

    // ── 8. Payment Failed ────────────────────────────────────────────────────
    case 'payment_failed': {
      const html = baseLayout(`
        ${heading('Payment Failed', '⚠️')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, unfortunately your payment for booking <strong>${v('booking_ref')}</strong> could not be processed.`)}
        ${para(`Reason: ${v('failure_reason', 'Transaction declined by bank.')}`)}
        ${para('Please try again with a different payment method or contact your bank.')}
        ${btn('Retry Payment', v('booking_url'))}
        ${para('Need help? Contact us at +91 11 4123 4567 or info@supertownhouse.com')}
      `, `Payment failed for booking ${v('booking_ref')}. Please try again.`);

      return {
        subject: `Payment Failed — Booking ${v('booking_ref')} · Action Required`,
        html,
        text: `Payment failed for booking ${v('booking_ref')}. Retry: ${v('booking_url')}`,
      };
    }

    // ── 9. Invoice Generated ─────────────────────────────────────────────────
    case 'invoice_generated': {
      const html = baseLayout(`
        ${heading('Your Invoice is Ready', '🧾')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, your invoice for booking <strong>${v('booking_ref')}</strong> is now available.`)}
        ${infoTable(
          ['Invoice #',        v('invoice_number')],
          ['Booking Reference',v('booking_ref')],
          ['Total Amount',     v('total_amount')],
          ['Issue Date',       v('issue_date')]
        )}
        ${btn('Download Invoice', v('invoice_url'))}
      `, `Invoice ${v('invoice_number')} for ${v('total_amount')} is ready.`);

      return {
        subject: `Invoice ${v('invoice_number')} — Super Townhouse`,
        html,
        text: `Invoice ${v('invoice_number')} for booking ${v('booking_ref')}. Total: ${v('total_amount')}. Download: ${v('invoice_url')}`,
      };
    }

    // ── 10. Receipt Generated ────────────────────────────────────────────────
    case 'receipt_generated': {
      const html = baseLayout(`
        ${heading('Payment Receipt', '✅')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, here is your receipt for the payment of <strong>${v('amount')}</strong>.`)}
        ${infoTable(
          ['Receipt #',       v('receipt_number')],
          ['Payment Ref',     v('payment_ref')],
          ['Booking Ref',     v('booking_ref')],
          ['Amount',          v('amount')],
          ['Date',            v('date')]
        )}
        ${btn('View Receipt', v('receipt_url'))}
      `);

      return {
        subject: `Payment Receipt — ${v('amount')} · Super Townhouse`,
        html,
        text: `Receipt for ${v('amount')}. Booking: ${v('booking_ref')}. View: ${v('receipt_url')}`,
      };
    }

    // ── 11. Check-in Reminder (24h) ──────────────────────────────────────────
    case 'checkin_reminder': {
      const html = baseLayout(`
        ${heading('Check-in Tomorrow!', '🗓️')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, your stay at Super Townhouse begins <strong>tomorrow</strong>. We can't wait to welcome you!`)}
        ${infoTable(
          ['Booking Reference', v('booking_ref')],
          ['Room',              v('room_name')],
          ['Check-in Date',     v('check_in')],
          ['Check-in Time',     '2:00 PM onwards'],
          ['Check-out',         v('check_out')]
        )}
        <div style="background:${BG};border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;font-size:13px;color:${SUBTEXT};"><strong>📍 Address:</strong> Karol Bagh, New Delhi 110005<br/>
          <strong>📞 Concierge:</strong> +91 11 4123 4567<br/>
          <strong>🚗 Parking:</strong> Complimentary valet available</p>
        </div>
        ${btn('View Booking', v('booking_url'))}
      `, `Your Super Townhouse stay begins tomorrow — ${v('check_in')}`);

      return {
        subject: `See You Tomorrow! Check-in ${v('check_in')} — Super Townhouse`,
        html,
        text: `Reminder: Check-in tomorrow ${v('check_in')} for booking ${v('booking_ref')}. View: ${v('booking_url')}`,
      };
    }

    // ── 12. Check-out Reminder ───────────────────────────────────────────────
    case 'checkout_reminder': {
      const html = baseLayout(`
        ${heading('Check-out Today', '👋')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, thank you for staying with us! Today is your check-out day.`)}
        ${infoTable(
          ['Booking Reference', v('booking_ref')],
          ['Check-out Time',    '12:00 PM (Noon)'],
          ['Late Check-out',    'Available on request · Extra charges apply']
        )}
        ${para('Please leave your key card at the reception. We hope you had a wonderful stay!')}
        ${btn('Rate Your Stay', v('review_url'))}
      `, `Today is your check-out day. Thank you for staying with us!`);

      return {
        subject: `Check-out Today — Booking ${v('booking_ref')} · Super Townhouse`,
        html,
        text: `Today is check-out day for booking ${v('booking_ref')}. Check-out by 12 PM. Rate your stay: ${v('review_url')}`,
      };
    }

    // ── 13. Review Request ───────────────────────────────────────────────────
    case 'review_request': {
      const html = baseLayout(`
        ${heading('How Was Your Stay?', '⭐')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, we hope you enjoyed your stay at Super Townhouse! Your feedback helps us serve guests better.`)}
        ${para('It only takes 2 minutes — and your review means the world to us.')}
        ${btn('Write a Review', v('review_url'))}
        ${para('Thank you for choosing Super Townhouse. We hope to welcome you back soon!')}
      `, 'We\'d love to hear about your stay!');

      return {
        subject: `How Was Your Stay? Share Your Review — Super Townhouse`,
        html,
        text: `Hi ${v('name')}, please review your stay at Super Townhouse: ${v('review_url')}`,
      };
    }

    // ── 14. Contact Form Confirmation ────────────────────────────────────────
    case 'contact_confirmation': {
      const html = baseLayout(`
        ${heading('We Got Your Message!', '📬')}
        ${para(`Hi <strong>${v('name', 'Guest')}</strong>, thank you for reaching out. We've received your message and will respond within 24 hours.`)}
        ${infoTable(
          ['Subject', v('subject', 'General Inquiry')],
          ['Reference #', v('ticket_id', 'N/A')],
          ['Submitted', v('submitted_at')]
        )}
        ${para('In the meantime, you can reach us directly at <strong>+91 11 4123 4567</strong>.')}
      `, 'We received your message and will get back to you soon.');

      return {
        subject: `We Received Your Message — Super Townhouse`,
        html,
        text: `Hi ${v('name')}, we received your message (Ref: ${v('ticket_id')}). We'll respond within 24 hours.`,
      };
    }

    // ── 15. Admin Alert ──────────────────────────────────────────────────────
    case 'admin_alert': {
      const html = baseLayout(`
        ${heading(v('alert_title', 'Admin Alert'), '🚨')}
        ${para(v('alert_body', 'An automated alert has been triggered.'))}
        ${v('entity_type') ? infoTable(
          ['Entity Type', v('entity_type')],
          ['Entity ID',   v('entity_id', '—')],
          ['Severity',    v('severity', 'normal')],
          ['Time',        v('time')]
        ) : ''}
        ${v('action_url') ? btn('View Details', v('action_url')) : ''}
      `, v('alert_title'));

      return {
        subject: `[Alert] ${v('alert_title')} — Super Townhouse Admin`,
        html,
        text: `ADMIN ALERT: ${v('alert_title')}\n${v('alert_body')}`,
      };
    }

    default:
      return {
        subject: 'Super Townhouse Notification',
        html:    baseLayout(`<p>You have a new notification from Super Townhouse.</p>`),
        text:    'You have a new notification from Super Townhouse.',
      };
  }
}

/** Get list of all available template IDs */
export const EMAIL_TEMPLATE_IDS: EmailTemplateId[] = [
  'welcome', 'verify_email', 'password_reset',
  'booking_confirmed', 'booking_cancelled', 'booking_modified',
  'payment_success', 'payment_failed', 'invoice_generated', 'receipt_generated',
  'checkin_reminder', 'checkout_reminder', 'review_request',
  'contact_confirmation', 'admin_alert',
];
