/**
 * services/emailService.ts
 * Phase 9 — Provider-Agnostic Email Service
 *
 * Supports: Resend | SendGrid | Amazon SES | Console (dev)
 * Switch provider by setting EMAIL_PROVIDER env var.
 * Never import provider SDKs directly — all goes through this service.
 */

import { renderEmailTemplate, type EmailTemplateId } from './emailTemplates';

export type EmailProvider = 'resend' | 'sendgrid' | 'ses' | 'brevo' | 'console';

export interface SendEmailPayload {
  to:           string;
  toName?:      string;
  subject?:     string;          // overrides template subject if set
  templateId:   EmailTemplateId;
  vars:         Record<string, string>;
  from?:        string;
  fromName?:    string;
  replyTo?:     string;
  priority?:    number;          // 1 = urgent, 5 = normal, 10 = low
}

export interface EmailResult {
  success:      boolean;
  messageId?:   string;
  error?:       string;
  provider:     EmailProvider;
}

const DEFAULT_FROM      = process.env.EMAIL_FROM      ?? 'noreply@supertownhouse.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Super Townhouse';
const PROVIDER          = (process.env.EMAIL_PROVIDER ?? 'console') as EmailProvider;

// ─── Provider implementations ─────────────────────────────────────────────────

/** Resend (https://resend.com) — set RESEND_API_KEY */
async function sendViaResend(
  to: string, toName: string, from: string, fromName: string,
  subject: string, html: string, text: string, replyTo?: string
): Promise<EmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     `${fromName} <${from}>`,
        to:       toName ? `${toName} <${to}>` : to,
        subject,
        html,
        text,
        reply_to: replyTo,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Resend error');
    return { success: true, messageId: data.id, provider: 'resend' };
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'resend' };
  }
}

/** SendGrid — set SENDGRID_API_KEY */
async function sendViaSendGrid(
  to: string, toName: string, from: string, fromName: string,
  subject: string, html: string, text: string, replyTo?: string
): Promise<EmailResult> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error('SENDGRID_API_KEY not set');

    const body = {
      personalizations: [{ to: [{ email: to, name: toName }] }],
      from:     { email: from, name: fromName },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content:  [{ type: 'text/html', value: html }, { type: 'text/plain', value: text }],
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }
    const msgId = res.headers.get('X-Message-Id') ?? undefined;
    return { success: true, messageId: msgId, provider: 'sendgrid' };
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'sendgrid' };
  }
}

/** Amazon SES — set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION */
async function sendViaSES(
  _to: string, _toName: string, _from: string, _fromName: string,
  _subject: string, _html: string, _text: string
): Promise<EmailResult> {
  try {
    throw new Error('AWS SES not yet configured. Set EMAIL_PROVIDER=resend or brevo.');
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'ses' };
  }
}

/** Brevo (https://brevo.com) — set BREVO_API_KEY */
async function sendViaBrevo(
  to: string, toName: string, from: string, fromName: string,
  subject: string, html: string, text: string, replyTo?: string
): Promise<EmailResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error('BREVO_API_KEY not set');

    const body: any = {
      sender:      { name: fromName, email: from },
      to:          [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    };
    if (replyTo) body.replyTo = { email: replyTo };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
    return { success: true, messageId: data.messageId, provider: 'brevo' };
  } catch (err: any) {
    return { success: false, error: err.message, provider: 'brevo' };
  }
}

/** Console (development) — logs to stdout via console.info */
async function sendViaConsole(
  to: string, subject: string, text: string
): Promise<EmailResult> {
  console.info('\n[EMAIL DEV] ─────────────────────────────────────');
  console.info(`[EMAIL DEV] To:      ${to}`);
  console.info(`[EMAIL DEV] Subject: ${subject}`);
  console.info(`[EMAIL DEV] Preview: ${text.slice(0, 200)}`);
  console.info('[EMAIL DEV] ─────────────────────────────────────\n');
  return { success: true, messageId: `console-${Date.now()}`, provider: 'console' };
}

// ─── Main send function ───────────────────────────────────────────────────────

/**
 * Send a templated email via the configured provider.
 * Always resolves — never throws. Check result.success.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<EmailResult> {
  try {
    const template = renderEmailTemplate(payload.templateId, payload.vars);

    const to       = payload.to;
    const toName   = payload.toName  ?? '';
    const from     = payload.from    ?? DEFAULT_FROM;
    const fromName = payload.fromName ?? DEFAULT_FROM_NAME;
    const subject  = payload.subject ?? template.subject;
    const replyTo  = payload.replyTo;

    switch (PROVIDER) {
      case 'resend':   return sendViaResend(to, toName, from, fromName, subject, template.html, template.text, replyTo);
      case 'sendgrid': return sendViaSendGrid(to, toName, from, fromName, subject, template.html, template.text, replyTo);
      case 'ses':      return sendViaSES(to, toName, from, fromName, subject, template.html, template.text);
      case 'brevo':    return sendViaBrevo(to, toName, from, fromName, subject, template.html, template.text, replyTo);
      default:         return sendViaConsole(to, subject, template.text);
    }
  } catch (err: any) {
    console.error('[emailService] sendEmail unhandled:', err);
    return { success: false, error: err.message, provider: PROVIDER };
  }
}

/**
 * Queue an email in the database (non-blocking).
 * The email_queue table is processed by the Supabase Edge Function (cron).
 */
export async function queueEmail(
  supabase: any,
  payload: SendEmailPayload & { scheduledAt?: string }
): Promise<string | null> {
  try {
    const template = renderEmailTemplate(payload.templateId, payload.vars);
    const { data, error } = await (supabase as any)
      .from('email_queue')
      .insert({
        to_email:       payload.to,
        to_name:        payload.toName,
        from_email:     payload.from      ?? DEFAULT_FROM,
        from_name:      payload.fromName  ?? DEFAULT_FROM_NAME,
        reply_to:       payload.replyTo,
        subject:        payload.subject   ?? template.subject,
        template_id:    payload.templateId,
        template_vars:  payload.vars,
        html_body:      template.html,
        text_body:      template.text,
        priority:       payload.priority  ?? 5,
        scheduled_at:   payload.scheduledAt ?? null,
        status:         'pending',
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[emailService] queueEmail:', err);
    return null;
  }
}

/** Check email queue stats for the admin dashboard */
export async function getEmailQueueStats(supabase: any) {
  try {
    const { data } = await (supabase as any)
      .from('email_queue')
      .select('status')
      .order('created_at', { ascending: false })
      .limit(1000);

    const rows = data ?? [];
    return {
      pending:    rows.filter((r: any) => r.status === 'pending').length,
      processing: rows.filter((r: any) => r.status === 'processing').length,
      sent:       rows.filter((r: any) => r.status === 'sent').length,
      failed:     rows.filter((r: any) => r.status === 'failed').length,
      total:      rows.length,
    };
  } catch {
    return { pending: 0, processing: 0, sent: 0, failed: 0, total: 0 };
  }
}

/** Get email queue list for admin panel */
export async function getEmailQueue(supabase: any, limit = 50) {
  try {
    const { data } = await (supabase as any)
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

/** Retry a failed email */
export async function retryEmail(supabase: any, emailQueueId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('email_queue')
      .update({ status: 'pending', retry_count: 0, last_error: null })
      .eq('id', emailQueueId)
      .eq('status', 'failed');
    return !error;
  } catch {
    return false;
  }
}
