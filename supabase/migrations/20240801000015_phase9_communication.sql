-- =============================================================================
-- Migration: 20240801000015_phase9_communication.sql
-- Date:       2024-08-01
-- Phase:      9 — Communication Center, Notification Engine & Automation
-- Project:    Super Townhouse  (Supabase: jzcmfpvscdsvkijpgdlj)
-- Applied:    YES
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. COMMUNICATION LOGS
--    Unified delivery audit trail for every notification or email sent.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communication_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id  UUID REFERENCES notifications(id) ON DELETE SET NULL,
  recipient_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email  TEXT,
  channel          notification_channel NOT NULL,          -- email | in_app | sms | push | whatsapp
  event_type       TEXT NOT NULL,                          -- booking_confirmed | payment_success | etc.
  subject          TEXT,
  status           TEXT NOT NULL DEFAULT 'queued'
                     CHECK (status IN ('queued','sent','delivered','failed','bounced','cancelled')),
  provider         TEXT,                                   -- resend | sendgrid | ses | internal
  provider_msg_id  TEXT,
  retry_count      SMALLINT NOT NULL DEFAULT 0,
  last_error       TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at          TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  failed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. EMAIL QUEUE
--    Async outbound email queue — provider-agnostic.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_queue (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email         TEXT NOT NULL,
  to_name          TEXT,
  from_email       TEXT NOT NULL DEFAULT 'noreply@supertownhouse.com',
  from_name        TEXT NOT NULL DEFAULT 'Super Townhouse',
  reply_to         TEXT,
  subject          TEXT NOT NULL,
  template_id      TEXT NOT NULL,                          -- welcome | booking_confirmed | etc.
  template_vars    JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_body        TEXT,
  text_body        TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','sent','failed','cancelled')),
  priority         SMALLINT NOT NULL DEFAULT 5,            -- 1=urgent … 10=low
  scheduled_at     TIMESTAMPTZ,                            -- NULL = send immediately
  sent_at          TIMESTAMPTZ,
  retry_count      SMALLINT NOT NULL DEFAULT 0,
  max_retries      SMALLINT NOT NULL DEFAULT 3,
  last_error       TEXT,
  communication_log_id UUID REFERENCES communication_logs(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. AUTOMATION LOGS
--    Records every automation rule that fired.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_event    TEXT NOT NULL,                          -- booking_created | payment_success | etc.
  entity_type      TEXT,                                   -- booking | payment | review | room
  entity_id        TEXT,
  actions_taken    JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{action, status, detail}]
  status           TEXT NOT NULL DEFAULT 'success'
                     CHECK (status IN ('success','partial','failed','skipped')),
  duration_ms      INTEGER,
  error_message    TEXT,
  triggered_by     UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL = system
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. ACTIVITY FEED
--    Hotel-wide real-time event log shown in the admin dashboard.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_feed (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type       TEXT NOT NULL,
  actor_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name       TEXT,
  entity_type      TEXT,
  entity_id        TEXT,
  title            TEXT NOT NULL,
  description      TEXT,
  icon             TEXT,                                   -- lucide icon name
  color            TEXT DEFAULT 'primary',                 -- primary | green | red | yellow | blue
  link_href        TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. SCHEDULED REMINDERS
--    Pending future notifications / emails to fire at a specific time.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_type    TEXT NOT NULL,                          -- checkin_24h | checkin_2h | review_request | etc.
  entity_type      TEXT,
  entity_id        TEXT,
  recipient_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email  TEXT,
  channels         TEXT[] NOT NULL DEFAULT '{in_app}',     -- in_app | email | sms | whatsapp
  template_id      TEXT,
  template_vars    JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  executed_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','sent','failed','cancelled','skipped')),
  retry_count      SMALLINT NOT NULL DEFAULT 0,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. INDEXES for performance
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comm_logs_recipient  ON communication_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_status     ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_comm_logs_channel    ON communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_comm_logs_created    ON communication_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_queue_status   ON email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_created  ON email_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_trigger   ON automation_logs(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_created   ON automation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_type   ON activity_feed(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_status     ON scheduled_reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_recipient  ON scheduled_reminders(recipient_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. UPDATED_AT TRIGGERS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER trg_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. RLS POLICIES
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE communication_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue           ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reminders   ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything
CREATE POLICY "admin_all_comm_logs"      ON communication_logs    FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_email_queue"    ON email_queue           FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_automation"     ON automation_logs       FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_activity_feed"  ON activity_feed         FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "admin_all_scheduled"      ON scheduled_reminders   FOR ALL TO authenticated USING (is_admin());

-- Users can read their own communication logs
CREATE POLICY "user_own_comm_logs" ON communication_logs
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());

-- Users can read/update their own scheduled reminders
CREATE POLICY "user_own_scheduled" ON scheduled_reminders
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. HELPER FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- Get communication stats for the admin dashboard
CREATE OR REPLACE FUNCTION get_communication_stats()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_notifications',    (SELECT COUNT(*) FROM notifications),
    'unread_notifications',   (SELECT COUNT(*) FROM notifications WHERE NOT is_read),
    'emails_sent_today',      (SELECT COUNT(*) FROM email_queue WHERE status = 'sent' AND sent_at >= CURRENT_DATE),
    'emails_pending',         (SELECT COUNT(*) FROM email_queue WHERE status IN ('pending','processing')),
    'emails_failed',          (SELECT COUNT(*) FROM email_queue WHERE status = 'failed'),
    'automations_today',      (SELECT COUNT(*) FROM automation_logs WHERE created_at >= CURRENT_DATE),
    'automations_failed',     (SELECT COUNT(*) FROM automation_logs WHERE status = 'failed' AND created_at >= CURRENT_DATE),
    'scheduled_pending',      (SELECT COUNT(*) FROM scheduled_reminders WHERE status = 'pending' AND scheduled_at >= NOW()),
    'activity_feed_today',    (SELECT COUNT(*) FROM activity_feed WHERE created_at >= CURRENT_DATE)
  ) INTO result;
  RETURN result;
END;
$$;

-- Get recent activity feed for admin panel
CREATE OR REPLACE FUNCTION get_activity_feed(p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS SETOF activity_feed
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM activity_feed
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Get unread notification count for a specific user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID DEFAULT auth.uid())
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM notifications
  WHERE user_id = p_user_id AND NOT is_read;
$$;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID DEFAULT auth.uid())
RETURNS VOID
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE notifications SET is_read = TRUE WHERE user_id = p_user_id AND NOT is_read;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. REALTIME (enable Supabase Realtime on these tables)
-- ──────────────────────────────────────────────────────────────────────────────
-- Note: Realtime publication is configured via Supabase Dashboard / supabase_realtime publication.
-- Run via Supabase SQL editor:
--   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
--   ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
--   ALTER PUBLICATION supabase_realtime ADD TABLE email_queue;
