# Database Migration System
# ──────────────────────────
# Super Townhouse — Hotel Super Townhouse (jzcmfpvscdsvkijpgdlj)
#
# ============================================================
# NAMING CONVENTION
# ============================================================
# Format: YYYYMMDDHHMMSS_<descriptive_name>.sql
#
# Examples:
#   20240801000001_create_enum_types.sql
#   20240801000002_create_users_table.sql
#   20240801000003_create_rooms_table.sql
#   20240801000004_create_bookings_table.sql
#   20240801000005_create_payments_table.sql
#   20240801000006_create_reviews_table.sql
#   20240801000007_create_notifications_table.sql
#   20240801000008_create_rls_policies.sql
#   20240801000009_create_indexes.sql
#   20240801000010_create_triggers.sql
#   20240801000011_create_functions.sql
#
# ============================================================
# ROLLBACK STRATEGY
# ============================================================
# Every migration file must include:
#   -- UP migration   (apply changes)
#   -- DOWN migration (reverse changes, commented out)
#
# To rollback via Supabase MCP:
#   Use apply_migration with the DOWN SQL
#
# ============================================================
# MIGRATION PHASES
# ============================================================
# Phase 3: Core schema
#   - Enums (booking_status, payment_status, room_type, user_role)
#   - Tables (rooms, bookings, users, payments, reviews, notifications)
#   - Indexes
#   - RLS Policies
#   - Triggers
#   - Database Functions
#
# Phase 4: Notifications schema
#   - Email queue table
#   - SMS log table
#
# Phase 5: Payments schema
#   - Razorpay orders table
#   - Refunds table
#
# ============================================================
# HOW TO APPLY MIGRATIONS
# ============================================================
# Via Supabase MCP:
#   apply_migration(project_id, name, query)
#
# Via Supabase CLI:
#   supabase db push
#
# ============================================================

-- Migrations will be added here as Phase 3 begins.
-- Do NOT manually edit the database outside of migrations.
