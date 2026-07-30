# 🏨 Super Townhouse — Hotel Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-green?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **Super Townhouse** is a full-stack, enterprise-grade Hotel Property Management System (PMS) built with Next.js 16, React 19, Supabase, and Razorpay. It powers end-to-end hotel operations — from guest bookings and payments to staff management, analytics, and real-time communications.

---

## ✨ Features

### Guest Experience
- 🏠 Beautiful public-facing website with room listings, gallery, facilities, FAQ
- 📅 Multi-step booking wizard with real-time availability
- 💳 Secure Razorpay payments (online + pay-at-hotel)
- 📧 Automated email confirmations via 15 HTML templates
- 🔔 Real-time in-app notifications with preference management
- ⭐ Review system with moderation
- 👤 Guest dashboard — bookings, payments, profile, notifications

### Admin & Operations
- 📊 Business Intelligence dashboard with live KPIs
- 📅 Reservation calendar (monthly/weekly view)
- 🏠 Room management with status tracking (available/occupied/maintenance)
- 💰 Payment management with refund processing
- 📈 Analytics — booking trends, revenue, room performance, guest analytics
- 🔍 Global cross-entity search
- 📝 Content Management System for website copy
- 🖼️ Gallery management
- ✉️ Communication Center — email queue, activity feed, automation logs
- 🤖 Event-driven automation engine with 20 trigger types
- ⏰ Scheduled reminders (check-in, check-out, review requests)

### Technical
- 🔐 Row Level Security (RLS) on all database tables
- 📡 Real-time updates via Supabase Realtime (Postgres Changes + Broadcast)
- 🛡️ Enterprise security headers (CSP, HSTS, XSS protection)
- 🚀 Edge middleware for auth with role-based access control (RBAC)
- 📱 Fully responsive design
- ♿ Accessible components (ARIA, keyboard navigation)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase account
- Razorpay account

### 1. Clone
```bash
git clone https://github.com/lookeddude/Hotel-Super-Townhouse.git
cd Hotel-Super-Townhouse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment variables
```bash
cp .env.example .env.local
# Fill in all required values (see .env.example for guidance)
```

### 4. Database setup
```bash
# Apply all migrations to your Supabase project
supabase db push
```

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system architecture.

```
super-townhouse/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public pages (/, /rooms, /gallery, /about…)
│   ├── (dashboard)/        # Authenticated guest pages
│   ├── (admin)/            # Admin-only pages
│   └── api/                # Route Handlers (payments, notifications, automation)
├── components/             # Shared UI components
├── features/               # Domain-specific feature components
├── hooks/                  # Custom React hooks (realtime, notifications, booking)
├── providers/              # Context providers (Supabase, Auth, Theme)
├── services/               # Server/client-agnostic service layer
├── lib/                    # Supabase clients, utilities
├── supabase/
│   ├── migrations/         # 15 database migrations
│   └── functions/          # Edge Functions
└── types/                  # TypeScript type definitions
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.x (strict mode) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT + Row Level Security) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Storage | Supabase Storage |
| Payments | Razorpay (orders, webhooks, refunds) |
| Email | Resend / SendGrid (provider-agnostic) |
| Styling | Tailwind CSS 4 + Custom Design System |
| Icons | Lucide React |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

---

## 🔐 Environment Variables

See [.env.example](.env.example) for all required environment variables.

**Never commit `.env.local` or any file containing secrets.**

---

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full Vercel deployment instructions.

---

## 📚 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and design decisions |
| [DATABASE.md](DATABASE.md) | Database schema and RLS policies |
| [API.md](API.md) | API route documentation |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel deployment guide |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | Hotel staff admin guide |
| [SECURITY.md](SECURITY.md) | Security practices and reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [ROADMAP.md](ROADMAP.md) | Planned features |

---

## 📄 License

[MIT License](LICENSE) — Copyright © 2024 Super Townhouse
