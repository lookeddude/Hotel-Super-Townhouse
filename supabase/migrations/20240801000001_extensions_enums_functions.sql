-- =============================================================================
-- Migration: 20240801000001_extensions_enums_functions.sql
-- Date:       2024-08-01
-- Project:    Super Townhouse
-- Applied:    YES - Supabase project jzcmfpvscdsvkijpgdlj
-- Description:
--   Installs required PostgreSQL extensions (uuid-ossp, pg_trgm, unaccent),
--   defines all custom ENUM types used across the schema, and creates core
--   utility functions: update_updated_at, generate_booking_reference, and
--   log_audit_event.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ---------------------------------------------------------------------------
-- Booking & Payment Enums
-- ---------------------------------------------------------------------------
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show',
  'waitlisted'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'online',
  'pay_at_hotel',
  'bank_transfer',
  'upi',
  'card',
  'cash',
  'other'
);

-- ---------------------------------------------------------------------------
-- Room Enums
-- ---------------------------------------------------------------------------
CREATE TYPE room_status AS ENUM (
  'available',
  'occupied',
  'reserved',
  'maintenance',
  'out_of_service'
);

CREATE TYPE cleaning_status AS ENUM (
  'clean',
  'dirty',
  'in_progress',
  'inspected'
);

-- ---------------------------------------------------------------------------
-- Review & Notification Enums
-- ---------------------------------------------------------------------------
CREATE TYPE review_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'flagged'
);

CREATE TYPE notification_type AS ENUM (
  'booking_confirmed',
  'booking_cancelled',
  'booking_reminder',
  'payment_received',
  'payment_failed',
  'review_request',
  'admin_alert',
  'marketing',
  'system'
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'push',
  'in_app'
);

-- ---------------------------------------------------------------------------
-- Maintenance Enums
-- ---------------------------------------------------------------------------
CREATE TYPE maintenance_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE maintenance_status AS ENUM (
  'reported',
  'in_progress',
  'resolved',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- Staff & Person Enums
-- ---------------------------------------------------------------------------
CREATE TYPE staff_role AS ENUM (
  'reception',
  'housekeeping',
  'maintenance',
  'manager',
  'chef',
  'security',
  'other'
);

CREATE TYPE gender AS ENUM (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);

CREATE TYPE id_type AS ENUM (
  'aadhar',
  'passport',
  'driving_license',
  'pan',
  'voter_id',
  'other'
);

-- ---------------------------------------------------------------------------
-- Core Functions
-- (See Supabase for full function bodies)
-- ---------------------------------------------------------------------------

-- update_updated_at: Trigger function that sets updated_at = NOW() on every
-- row update. Attach to any table that has an updated_at column.

-- generate_booking_reference: Generates a unique, human-readable booking
-- reference string (e.g. STH-20240801-ABCD).

-- log_audit_event: Inserts a row into the audit_logs table capturing the
-- table name, operation, old/new row data, and the acting user id.
