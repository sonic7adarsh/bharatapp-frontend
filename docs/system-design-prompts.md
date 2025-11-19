# BharatApp System Design & Integration Prompts

Purpose: A single, copy-ready reference of backend integration prompts and frontend architecture guidelines to keep the project scalable and consistent.

## Core Principles
- Consistency first: identical headers, error envelope, pagination shape across APIs.
- Backend is source of truth: no silent local fallbacks except in explicit dev/mock modes.
- Tenant-aware by default: attach `X-Tenant-Domain` to all storefront requests.
- Security by design: attach `Authorization` everywhere except OTP endpoints.
- Observability: log, trace, and emit events for critical user actions.

## Standard Headers
- `Authorization: Bearer {{TOKEN}}` (omit for OTP send/verify/resend only)
- `X-Tenant-Domain: {{TENANT}}`
- `Content-Type: application/json`

## Standard Error Envelope
- 4xx/5xx should return:
```json
{ "success": false, "code": "VALIDATION_ERROR", "message": "…", "details": { … } }
```

## Pagination Envelope
```json
{ "items": [ … ], "page": 1, "pageSize": 20, "total": 123 }
```

---

## Auth & OTP Flow

Initiate OTP:
```
curl -X POST "{{BASE}}/api/storefront/auth/otp/send" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"phone":"+919999999999","channel":"sms"}'
```
Verify OTP:
```
curl -X POST "{{BASE}}/api/storefront/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"phone":"+919999999999","otp":"123456"}'
```
Resend OTP:
```
curl -X POST "{{BASE}}/api/storefront/auth/otp/resend" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"phone":"+919999999999","otpId":"OTP_abc123"}'
```
Profile (requires token):
```
curl -X GET "{{BASE}}/api/storefront/auth/profile" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```

Backend notes:
- OTP endpoints must reject `Authorization` silently; frontend skips auth header for `/api/storefront/auth/otp/*`.
- Profile should strictly require JWT.

---

## Stores: Open/Close Backend-Driven

Get seller stores:
```
curl -X GET "{{BASE}}/api/seller/stores" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Update store status (close):
```
curl -X PATCH "{{BASE}}/api/seller/stores/{{STORE_ID}}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"status":"closed","orderingDisabled":true,"closedReason":"holiday","closedUntil":"2025-12-26"}'
```
Update store status (reopen):
```
curl -X PATCH "{{BASE}}/api/seller/stores/{{STORE_ID}}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"status":"open","orderingDisabled":false,"closedReason":null,"closedUntil":null}'
```

Storefront fetch:
```
curl -X GET "{{BASE}}/api/stores/{{STORE_ID}}" -H "X-Tenant-Domain: {{TENANT}}"
curl -X GET "{{BASE}}/api/stores?search=&category=" -H "X-Tenant-Domain: {{TENANT}}"
```

Checkout must block when `orderingDisabled` or `status=closed`:
```
{ "success": false, "code": "STORE_CLOSED", "message": "Ordering disabled", "details": {"closedUntil":"…"} }
```

---

## Products & Catalog

List products:
```
curl -X GET "{{BASE}}/api/storefront/products?search=&category=&storeId=" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Product detail:
```
curl -X GET "{{BASE}}/api/storefront/products/{{PRODUCT_ID}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Categories:
```
curl -X GET "{{BASE}}/api/categories" -H "X-Tenant-Domain: {{TENANT}}"
```

---

## Cart & Orders (Storefront)

Get cart:
```
curl -X GET "{{BASE}}/api/storefront/cart" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Checkout:
```
curl -X POST "{{BASE}}/api/storefront/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"items":[{"id":"P1","name":"Milk","price":45,"quantity":2}],"totals":{"payable":90},"paymentMethod":"cod","address":{"line1":"123 Street"}}'
```
List orders:
```
curl -X GET "{{BASE}}/api/storefront/orders?page=1&pageSize=10" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Order detail:
```
curl -X GET "{{BASE}}/api/storefront/orders/{{ORDER_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```

---

## Payments

Initiate payment:
```
curl -X POST "{{BASE}}/api/storefront/payments/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"orderId":"O1","amount":1500,"method":"RAZORPAY"}'
```
Verify payment:
```
curl -X POST "{{BASE}}/api/storefront/payments/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"razorpay_order_id":"order_ABC","razorpay_payment_id":"pay_XYZ","razorpay_signature":"sig123"}'
```

