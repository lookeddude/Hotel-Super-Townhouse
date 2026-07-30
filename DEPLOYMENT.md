# Deployment Guide — Vercel

Super Townhouse is designed for zero-configuration deployment on Vercel.

## Prerequisites

- Vercel account (free tier works)
- Supabase project (free tier works)
- Razorpay account (test mode for staging)
- Domain name (optional)

## Deploy to Vercel

### Option A — One-Click (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lookeddude/Hotel-Super-Townhouse)

### Option B — Manual

1. **Import project** in Vercel Dashboard → Import from GitHub
2. Select `lookeddude/Hotel-Super-Townhouse`
3. Framework: **Next.js** (auto-detected)
4. Build Command: `npm run build` (default)
5. Output Directory: `.next` (default)

## Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role (server-only) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret (server-only) |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Razorpay webhook secret |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your production URL |
| `EMAIL_PROVIDER` | Optional | `resend` / `sendgrid` / `console` |
| `RESEND_API_KEY` | Optional | If using Resend |
| `INTERNAL_API_SECRET` | Optional | Internal API auth |

## Supabase Production Checklist

- [ ] Apply all 15 migrations: `supabase db push`
- [ ] Enable RLS on all tables (already done in migrations)
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Supabase Auth → URL Configuration
- [ ] Add your domain to Supabase Auth → Redirect URLs
- [ ] Configure Supabase Storage buckets (hotel-images, room-images, gallery)
- [ ] Enable Supabase Realtime for: bookings, notifications, activity_feed tables

## Razorpay Webhook Setup

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Select events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.created`
4. Copy webhook secret → set as `RAZORPAY_WEBHOOK_SECRET`

## Custom Domain

1. Vercel Dashboard → Project → Domains → Add Domain
2. Follow DNS configuration instructions
3. Update `NEXT_PUBLIC_SITE_URL` to your domain
4. Update Supabase Auth redirect URLs

## Monitoring

- Vercel Analytics — built-in (enable in Vercel Dashboard)
- Vercel Speed Insights — enable for Core Web Vitals
- Supabase Dashboard — database metrics, auth events
- Razorpay Dashboard — payment analytics
