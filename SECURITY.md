# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | ✅ Yes |
| < 1.0 | ❌ No |

## Reporting a Vulnerability

Please **do NOT** report security vulnerabilities through public GitHub issues.

Report security vulnerabilities by emailing: **security@supertownhouse.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge your email within 48 hours and provide a detailed response within 7 days.

## Security Practices

### Authentication
- Supabase Auth with JWT tokens
- Row Level Security (RLS) enforced on ALL database tables
- Role-Based Access Control (RBAC) — 5 roles: guest, reception, manager, admin, super_admin
- Edge middleware validates session on every protected route

### Secrets
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to client
- `RAZORPAY_KEY_SECRET` is server-only — never exposed to client  
- `RAZORPAY_WEBHOOK_SECRET` used for webhook signature verification
- All secrets loaded from environment variables — never hardcoded

### Payment Security
- Razorpay webhook signature verification (HMAC SHA-256)
- Payment amounts verified server-side before capture
- No card data stored — Razorpay handles PCI compliance

### HTTP Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS) with preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy restricts camera, microphone, geolocation

### Input Validation
- Zod schema validation on all forms
- Server-side validation on all API routes
- Parameterized Supabase queries (no SQL injection risk)
- User input sanitized before storage

### Database
- RLS policies on all 20+ tables
- Least-privilege access — users only see their own data
- Admin operations require verified admin role
- Audit logs track all sensitive operations
