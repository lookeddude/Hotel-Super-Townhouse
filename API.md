# API Documentation — Super Townhouse

Base URL: `https://your-domain.com/api`

All API routes require authentication unless marked as 🌐 Public.

## Authentication

Authentication uses Supabase JWT tokens stored in secure httpOnly cookies. The Edge Middleware refreshes tokens automatically.

For internal API-to-API calls, use:
```
Authorization: Bearer <INTERNAL_API_SECRET>
```

## Endpoints

### Health Check 🌐
```
GET /api/health
```
Returns: `{ status: 'ok', timestamp, version }`

### Payments

#### Create Razorpay Order
```
POST /api/payments/create-order
Body: { bookingId, amount, currency }
Returns: { orderId, amount, currency, keyId }
```

#### Verify Payment
```
POST /api/payments/verify
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
Returns: { success, paymentId }
```

#### Pay at Hotel
```
POST /api/payments/pay-at-hotel
Body: { bookingId }
Returns: { success, bookingRef }
```

#### Process Refund (Admin)
```
POST /api/payments/refund
Body: { paymentId, amount, reason }
Returns: { success, refundId }
```

#### Razorpay Webhook 🌐
```
POST /api/payments/webhook
Headers: X-Razorpay-Signature: <signature>
Body: Razorpay event payload
```

### Notifications

#### List User Notifications
```
GET /api/notifications?limit=50&unread=true
Returns: { notifications: Notification[], count: number }
```

#### Create Notification (Admin)
```
POST /api/notifications
Body: { userId, type, title, body, channel?, actionUrl?, metadata? }
Returns: { notification: Notification }
```

#### Mark Notification Read
```
PATCH /api/notifications/:id
Returns: { success: true }
```

#### Delete Notification
```
DELETE /api/notifications/:id
Returns: { success: true }
```

#### Mark All Read
```
POST /api/notifications/mark-all-read
Returns: { success: true }
```

### Automation

#### Trigger Automation
```
POST /api/automation/trigger
Headers: Authorization: Bearer <INTERNAL_API_SECRET>
Body: {
  trigger: AutomationTrigger,
  entityType?: string,
  entityId?: string,
  userId?: string,
  data?: Record<string, string>
}
Returns: { success, actions, durationMs }
```

## Error Responses

All errors return:
```json
{ "error": "Human readable message" }
```

HTTP status codes:
- `400` Bad Request — invalid input
- `401` Unauthorized — not logged in
- `403` Forbidden — insufficient role
- `404` Not Found
- `500` Internal Server Error
