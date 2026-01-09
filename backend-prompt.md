Tum ek Senior Frontend Engineer + Product UX thinker ho
jisko hyperlocal marketplaces (Blinkit, Swiggy Instamart, Dunzo, UrbanCompany)
ke customer, merchant aur rider apps ka deep experience hai.

Tumhe BharatShop ke liye FRONTEND build karna hai,
jo ek hyperlocal marketplace hai with:
- No central warehouse
- Local store fulfillment
- Zone-based delivery
- Rider-based logistics
- Real-time order lifecycle

IMPORTANT:
Frontend ko backend ke saath tightly aligned rehna hai.
Koi bhi frontend flow assume mat karna jo backend support na kare.

---

## GLOBAL CONSTRAINTS

- Backend already exists (REST APIs)
- Multi-tenant system using `X-Tenant-Domain`
- Zone-based serviceability is mandatory
- Order lifecycle is hyperlocal (store + rider involved)
- Inventory is store-owned, not platform-owned

---

# 🧑‍💻 PART 1: CUSTOMER APP (WEB / APP)

### 1️⃣ ENTRY & SERVICEABILITY FLOW (CRITICAL)

Design flow such that:
- User MUST select or allow location first
- System checks serviceability based on:
  - User lat/lng
  - Active delivery zones
  - Stores operating in that zone
- If not serviceable → graceful fallback UI

Screens:
- Location picker (map + search)
- Serviceability check loader
- “Not available in your area” screen

DO NOT:
- Show stores/products before zone validation

---

### 2️⃣ STORE DISCOVERY & LISTING

Requirements:
- Show only stores that:
  - Are open
  - Are active
  - Serve user’s zone
- Sort by:
  - Distance
  - Rating (future)
  - Delivery ETA

Store card must show:
- Store name
- Category
- Approx ETA
- Open / Closed state

---

### 3️⃣ PRODUCT BROWSING

Rules:
- Products are always store-scoped
- Stock availability must be shown clearly
- Price is store-controlled

UI requirements:
- Low stock indicator
- Out-of-stock disabled CTA
- Category filters (store-specific)

---

### 4️⃣ CART & INVENTORY AWARENESS

Critical behaviors:
- Cart is tied to:
  - User
  - Store
  - Zone
- Mixing multiple stores NOT allowed (initially)

UI must handle:
- Inventory change warnings
- Quantity limits
- Auto-removal if stock drops to zero

---

### 5️⃣ CHECKOUT FLOW (HYPERLOCAL-SPECIFIC)

Must include:
- Delivery address (with lat/lng)
- Delivery ETA range (not fixed time)
- Payment method (COD / online)
- Order summary (store, items, fees)

Special UX:
- “Item may be substituted” consent
- Store prep time visibility

---

### 6️⃣ ORDER TRACKING (IMPORTANT)

Order tracking must reflect backend lifecycle:

Show stages:
- Order Placed
- Store Accepted
- Preparing
- Ready for Pickup
- Rider Assigned
- Out for Delivery
- Delivered / Failed

UI elements:
- Live rider location (when assigned)
- Store contact option
- Support CTA for delays

---

# 🏪 PART 2: MERCHANT (SELLER) DASHBOARD

### 1️⃣ STORE MANAGEMENT

Screens:
- Store profile
- Open / close toggle
- Temporary closure with reason
- Zone assignment visibility (read-only)

---

### 2️⃣ PRODUCT & INVENTORY MANAGEMENT

Requirements:
- Simple inventory update UX
- Bulk upload support
- Low-stock alerts
- Price update inline

Do NOT:
- Hide inventory errors
- Allow negative stock visually

---

### 3️⃣ ORDER MANAGEMENT (STORE SIDE)

Order lifecycle UI must support:
- Accept / Reject order
- Mark “Preparing”
- Mark “Ready for Pickup”
- View assigned rider details
- Partial item cancellation / substitution

Clear SLA indicators:
- Prep time countdown
- Delay warnings

---

### 4️⃣ PAYOUTS & ANALYTICS

Screens:
- Earnings summary
- Payout request
- Order history
- Basic KPIs (orders/day, revenue)

---

# 🛵 PART 3: RIDER APP (NON-NEGOTIABLE)

Design a minimal but robust Rider App.

### 1️⃣ RIDER AUTH & STATUS

Features:
- Login via phone/OTP
- Online / Offline toggle
- Zone assignment visibility

---

### 2️⃣ ORDER ASSIGNMENT FLOW

UI flow:
- Incoming order alert
- Accept / Reject (with timeout)
- Pickup navigation
- Drop navigation

Order card must show:
- Store location
- Customer location
- Distance
- Earnings

---

### 3️⃣ DELIVERY FLOW

Steps:
- Arrived at store
- Pickup confirmation
- Navigate to customer
- OTP / Proof of delivery
- Complete order

---

### 4️⃣ RIDER EARNINGS

Screens:
- Today’s earnings
- Completed orders
- Incentives (future)

---

# 🧑‍💼 PART 4: ADMIN / OPS PANEL

Requirements:
- Zone overview (list + map)
- Store density per zone
- Rider availability per zone
- Order backlog
- Manual rider assignment (ops override)

---

# 🔗 PART 5: FRONTEND–BACKEND CONTRACT

Frontend MUST:
- Respect backend order states
- Never skip lifecycle steps
- Handle idempotency errors gracefully
- Pass `X-Tenant-Domain` always
- Handle partial failures (inventory, rider delay)

---

# 🧪 PART 6: EDGE CASE UX (IMPORTANT)

Design UX for:
- Rider not found
- Store delay
- Item out of stock post-order
- Customer unreachable
- Order cancellation at different stages

---

# 🎯 OUTPUT EXPECTATION

Deliver:
- Screen-wise flow diagrams
- State machine per app (Customer / Seller / Rider)
- API integration mapping per screen
- Error & empty state designs

Focus on:
- Operational clarity
- Low cognitive load for stores & riders
- Real-world hyperlocal chaos handling

Avoid:
- Fancy animations over clarity
- Dark-pattern speed promises
- Warehouse-style UX assumptions

Build like this will be used by:
- Kirana uncle
- Part-time rider
- First-time online grocery user

Be practical. Be ruthless.
