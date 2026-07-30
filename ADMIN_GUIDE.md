# Admin Guide — Super Townhouse

This guide covers day-to-day hotel operations through the admin panel.

## Accessing the Admin Panel

1. Go to `https://your-domain.com/admin`
2. Log in with your admin account
3. You must have role: `reception`, `manager`, `admin`, or `super_admin`

## Dashboard

The Business Intelligence dashboard shows:
- Revenue today, this month, this year
- Occupancy rate
- Bookings today (new, check-ins, check-outs)
- Pending payments
- Average rating
- Live activity feed

## Booking Management

### Creating a Booking
1. Go to **Bookings** → **New Booking**
2. Select guest, room type, dates
3. Set payment method
4. Confirm

### Booking Lifecycle
`Pending` → `Confirmed` → `Checked In` → `Checked Out`

- **Confirm** — Updates status, sends confirmation email
- **Check In** — Updates room status to Occupied
- **Check Out** — Updates room status to Available, triggers review request

## Room Management

Set room status:
- **Available** — Ready for booking
- **Occupied** — Guest currently staying
- **Maintenance** — Under repair
- **Out of Service** — Temporarily unavailable

## Payments

- View all payments with status
- Process refunds (requires Manager+ role)
- Download invoices
- Export payment reports as CSV

## Communication Center

### Email Queue
Monitor outgoing emails. If an email fails, click **Retry**.

### Activity Feed
Real-time stream of all hotel events — bookings, payments, reviews.

### Notifications
View all in-app notifications sent to guests.

## Analytics

- **Booking Analytics** — Booking trends, cancellation rates
- **Room Performance** — Most popular rooms, revenue per room
- **Guest Analytics** — New vs returning, geographic distribution
- **Revenue Reports** — Daily/monthly revenue, payment method breakdown

## User Roles

| Role | Permissions |
|---|---|
| `guest` | Own bookings, profile, notifications |
| `reception` | View bookings, check-in/check-out |
| `manager` | Full booking + payment management, refunds |
| `admin` | All above + user management, CMS, settings |
| `super_admin` | All above + role assignment, system config |

## First-Time Setup

1. **Hotel Information** — Go to CMS → Hotel Info → Update name, address, contact
2. **Room Types** — Go to Rooms → Room Types → Add your room categories
3. **Rooms** — Add individual rooms to each room type
4. **Amenities** — Set hotel amenities
5. **Gallery** — Upload hotel photos
6. **Settings** — Set check-in/check-out times, cancellation policy
7. **Create Admin User** — Register a user, then assign admin role via Supabase dashboard
