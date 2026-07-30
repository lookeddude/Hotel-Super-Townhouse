# Database Documentation — Super Townhouse

## Overview

**Platform:** Supabase (PostgreSQL 15)
**Project:** jzcmfpvscdsvkijpgdlj
**Migrations:** 15 migration files in `supabase/migrations/`

## Enums

| Enum | Values |
|---|---|
| `booking_status` | pending, confirmed, checked_in, checked_out, cancelled, no_show, waitlisted |
| `payment_status` | pending, authorized, paid, partially_refunded, refunded, failed, cancelled |
| `payment_method` | online, pay_at_hotel, bank_transfer, upi, card, cash, other |
| `room_status` | available, occupied, reserved, maintenance, out_of_service |
| `cleaning_status` | clean, dirty, in_progress, inspected |
| `notification_type` | booking_confirmed, booking_cancelled, payment_received, etc. |
| `maintenance_priority` | low, medium, high, urgent |
| `staff_role` | reception, housekeeping, maintenance, manager, chef, security, other |

## Core Tables

### Authentication
- `profiles` — Extended user profiles (linked to auth.users)
- `roles` — Role definitions (guest, reception, manager, admin, super_admin)
- `user_roles` — User ↔ Role assignments with optional expiry

### Hotel Configuration
- `hotel_information` — Hotel details, contact, policies
- `room_types` — Room categories with pricing and amenities
- `rooms` — Individual rooms with current status
- `amenities` — Hotel amenities catalog

### Bookings
- `bookings` — Master booking records
- `booking_rooms` — Booking ↔ Room assignments
- `booking_guests` — Additional guests
- `booking_status_history` — Status change audit trail
- `offers` — Discount codes and promotions

### Payments
- `payments` — Payment transactions (Razorpay)
- `invoices` — Generated invoices

### Content
- `reviews` — Guest reviews with moderation
- `gallery` — Hotel image gallery
- `notifications` — In-app notification inbox
- `notification_preferences` — Per-user channel preferences
- `contact_messages` — Contact form submissions

### Staff & Operations
- `staff` — Staff profiles and assignments
- `maintenance_requests` — Room maintenance tracking
- `audit_logs` — System-wide audit trail

### CMS
- `homepage_content` — Homepage section content
- `faq` — FAQ entries
- `seo_metadata` — Per-page SEO settings
- `settings` — Hotel configuration key-value store

### Communication (Phase 9)
- `communication_logs` — All outbound communications
- `email_queue` — Email delivery queue
- `automation_logs` — Event automation execution log
- `activity_feed` — Real-time hotel activity stream
- `scheduled_reminders` — Future notification/email queue

## RLS Policy Design

All tables have RLS enabled. Policy tiers:

1. **Public** — Anonymous can read: room_types, rooms, amenities, gallery, reviews (approved), faq, seo_metadata
2. **Authenticated** — Logged-in users can read/write their own data: bookings, notifications, profiles
3. **Admin** — Admin/manager roles have full access to all tables
4. **Super Admin** — Super admins can manage roles and system settings

## Helper Functions

| Function | Description |
|---|---|
| `has_role(user_id, role_name)` | Check if user has a specific role |
| `is_admin()` | Returns true for admin/super_admin |
| `is_super_admin()` | Returns true for super_admin only |
| `generate_booking_reference()` | Generates STH-XXXXXXXX reference |
| `update_updated_at()` | Trigger function for updated_at columns |
| `get_bi_dashboard_stats()` | Aggregated BI dashboard KPIs |
| `get_booking_analytics(days)` | Booking trend data |
| `get_room_analytics(days)` | Room performance data |
| `get_daily_revenue(days)` | Daily revenue time series |
| `global_search(query)` | Cross-entity full-text search |
