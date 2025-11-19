# Backend Prompts: Payments Initiate & Verify

Goal: Implement backend-driven payments that support UPI deep links, card/netbanking/wallet via a gateway (e.g., Razorpay), and generic hosted redirects. Frontend is integrated to call these endpoints and branch by the returned `gateway` and `session` envelope.

## POST `/api/storefront/payments/initiate`

- Request (JSON):
  - `amount` (integer, paise) — required
  - `currency` (string) — default `INR`
  - `method` (string) — one of `upi` | `card` | `netbanking` | `wallet`
  - `address` (object) — optional; pass-through for notes
  - `phone` (string) — optional; used for prefill

- Response (JSON):
  - `orderId` (string) — backend payment/order reference
  - `gateway` (string) — one of:
    - `razorpay` — for inline Razorpay checkout
    - `native_upi` — for UPI app deep-link
    - `redirect` — for hosted payment pages
  - `session` (object):
    - For `razorpay`:
      - `key` (string) — Razorpay key id (public)
      - `razorpayOrderId` (string)
    - For `native_upi`:
      - `upiDeepLink` (string) — deep link `upi://pay?...`
    - For `redirect`:
      - `redirectUrl` (string) — full URL for provider-hosted payment page

- Example: UPI
```json
{
  "orderId": "ord_123",
  "gateway": "native_upi",
  "session": {
    "upiDeepLink": "upi://pay?pa=merchant@upi&pn=BharatApp&am=499.00&tn=Order%20ord_123"
  }
}
```

- Example: Razorpay
```json
{
  "orderId": "ord_456",
  "gateway": "razorpay",
  "session": {
    "key": "rzp_test_xxx",
    "razorpayOrderId": "order_abcxyz"
  }
}
```

- Example: Redirect
```json
{
  "orderId": "ord_789",
  "gateway": "redirect",
  "session": {
    "redirectUrl": "https://provider.example/checkout/session/xyz"
  }
}
```

## POST `/api/storefront/payments/verify`

- Request (JSON):
  - For `razorpay`:
    - `orderId` (string)
    - `paymentId` (string) — `razorpay_payment_id`
    - `signature` (string) — `razorpay_signature`
    - `method` = `razorpay`
  - For `upi` (native):
    - `orderId` (string)
    - `txnId` (string, optional) — if available
    - `method` = `upi`
  - For `redirect` gateways:
    - `orderId` (string)
    - `providerRef` (string) — provider transaction reference
    - `method` = `redirect`

- Response (JSON):
  - `status` (string) — `success` | `failed`
  - `paymentInfo` (object) — optional; canonical info for storing in order

## Notes & Contracts

- Frontend sends `amount` as paise; backend should validate and create appropriate provider session.
- For UPI deep links, backend should also have webhook/callback to confirm payment status and update order; frontend performs an optimistic verify call and proceeds upon success.
- For Razorpay, frontend passes `paymentId` and `signature` for verification; backend must validate with provider.
- For redirect flows, backend should return a hosted URL and handle provider callbacks; frontend navigates user to the URL.

## Error Codes

- `STORE_CLOSED` — include `{ details: { closedUntil: 'ISO8601' } }` if applicable.
- `PAYMENT_INIT_FAILED` — return `message` with human-friendly cause.
- `PAYMENT_VERIFY_FAILED` — verification failure details.

---

This prompt can be provided to backend engineers to implement compliant endpoints. Frontend is already integrated to branch on `gateway` and handle each session type.