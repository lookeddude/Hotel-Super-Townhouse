# System Architecture — Super Townhouse

## Overview

Super Townhouse uses a **layered architecture** with clear separation between:
- **Presentation** (React components + Next.js pages)
- **Business Logic** (Service layer)
- **Data** (Supabase PostgreSQL with RLS)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENTS                           │
│           Browser          │         Admin Panel         │
└────────────┬───────────────┴──────────────┬─────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS 16 (App Router)                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Public     │  │   Dashboard  │  │     Admin      │  │
│  │  Pages      │  │   (Guest)    │  │    Panel       │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Edge Middleware (Auth + RBAC)           │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  API Route Handlers                  │ │
│  │  /api/payments  /api/notifications  /api/automation  │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────┘
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
      ┌────────────┐  ┌────────────┐  ┌───────────┐
      │  Supabase  │  │  Razorpay  │  │  Email    │
      │  (DB+Auth  │  │  Payments  │  │  Service  │
      │  +Storage  │  └────────────┘  │ (Resend/  │
      │  +Realtime)│                  │ SendGrid) │
      └────────────┘                  └───────────┘
```

## Key Design Decisions

### 1. Server Components by Default
All pages are Server Components unless they need interactivity. Client Components are isolated to interactive UI elements.

### 2. Service Layer Pattern
All database operations go through `services/*.ts` files. Pages and components never query Supabase directly — they call service functions.

### 3. RLS as the Security Boundary
Row Level Security is the authoritative security layer. Even if application code has a bug, RLS prevents unauthorized data access.

### 4. Event-Driven Communications
Business events → `automationEngine.triggerAutomation()` → notifications + emails + activity feed. Decoupled from business logic.

### 5. Provider-Agnostic Email
Email provider is swapped via `EMAIL_PROVIDER` env var. Changing from Resend to SendGrid requires zero code changes.

## Data Flow — Booking Creation

```
Guest → /book page → createBooking() service
  → Supabase INSERT (booking + booking_rooms)
  → triggerAutomation('booking_confirmed', ...)
    → createNotification() [in-app]
    → queueEmail('booking_confirmed') [email queue]
    → createActivityFeedEntry() [admin feed]
    → automation_logs INSERT
  → scheduleBookingReminders() [future reminders]
  → Response to client
```

## Authentication Flow

```
User → Login → Supabase Auth (JWT)
  → Session stored in secure httpOnly cookie
  → Edge Middleware reads cookie on every request
  → Middleware queries user_roles table
  → Routes protected based on role
  → Client receives session via SSR hydration
```

## Realtime Architecture

```
Supabase Postgres → Replication Slot → Realtime Service
  → Postgres Changes channel (bookings, notifications)
  → Frontend hook (useNotifications, useBookingRealtime)
  → React state update → UI re-render
```
