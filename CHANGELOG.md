# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2024-08-01

### Phase 10 — Production Audit & Deployment
#### Fixed
- ESLint configuration — suppressed intentional any types for Supabase abstraction layer
- Security headers — CSP, HSTS, XSS protection, Referrer Policy, Permissions Policy
- Next.js configuration — image optimization (AVIF/WebP), performance tuning
- Package scripts — added type-check, lint:fix, clean scripts
- robots.txt — proper crawl directives
- sitemap.xml — complete URL sitemap for SEO
- Vercel deployment configuration
- Production documentation suite

#### Added
- .env.example with all required variables
- README.md — comprehensive project documentation
- ARCHITECTURE.md — system design document
- DATABASE.md — schema documentation
- API.md — REST API documentation
- DEPLOYMENT.md — Vercel deployment guide
- ADMIN_GUIDE.md — hotel operations guide
- SECURITY.md — security policy and vulnerability reporting
- CONTRIBUTING.md — contribution guidelines
- ROADMAP.md — planned features
- CHANGELOG.md — this file
- vercel.json — Vercel deployment configuration

---

## [0.9.0] - 2024-08-01

### Phase 9 — Communication Center & Notification Engine
#### Added
- Notification service — create, read, mark-read, delete, broadcast, preferences
- Email service — provider-agnostic (Resend / SendGrid / SES / console)
- 15 production HTML email templates
- Automation engine — 20 event trigger types
- Activity feed service — real-time hotel event log
- Scheduler service — scheduled reminders
- NotificationBell component — real-time unread badge with slide-over panel
- ActivityFeed component — admin dashboard widget
- Admin Communication Center — email queue, automation logs, activity feed
- User notification center — All/Unread/Preferences tabs with toggle switches
- REST API routes — notifications CRUD, automation trigger
- Admin sidebar Communications section
- Database — communication_logs, email_queue, automation_logs, activity_feed, scheduled_reminders tables

---

## [0.8.0] - 2024-08-01

### Phase 8 — Analytics & Business Intelligence
#### Added
- Business Intelligence dashboard with real-time KPIs
- Revenue analytics with daily/weekly/monthly charts
- Booking trend analysis
- Room performance metrics
- Guest analytics
- Global search across all entities
- Supabase RPC functions for aggregated analytics
- CSV export functionality

---

## [0.7.0] - 2024-08-01

### Phase 7 — Payment & Financial System
#### Added
- Razorpay payment gateway integration
- Online payment orders and verification
- Pay-at-hotel option
- Webhook handler with signature verification
- Refund processing
- Invoice generation
- Payment history dashboard
- Admin payment management with refund capability

---

## [0.6.0] - 2024-08-01

### Phase 6 — Booking Engine
#### Added
- Multi-step booking wizard
- Real-time room availability checking
- Offer/promo code validation
- Price breakdown calculation
- Booking confirmation with reference number
- Booking status management (pending → confirmed → checked-in → checked-out)
- Admin booking management with calendar view
- Realtime booking updates via Supabase Realtime

---

## [0.5.0] - 2024-08-01

### Phase 5 — Hotel CMS
#### Added
- Admin CMS for website content management
- Room type and room management
- Gallery management with Supabase Storage
- Review moderation system
- Offer/promotion management
- FAQ management
- Contact form with admin inbox

---

## [0.4.0] - 2024-08-01

### Phase 4 — Authentication & RBAC
#### Added
- Supabase Auth integration
- Role-based access control (guest, reception, manager, admin, super_admin)
- Edge middleware for route protection
- Admin role verification in middleware
- Guest registration and login flows
- Password reset via email
- OAuth-ready auth configuration

---

## [0.3.0] - 2024-08-01

### Phase 3 — Database Architecture
#### Added
- 15 PostgreSQL migrations
- Complete hotel schema — profiles, rooms, bookings, payments, reviews, notifications
- Row Level Security policies for all tables
- Database helper functions (has_role, is_admin, is_super_admin)
- Audit logging system
- Seed data — room types, amenities, hotel info

---

## [0.2.0] - 2024-08-01

### Phase 2 — Supabase Setup
#### Added
- Supabase project initialization
- Server-side Supabase client (@supabase/ssr)
- Client-side Supabase provider
- Middleware Supabase client
- Type-safe database types

---

## [0.1.0] - 2024-08-01

### Phase 1 — Frontend Foundation
#### Added
- Next.js 16 project with App Router
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4 with custom design system
- Custom color palette (Material Design 3 inspired)
- Typography system
- Component library foundation
- Public pages — Home, Rooms, Gallery, About, Contact, Facilities, Policies, FAQ
- Admin layout with sidebar and topbar
- Guest dashboard layout
- Responsive navigation