Webhook (server-to-server):
```
curl -X POST "{{BASE}}/store/payments/webhook" -H "Content-Type: application/json" -d '{"event":"payment.captured","payload":{}}'
```

---

## Bookings (Seller)

List bookings:
```
curl -X GET "{{BASE}}/api/seller/bookings?from=2025-12-01&to=2025-12-05&status=confirmed&page=1&pageSize=10" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Get booking:
```
curl -X GET "{{BASE}}/api/seller/bookings/{{BOOKING_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```
Update booking status:
```
curl -X PATCH "{{BASE}}/api/seller/bookings/{{BOOKING_ID}}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"status":"checked_in","note":"Arrived at 3PM"}'
```

---

## Seller Payouts & Config

Get payout config:
```
curl -X GET "{{BASE}}/api/seller/payouts/config" \
  -H "Authorization: Bearer {{TOKEN}}"
```
Update payout config:
```
curl -X PATCH "{{BASE}}/api/seller/payouts/config" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -d '{"method":"bank","bank":"HDFC","accountNumber":"1234567890","ifsc":"HDFC0001234"}'
```

---

## I18n Preferences

Get preferences:
```
curl -X GET "{{BASE}}/api/storefront/i18n/preferences" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}"
```

---

## Events & Observability

Track UI/navigation event:
```
curl -X POST "{{BASE}}/api/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "X-Tenant-Domain: {{TENANT}}" \
  -d '{"name":"nav_click","payload":{"target":"/rooms/add","context":"header"},"timestamp":1731234567890}'
```

Suggested responses:
```json
{ "ok": true, "id": "evt_abc123" }
{ "ok": false, "code": "RATE_LIMITED", "message": "Too many events" }
```

---

## Frontend Architecture Guidelines

- Services layer (`src/services`): One module per domain; only use axios instance from `src/lib/axios`.
- Contexts: `AuthContext`, `CartContext`, `I18nContext`, `AnnouncerContext` own global UI/UX state.
- Routing: `ProtectedRoute` for auth; `RoleProtectedRoute` for seller/admin gates.
- Headers: axios interceptors attach `Authorization` (except OTP) and `X-Tenant-Domain` consistently.
- Error handling: toast only on mutations when requested; silent console logs for GET errors.
- Dev/mock toggles: `USE_MOCK_SELLER_AUTH`, `ALLOW_DEV_OTP` default true for local; backend must override in prod.
- File uploads: set `Content-Type` per request; let browser manage FormData boundaries.

Recommended upgrades (roadmap):
- Introduce React Query for caching, retries, and invalidation of lists.
- Adopt TypeScript incrementally for services and context.
- Add `requestId` header and server tracing correlation.
- Enforce standardized error envelope with `code` and `details` across backend.
- Add feature flag service (server-driven) for experiments.
- Establish e2e contract tests for critical APIs (auth, checkout, store status).

---

## Implementation Checklist (Backend)

- Enforce tenant header on all storefront routes; reject missing tenant in prod.
- Reject `Authorization` on OTP endpoints; require on all other auth routes.
- `PATCH /api/seller/stores/:id` validates: `status` in [`open`,`closed`], `orderingDisabled` boolean, `closedUntil` ISO when closed.
- Checkout blocks when store closed; return `STORE_CLOSED` error envelope.
- Consistent pagination shape for lists.
- Rate limiting for OTP send/resend/verify; include retry-after.
- Idempotency for payment initiation (`Idempotency-Key` header optional).
- Event ingestion rate-limit and DLQ for failures.
- CORS: allow Vite dev origin and production domains; block `*` in prod.

---

## Env & Build

- `VITE_API_BASE` (default `http://localhost:8081`)
- `VITE_TENANT_DOMAIN` (default `demo-store`)
- `VITE_DEBUG_API` (enable verbose logs)
- `VITE_SERVICEABLE_PINCODES` (comma-separated)

---

## Testing Scenarios

- OTP resend + page refresh: `otpSession` persists and rehydrates; verify profile loads post-login.
- Store close → storefront shows closed, checkout blocked; reopen → ordering allowed.
- Payments: initiate then verify; webhook consumes captured event.
- Seller bookings: status update patches and reflects in UI.
- I18n preferences: server-driven locale applied to UI.

---

This file is the authoritative prompt reference. Keep it updated alongside UI changes and backend releases.