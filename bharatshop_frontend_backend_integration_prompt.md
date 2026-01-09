# BharatShop Frontend-Backend Integration Guide

## 🎯 Executive Summary

This document provides a complete integration specification for the BharatShop hyperlocal marketplace frontend, mapping every user flow to existing backend APIs. The backend is already implemented with Spring Boot and provides comprehensive APIs for multi-tenant, zone-based hyperlocal commerce.

---

## 1️⃣ COMPLETE FRONTEND FLOW MAPPING

### 🛒 Customer App Flows

#### 1.1 User Authentication
**Screen**: Login Page (`/login`, `/mobile-login`)
**User Action**: Login with email/password or phone/OTP
**API Called**: 
- `POST /api/auth/login` - Email login
- `POST /api/mobile-auth/send-otp` - Send OTP
- `POST /api/mobile-auth/verify-otp` - Phone login
**Request Payload**: 
```json
// Email login
{"email": "user@example.com", "password": "password123"}
// Phone OTP
{"phone": "9876543210", "otp": "123456"}
```
**Response Handling**: Store JWT token, redirect to home
**Error States**: Invalid credentials, OTP expired, account locked
**Loading States**: Show spinner during API calls
**Retry**: 3 attempts max, exponential backoff

#### 1.2 Store Discovery
**Screen**: Home Page (`/`)
**User Action**: View nearby stores
**API Called**: `GET /api/zones/serviceable-stores?latitude=12.935&longitude=77.625`
**Headers Required**: `x-tenant-domain: bharatshop`
**Response Handling**: Display stores sorted by distance
**Error States**: No serviceable stores, location denied
**Loading States**: Skeleton loaders for store cards
**Retry**: Auto-retry on location change

#### 1.3 Store Details
**Screen**: Store Detail Page (`/store/:id`)
**User Action**: View store products
**API Called**: `GET /api/stores/:storeId/products`
**Response Handling**: Categorize products, show inventory
**Error States**: Store closed, no products available
**Loading States**: Product grid skeleton
**Retry**: Manual refresh button

#### 1.4 Cart Management
**Screen**: Cart Page (`/cart`)
**User Action**: Add/remove items
**State Management**: LocalStorage for guest, API for logged-in
**API Called**: Cart operations (client-side state)
**Error States**: Out of stock, quantity exceeded
**Loading States**: Immediate UI update, optimistic
**Retry**: Queue operations, sync on reconnect

#### 1.5 Checkout Flow
**Screen**: Checkout Page (`/checkout`)
**User Action**: Place order
**API Called**: `POST /api/orders`
**Request Payload**:
```json
{
  "store": "storeIdHere",
  "items": [{"product": "productId", "quantity": 2}],
  "deliveryAddress": {
    "street": "123 Street",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "coordinates": {"lat": 12.935, "lng": 77.625}
  },
  "paymentMethod": "cod"
}
```
**Headers Required**: `Authorization: Bearer <token>`, `x-tenant-domain: bharatshop`
**Response Handling**: Order confirmation, redirect to order detail
**Error States**: Payment failed, inventory changed, store offline
**Loading States**: Multi-step progress indicator
**Retry**: Idempotent order creation with retry

#### 1.6 Order Tracking
**Screen**: Order Detail Page (`/orders/:orderId`)
**User Action**: Track order status
**API Called**: `GET /api/orders/:orderId`
**Response Handling**: Real-time status updates
**Error States**: Order not found, access denied
**Loading States**: Order timeline skeleton
**Retry**: Polling every 30 seconds

#### 1.7 Order Cancellation
**Screen**: Order Detail Page
**User Action**: Cancel order
**API Called**: `PATCH /api/orders/:orderId/cancel`
**Request Payload**: `{"reason": "Changed my mind"}`
**Response Handling**: Immediate status update
**Error States**: Order already accepted, too late to cancel
**Loading States**: Confirmation modal with loading
**Retry**: Single attempt, no retry on failure

---

### 🏪 Seller App Flows

#### 2.1 Seller Registration
**Screen**: Seller Register (`/seller/register`)
**User Action**: Register as seller
**API Called**: `POST /api/auth/register` (with role: "seller")
**Request Payload**:
```json
{
  "name": "Store Owner",
  "email": "seller@store.com", 
  "phone": "9876543210",
  "password": "password123",
  "role": "seller"
}
```
**Response Handling**: Auto-login, redirect to store creation
**Error States**: Email/phone already exists
**Loading States**: Registration form with spinner
**Retry**: 3 attempts with captcha

#### 2.2 Store Onboarding
**Screen**: Store Onboard (`/onboard`)
**User Action**: Create store
**API Called**: `POST /api/stores`
**Request Payload**:
```json
{
  "name": "Test Store",
  "description": "A test store",
  "category": "grocery",
  "address": {
    "street": "123 Test Street",
    "city": "Bengaluru",
    "state": "Karnataka", 
    "pincode": "560001",
    "coordinates": {"lat": 12.935, "lng": 77.625}
  },
  "contact": {
    "phone": "+917022223334",
    "email": "test@store.com"
  },
  "zone": "zoneIdHere"
}
```
**Headers Required**: `Authorization: Bearer <token>`
**Response Handling**: Store created, redirect to dashboard
**Error States**: Invalid zone, address verification failed
**Loading States**: Multi-step onboarding wizard
**Retry**: Manual retry with corrected data

#### 2.3 Product Management
**Screen**: Add Product (`/products/add`)
**User Action**: Add new product
**API Called**: `POST /api/products`
**Request Payload**:
```json
{
  "name": "Test Product",
  "description": "A test product",
  "category": "grocery",
  "pricing": {
    "mrp": 100,
    "sellingPrice": 90,
    "costPrice": 70
  },
  "inventory": {
    "stock": 50,
    "unit": "pieces",
    "lowStockThreshold": 10
  },
  "store": "storeIdHere"
}
```
**Response Handling**: Product added, show in inventory
**Error States**: Invalid pricing, category not allowed
**Loading States**: Form with image upload progress
**Retry**: Auto-save draft, retry on failure

#### 2.4 Inventory Updates
**Screen**: Seller Products (`/seller/products`)
**User Action**: Update stock
**API Called**: `PATCH /api/products/:productId/inventory`
**Request Payload**: `{"stock": 75}`
**Response Handling**: Immediate inventory update
**Error States**: Stock below threshold, sync conflict
**Loading States**: Inline editing with spinner
**Retry**: Optimistic updates with rollback

#### 2.5 Order Management
**Screen**: Seller Orders (`/seller/orders`)
**User Action**: View incoming orders
**API Called**: `GET /api/orders/store`
**Response Handling**: Show orders by status (pending, accepted, ready)
**Error States**: Store not found, no orders
**Loading States**: Order list skeleton
**Retry**: Auto-refresh every 30 seconds

#### 2.6 Order Acceptance
**Screen**: Order Detail (`/seller/orders/:orderId`)
**User Action**: Accept/reject order
**API Called**: `PATCH /api/orders/:orderId/status`
**Request Payload**: `{"status": "accepted", "note": "Order accepted"}`
**Response Handling**: Status update, customer notification
**Error States**: Order already cancelled, SLA exceeded
**Loading States**: Action buttons with loading state
**Retry**: Single attempt, manual override on failure

#### 2.7 Order Preparation
**Screen**: Order Detail
**User Action**: Mark order ready
**API Called**: `PATCH /api/orders/:orderId/status`
**Request Payload**: `{"status": "ready_for_pickup", "note": "Order ready"}`
**Response Handling**: Rider assignment triggered
**Error States**: Items unavailable, preparation delayed
**Loading States**: Timer showing SLA countdown
**Retry**: Manual retry with updated ETA

---

### 🚴 Rider App Flows

#### 3.1 Rider Registration
**Screen**: Rider Registration (via admin)
**User Action**: Register as delivery partner
**API Called**: `POST /api/riders/register`
**Request Payload**:
```json
{
  "name": "Test Rider",
  "email": "rider@example.com",
  "phone": "9876543215",
  "vehicle": {
    "type": "bike",
    "number": "KA01AB1234",
    "model": "Honda Activa"
  },
  "license": {
    "number": "DL1234567890123",
    "expiry": "2025-12-31"
  },
  "zones": ["zoneIdHere"]
}
```
**Response Handling**: Account created, wait for approval
**Error States**: License validation failed, zone not serviceable
**Loading States**: Registration form with document upload
**Retry**: Manual retry with corrected documents

#### 3.2 Rider Login
**Screen**: Rider Login
**User Action**: Login with phone/OTP
**API Called**: `POST /api/riders/login`
**Request Payload**: `{"phone": "9876543215", "otp": "123456"}`
**Response Handling**: JWT token, redirect to dashboard
**Error States**: Invalid OTP, account suspended
**Loading States**: OTP input with countdown
**Retry**: 3 OTP attempts, 60-second cooldown

#### 3.3 Go Online/Offline
**Screen**: Rider Dashboard
**User Action**: Toggle availability
**API Called**: `PATCH /api/riders/availability`
**Request Payload**: `{"isAvailable": true}`
**Response Handling**: Start receiving order assignments
**Error States**: Vehicle verification pending, zone offline
**Loading States**: Toggle switch with loading
**Retry**: Immediate retry on network failure

#### 3.4 Location Updates
**Screen**: Rider Dashboard (background)
**User Action**: Automatic location tracking
**API Called**: `PATCH /api/riders/location`
**Request Payload**:
```json
{
  "latitude": 12.935,
  "longitude": 77.625,
  "accuracy": 5
}
```
**Response Handling**: Location updated for assignments
**Error States**: GPS denied, location inaccurate
**Loading States**: Background sync indicator
**Retry**: Queue updates, batch on reconnect

#### 3.5 Order Assignment
**Screen**: Rider Dashboard
**User Action**: Receive auto-assigned order
**API Called**: `GET /api/riders/orders` (polling)
**Response Handling**: Show order details, accept/reject
**Error States**: No orders in area, assignment failed
**Loading States**: Waiting for orders indicator
**Retry**: Polling every 10 seconds when online

#### 3.6 Order Acceptance
**Screen**: Order Detail
**User Action**: Accept assigned order
**API Called**: `PATCH /api/riders/orders/:orderId/accept`
**Response Handling**: Navigation to store triggered
**Error States**: Order already accepted by another rider
**Loading States**: Accept button with loading
**Retry**: Single attempt, auto-next assignment

#### 3.7 Pickup Confirmation
**Screen**: Order Detail
**User Action**: Confirm pickup with OTP
**API Called**: `PATCH /api/riders/orders/:orderId/status`
**Request Payload**: `{"status": "picked_up", "note": "OTP verified"}`
**Response Handling**: Navigation to customer triggered
**Error States**: Wrong OTP, store refused handover
**Loading States**: OTP input with verification
**Retry**: 3 OTP attempts, then escalate to support

#### 3.8 Delivery Confirmation
**Screen**: Delivery Location
**User Action**: Confirm delivery with OTP
**API Called**: `PATCH /api/riders/orders/:orderId/status`
**Request Payload**: `{"status": "delivered", "note": "OTP verified"}`
**Response Handling**: Order completed, earnings updated
**Error States**: Customer unavailable, wrong OTP
**Loading States**: Delivery confirmation with loading
**Retry**: Failed delivery protocol, return to store

---

### 👨‍💼 Admin/Ops Panel Flows

#### 4.1 Admin Dashboard
**Screen**: Admin Dashboard (`/admin`)
**User Action**: View system overview
**API Called**: Multiple endpoints for metrics
**Response Handling**: Real-time statistics display
**Error States**: Data unavailable, permissions denied
**Loading States**: Dashboard skeleton loaders
**Retry**: Auto-refresh every 60 seconds

#### 4.2 Order Intervention
**Screen**: Admin Orders
**User Action**: Force cancel/complete orders
**API Called**: Admin-specific order endpoints
**Response Handling**: Immediate order status change
**Error States**: Order already processed, invalid state
**Loading States**: Confirmation modal with loading
**Retry**: Manual retry with admin override

#### 4.3 Rider Reassignment
**Screen**: Order Management
**User Action**: Reassign rider to order
**API Called**: Admin rider management endpoints
**Response Handling**: New rider assigned, notifications sent
**Error States**: No available riders, order state invalid
**Loading States**: Rider selection with loading
**Retry**: Manual selection of alternative rider

#### 4.4 Zone Management
**Screen**: Zone Overview
**User Action**: View zone performance
**API Called**: Zone analytics endpoints
**Response Handling**: Show zone heatmaps, rider distribution
**Error States**: Zone data unavailable, calculation error
**Loading States**: Map and charts skeleton
**Retry**: Manual refresh, cache clear

---

## 2️⃣ API CONTRACT SPECIFICATIONS

### Authentication APIs

#### POST /api/auth/register
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, email)",
  "phone": "string (required)",
  "password": "string (required, min 6)",
  "role": "enum: customer|seller|rider|admin"
}
```
**Response Success (201)**:
```json
{
  "user": {
    "id": "userId",
    "name": "User Name",
    "email": "user@example.com",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```
**Error Codes**:
- 400: Validation error (invalid email, weak password)
- 409: Conflict (email/phone already exists)
- 500: Server error

#### POST /api/auth/login
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "email": "string (required, email)",
  "password": "string (required)"
}
```
**Response Success (200)**:
```json
{
  "user": {
    "id": "userId",
    "name": "User Name", 
    "email": "user@example.com",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```
**Error Codes**:
- 401: Invalid credentials
- 400: Validation error
- 500: Server error

#### POST /api/mobile-auth/send-otp
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "phone": "string (required, 10 digits)"
}
```
**Response Success (200)**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```
**Error Codes**:
- 400: Invalid phone format
- 429: Too many requests
- 500: Server error

#### POST /api/mobile-auth/verify-otp
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "phone": "string (required)",
  "otp": "string (required, 6 digits)"
}
```
**Response Success (200)**:
```json
{
  "user": {
    "id": "userId",
    "name": "User Name",
    "phone": "9876543210",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```
**Error Codes**:
- 401: Invalid OTP
- 400: Validation error
- 404: User not found

---

### Zone & Store APIs

#### POST /api/zones/check-serviceability
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "latitude": "number (required)",
  "longitude": "number (required)"
}
```
**Response Success (200)**:
```json
{
  "serviceable": true,
  "zoneId": "zoneId",
  "zoneName": "Koramangala",
  "estimatedDeliveryTime": 30
}
```

#### GET /api/zones/serviceable-stores
**Headers**: `x-tenant-domain: bharatshop`
**Query Parameters**: `latitude=12.935&longitude=77.625`
**Response Success (200)**:
```json
{
  "stores": [
    {
      "id": "storeId",
      "name": "Store Name",
      "category": "grocery",
      "address": {
        "street": "123 Street",
        "city": "Bengaluru",
        "coordinates": {"lat": 12.935, "lng": 77.625}
      },
      "distance": 2.5,
      "estimatedDeliveryTime": 25,
      "isOpen": true
    }
  ]
}
```

#### GET /api/stores/:storeId/products
**Headers**: `x-tenant-domain: bharatshop`
**Response Success (200)**:
```json
{
  "products": [
    {
      "id": "productId",
      "name": "Product Name",
      "description": "Product description",
      "category": "grocery",
      "pricing": {
        "mrp": 100,
        "sellingPrice": 90,
        "discount": 10
      },
      "inventory": {
        "stock": 50,
        "unit": "pieces",
        "isAvailable": true
      }
    }
  ]
}
```

---

### Order APIs

#### POST /api/orders
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`
- `Idempotency-Key: unique-order-key` (recommended)

**Request Body**:
```json
{
  "store": "string (required)",
  "items": [
    {
      "product": "string (required)",
      "quantity": "number (required, min 1)"
    }
  ],
  "deliveryAddress": {
    "street": "string (required)",
    "city": "string (required)",
    "state": "string (required)",
    "pincode": "string (required)",
    "coordinates": {
      "lat": "number (required)",
      "lng": "number (required)"
    }
  },
  "paymentMethod": "enum: cod|online|upi"
}
```

**Response Success (201)**:
```json
{
  "order": {
    "id": "orderId",
    "orderNumber": "ORD-123456",
    "status": "confirmed",
    "totalAmount": 180,
    "estimatedDeliveryTime": 30,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes**:
- 400: Validation error, insufficient inventory
- 409: Conflict (idempotent key already used)
- 422: Store not serviceable for delivery address
- 500: Server error

#### GET /api/orders/customer
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`

**Query Parameters**: `status=confirmed&page=1&limit=10`

**Response Success (200)**:
```json
{
  "orders": [
    {
      "id": "orderId",
      "orderNumber": "ORD-123456",
      "status": "confirmed",
      "totalAmount": 180,
      "store": {
        "name": "Store Name",
        "id": "storeId"
      },
      "itemsCount": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "estimatedDeliveryTime": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "hasNext": true
  }
}
```

#### GET /api/orders/store
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`

**Query Parameters**: `status=pending&page=1&limit=20`

**Response Success (200)**:
```json
{
  "orders": [
    {
      "id": "orderId",
      "orderNumber": "ORD-123456",
      "status": "pending",
      "totalAmount": 180,
      "customer": {
        "name": "Customer Name",
        "phone": "9876543210"
      },
      "items": [
        {
          "product": {"name": "Product Name"},
          "quantity": 2,
          "price": 90
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "slaDeadline": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### PATCH /api/orders/:orderId/status
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`

**Request Body**:
```json
{
  "status": "enum: accepted|rejected|ready_for_pickup|completed",
  "note": "string (optional)"
}
```

**Response Success (200)**:
```json
{
  "order": {
    "id": "orderId",
    "status": "accepted",
    "statusHistory": [
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T10:30:00Z",
        "note": "Order placed"
      },
      {
        "status": "accepted", 
        "timestamp": "2024-01-15T10:35:00Z",
        "note": "Order accepted by store"
      }
    ]
  }
}
```

---

### Rider APIs

#### POST /api/riders/register
**Headers**: `x-tenant-domain: bharatshop`
**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, email)",
  "phone": "string (required)",
  "vehicle": {
    "type": "enum: bike|scooter|cycle",
    "number": "string (required)",
    "model": "string (required)"
  },
  "license": {
    "number": "string (required)",
    "expiry": "string (required, date)"
  },
  "zones": ["string (required)"]
}
```

#### PATCH /api/riders/availability
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`

**Request Body**:
```json
{
  "isAvailable": "boolean (required)"
}
```

#### PATCH /api/riders/location
**Headers**: 
- `Authorization: Bearer <token>`
- `x-tenant-domain: bharatshop`

**Request Body**:
```json
{
  "latitude": "number (required)",
  "longitude": "number (required)",
  "accuracy": "number (optional, meters)"
}
```

---

## 3️⃣ STATE MANAGEMENT STRATEGY

### Cart State
**Guest Users**: LocalStorage-based cart
- Persist across sessions
- Sync on login/signup
- Clear on logout

**Logged-in Users**: Client-side state only
- No server persistence needed
- Cart cleared after successful order
- Real-time inventory validation

### Order Lifecycle State
**Server-driven states**:
- Order status (confirmed → accepted → ready → picked_up → delivered)
- Rider assignment and location
- ETA calculations
- Payment status

**Client-driven states**:
- UI loading states
- Local error messages
- Retry queue for failed actions
- Optimistic updates

### Real-time Updates Strategy
**Polling intervals**:
- Order tracking: 30 seconds
- Store orders: 30 seconds  
- Rider orders: 10 seconds (when online)
- Admin dashboard: 60 seconds

**WebSocket readiness**: Backend should support WebSocket for:
- Order status changes
- Rider location updates
- Inventory changes
- System notifications

---

## 4️⃣ ROLE-WISE APP BEHAVIOR

### Customer App Behavior

#### Store Discovery
- **Zone-aware**: Only show serviceable stores
- **Distance sorting**: Nearest first
- **Category filtering**: Grocery, pharmacy, etc.
- **Open/closed status**: Real-time store status
- **ETA display**: Estimated delivery time

#### Product Listing
- **Inventory availability**: Real-time stock status
- **Pricing display**: MRP vs selling price
- **Unit selection**: Weight/volume options
- **Add to cart**: Immediate with quantity selector
- **Quick view**: Modal with product details

#### Cart & Checkout
- **Guest checkout**: No login required
- **Address management**: Save multiple addresses
- **Payment options**: COD, UPI, online
- **Order summary**: Item-wise breakdown
- **Promo codes**: Discount application

#### Order Tracking
- **Status timeline**: Visual order progress
- **Rider tracking**: Map with live location
- **ETA updates**: Dynamic delivery time
- **Contact options**: Call/message rider
- **Cancellation**: Before order acceptance

### Seller App Behavior

#### Order Management
- **New order alerts**: Push notifications
- **SLA countdown**: Timer for acceptance
- **Item-wise status**: Mark individual items ready
- **Customer details**: Name, phone, address
- **Order history**: Completed/cancelled orders

#### Inventory Management
- **Real-time updates**: Immediate stock changes
- **Low stock alerts**: Below threshold warnings
- **Bulk updates**: Multiple products at once
- **Product search**: Find products quickly
- **Category management**: Organize products

#### Store Operations
- **Operating hours**: Set open/close times
- **Holiday mode**: Temporarily close store
- **Performance metrics**: Sales, ratings, efficiency
- **Customer feedback**: Reviews and ratings
- **Payout information**: Earnings and settlements

### Rider App Behavior

#### Online Status
- **Go online**: Start receiving orders
- **Zone selection**: Choose service areas
- **Availability toggle**: Quick online/offline
- **Auto offline**: After period of inactivity
- **Break mode**: Temporarily pause orders

#### Order Assignment
- **Auto-assignment**: System allocates orders
- **Accept/reject**: 30-second decision window
- **Order details**: Items, value, distance
- **Navigation**: Integrated maps for pickup/delivery
- **Customer info**: Name, phone, address

#### Delivery Process
- **Pickup OTP**: Verify at store
- **Customer contact**: Call/message options
- **Delivery OTP**: Verify with customer
- **Photo proof**: Delivery confirmation
- **Failed delivery**: Return to store protocol

---

## 5️⃣ REAL-WORLD EDGE CASE HANDLING

### Inventory Issues
**Out of stock mid-checkout**:
- Show error message: "Item no longer available"
- Remove item from cart automatically
- Suggest alternative products
- Allow user to continue with remaining items

**Price changes during checkout**:
- Display price change notification
- Show old vs new price
- Require user confirmation to proceed
- Update order total automatically

### Order Lifecycle Issues
**Rider unassigned/reassigned**:
- Show "Finding rider" status
- Display estimated wait time
- Send push notification when assigned
- Show rider change in tracking

**Store delays**:
- Extend SLA automatically
- Notify customer of delay
- Show updated ETA
- Offer cancellation if excessive delay

**Payment success but order failure**:
- Show payment confirmation
- Display "Order processing" status
- Auto-retry order creation
- Refund if order cannot be created

### Network & App Issues
**App refresh/crash recovery**:
- Persist cart in localStorage
- Restore order tracking state
- Retry failed API calls
- Show sync status indicator

**Network failure & retries**:
- Queue critical operations (order, payment)
- Show offline mode indicator
- Retry with exponential backoff
- Allow manual retry for user actions

**GPS/Location issues**:
- Fallback to last known location
- Allow manual address entry
- Show location accuracy warning
- Disable zone-dependent features

### Authentication Issues
**Token expiration**:
- Auto-refresh token if possible
- Redirect to login if refresh fails
- Preserve intended destination
- Show session expired message

**Multi-device login**:
- Allow single device per role
- Show active device warning
- Force logout previous session
- Maintain separate sessions per role

---

## 6️⃣ STATE MANAGEMENT IMPLEMENTATION

### Cart State Structure
```javascript
const cartState = {
  items: [
    {
      productId: "prod_123",
      name: "Product Name",
      price: 90,
      quantity: 2,
      unit: "pieces",
      image: "product-image.jpg"
    }
  ],
  storeId: "store_123",
  totalAmount: 180,
  itemCount: 2,
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### Order State Structure
```javascript
const orderState = {
  currentOrder: {
    id: "order_123",
    status: "confirmed",
    statusHistory: [
      {
        status: "confirmed",
        timestamp: "2024-01-15T10:30:00Z",
        note: "Order placed"
      }
    ],
    items: [],
    totalAmount: 180,
    estimatedDeliveryTime: 30,
    rider: {
      id: "rider_123",
      name: "Rider Name",
      phone: "9876543210",
      location: {"lat": 12.935, "lng": 77.625}
    }
  },
  ordersList: [],
  isLoading: false,
  error: null
}
```

### User State Structure
```javascript
const userState = {
  user: {
    id: "user_123",
    name: "User Name",
    email: "user@example.com",
    phone: "9876543210",
    role: "customer"
  },
  addresses: [
    {
      id: "addr_123",
      type: "home",
      street: "123 Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      coordinates: {"lat": 12.935, "lng": 77.625},
      isDefault: true
    }
  ],
  token: "jwt_token_here",
  isAuthenticated: true
}
```

---

## 7️⃣ ERROR HANDLING & FALLBACKS

### API Error Categories

#### 4xx Client Errors
**400 Bad Request**:
- Show user-friendly error message
- Highlight invalid form fields
- Provide correction suggestions
- Log for analytics

**401 Unauthorized**:
- Redirect to login page
- Clear invalid token
- Show login prompt
- Preserve intended action

**403 Forbidden**:
- Show permission denied message
- Suggest appropriate role upgrade
- Log security events
- Provide contact support option

**404 Not Found**:
- Show "Resource not found" message
- Suggest similar alternatives
- Provide search functionality
- Log for debugging

**409 Conflict**:
- Show conflict details
- Provide resolution options
- Allow manual override where appropriate
- Log for analysis

**422 Unprocessable Entity**:
- Show validation errors
- Highlight problematic fields
- Provide format requirements
- Allow form resubmission

#### 5xx Server Errors
**500 Internal Server Error**:
- Show generic error message
- Provide retry button
- Log error details
- Alert operations team

**502 Bad Gateway**:
- Show "Service temporarily unavailable"
- Auto-retry with exponential backoff
- Provide offline mode if possible
- Log for monitoring

**503 Service Unavailable**:
- Show maintenance message
- Provide estimated downtime
- Allow offline mode operations
- Queue critical actions

**504 Gateway Timeout**:
- Show "Request timeout" message
- Provide retry option
- Log performance metrics
- Alert infrastructure team

### Network Error Handling

#### Connection Issues
**No internet connection**:
- Show offline banner
- Disable network-dependent features
- Enable offline mode for cart
- Queue operations for sync

**Slow connection**:
- Show loading indicators
- Implement request timeouts
- Provide cancel option
- Optimize payload sizes

**Intermittent connection**:
- Implement retry logic
- Queue failed operations
- Show sync status
- Provide manual refresh

### Fallback Strategies

#### Data Fallbacks
**Primary API failure**:
- Use cached data if available
- Show stale data warning
- Provide manual refresh
- Log data freshness

**Partial data failure**:
- Show available data
- Hide failed sections
- Provide retry for failed parts
- Show degradation message

**Empty data response**:
- Show "No data available" message
- Provide action to add data
- Suggest alternatives
- Log for investigation

#### UI Fallbacks
**Image loading failure**:
- Show placeholder image
- Provide retry button
- Use generic category icons
- Log broken image URLs

**Map loading failure**:
- Show address text
- Provide directions link
- Use static location info
- Allow manual address entry

**Component loading failure**:
- Show error boundary
- Provide component reset
- Log error details
- Allow navigation away

---

## 8️⃣ PERFORMANCE OPTIMIZATION

### API Call Optimization

#### Request Optimization
**Batch requests**:
- Combine related API calls
- Use GraphQL where beneficial
- Implement request debouncing
- Cache similar requests

**Pagination**:
- Implement cursor-based pagination
- Load more on scroll
- Show item count
- Provide jump to page

**Filtering & Search**:
- Implement server-side filtering
- Use query parameters effectively
- Provide search suggestions
- Cache search results

#### Response Optimization
**Data normalization**:
- Normalize nested responses
- Implement entity caching
- Use consistent data shapes
- Provide data transformation

**Image optimization**:
- Use multiple image sizes
- Implement lazy loading
- Provide WebP format
- Use CDN for static assets

**Bundle optimization**:
- Code split by route
- Lazy load components
- Optimize chunk sizes
- Preload critical resources

### Caching Strategy

#### Client-side Caching
**API response caching**:
- Cache GET requests appropriately
- Implement cache invalidation
- Use stale-while-revalidate
- Provide cache clearing

**State persistence**:
- Persist critical state to localStorage
- Implement state hydration
- Handle state migration
- Provide state reset

**Asset caching**:
- Implement service worker caching
- Cache static assets long-term
- Provide offline functionality
- Update cache on deployment

#### Server-side Caching
**CDN caching**:
- Cache static assets at edge
- Implement cache headers
- Provide cache purging
- Monitor cache hit rates

**API caching**:
- Cache frequently accessed data
- Implement cache warming
- Use appropriate TTL values
- Monitor cache performance

---

## 🔁 BACKEND INTEGRATION PROMPTS

### Customer App Integration

> **Backend Team**: Please confirm the following APIs support customer app requirements:

1. **Store Discovery Enhancement**: 
   - Confirm `/api/zones/serviceable-stores` returns store operating hours and delivery radius
   - Add `isOpen` boolean and `nextOpenTime` for closed stores
   - Include `averageRating` and `totalReviews` for each store

2. **Product Search & Filtering**:
   - Add search endpoint `/api/products/search?q=query&storeId=id`
   - Support category filtering `/api/stores/:storeId/products?category=grocery`
   - Add price range filtering with `minPrice` and `maxPrice` parameters

3. **Cart Validation**:
   - Add cart validation endpoint `/api/cart/validate` for inventory check
   - Return real-time pricing and availability
   - Support bulk validation for multiple items

4. **Order Tracking Real-time**:
   - Implement WebSocket for order status updates
   - Add rider location streaming endpoint
   - Provide ETA calculation updates every 30 seconds

5. **Address Management**:
   - Add address validation using coordinates
   - Implement address suggestion API
   - Add favorite addresses endpoint `/api/auth/addresses/favorites`

### Seller Dashboard Integration

> **Backend Team**: Please validate seller dashboard requirements:

1. **Store Performance Metrics**:
   - Add `/api/seller/dashboard/metrics` for KPI dashboard
   - Include today orders, revenue, acceptance rate
   - Provide time-series data for charts

2. **Order Management Enhancement**:
   - Add order filtering by status, date range, customer
   - Implement bulk order status updates
   - Add order export functionality for accounting

3. **Inventory Management**:
   - Add bulk inventory update endpoint `/api/products/inventory/bulk`
   - Implement low stock alerts with configurable thresholds
   - Add inventory history tracking

4. **Product Catalog Management**:
   - Add product categories endpoint `/api/categories`
   - Implement product search within store catalog
   - Add product duplicate detection

5. **Financial Reports**:
   - Add earnings endpoint `/api/seller/earnings?period=weekly`
   - Include order-wise commission breakdown
   - Provide payout history and upcoming payouts

### Rider App Integration

> **Backend Team**: Please confirm rider app API completeness:

1. **Order Assignment Logic**:
   - Confirm auto-assignment algorithm considers distance and availability
   - Add assignment history endpoint `/api/riders/assignments`
   - Implement assignment rejection tracking with limits

2. **Navigation Integration**:
   - Add optimized route endpoint `/api/riders/route/:orderId`
   - Include store to customer navigation
   - Support multiple order batching for efficient routes

3. **Earnings & Incentives**:
   - Add detailed earnings breakdown `/api/riders/earnings/details`
   - Include per-order commission, tips, incentives
   - Provide weekly/monthly earnings summary

4. **Performance Metrics**:
   - Add rider rating endpoint `/api/riders/rating`
   - Track on-time delivery percentage
   - Monitor acceptance rate and completion rate

5. **Issue Resolution**:
   - Add order issue reporting `/api/riders/orders/:id/issues`
   - Support customer unavailable, wrong address scenarios
   - Implement escalation to support team

### Admin Panel Integration

> **Backend Team**: Please ensure admin panel has required capabilities:

1. **System Overview Dashboard**:
   - Add system-wide metrics endpoint `/api/admin/metrics`
   - Include active orders, riders, stores, revenue
   - Provide real-time system health indicators

2. **Order Intervention Tools**:
   - Add force order status change endpoint for admins
   - Implement order reassignment between riders
   - Add order cancellation with admin override

3. **User Management**:
   - Add user search and filtering capabilities
   - Implement user role management
   - Add user activity logs and audit trail

4. **Zone & Serviceability Management**:
   - Add zone creation and editing endpoints
   - Implement serviceability polygon management
   - Add zone performance analytics

5. **Financial Oversight**:
   - Add platform revenue dashboard
   - Implement commission configuration per store/category
   - Add payout management for sellers and riders

### General Backend Requirements

> **Backend Team**: Please address these cross-cutting concerns:

1. **Rate Limiting & Throttling**:
   - Implement appropriate rate limits per endpoint
   - Add rate limit headers in responses
   - Provide clear error messages when limits exceeded

2. **Idempotency Implementation**:
   - Ensure all POST endpoints support idempotency keys
   - Add `Idempotency-Key` header validation
   - Return consistent responses for duplicate requests

3. **Error Response Standardization**:
   - Standardize error response format across all endpoints
   - Include error codes, messages, and remediation steps
   - Add request IDs for troubleshooting

4. **Pagination Consistency**:
   - Implement consistent pagination across list endpoints
   - Use cursor-based pagination for real-time data
   - Include total count and hasNext flags

5. **File Upload Support**:
   - Add image upload endpoints for products and documents
   - Implement file size and format validation
   - Provide CDN URLs in responses

6. **Multi-tenant Data Isolation**:
   - Ensure all endpoints respect `X-Tenant-Domain` header
   - Implement proper data scoping per tenant
   - Add tenant-specific configuration support

7. **Audit Logging**:
   - Implement comprehensive audit logging
   - Track all state-changing operations
   - Include user context and IP addresses

8. **API Versioning**:
   - Implement API versioning strategy
   - Add version headers to responses
   - Provide deprecation notices for old versions

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Core Customer Flows
- [ ] User authentication (login/register)
- [ ] Store discovery and listing
- [ ] Product catalog browsing
- [ ] Cart management
- [ ] Order placement
- [ ] Basic order tracking

### Phase 2: Seller Operations
- [ ] Seller registration and onboarding
- [ ] Store management
- [ ] Product catalog management
- [ ] Order acceptance/rejection
- [ ] Basic inventory updates

### Phase 3: Rider Operations
- [ ] Rider registration and approval
- [ ] Online/offline status management
- [ ] Order assignment and acceptance
- [ ] Pickup and delivery confirmation
- [ ] Basic earnings tracking

### Phase 4: Advanced Features
- [ ] Real-time order tracking
- [ ] Advanced inventory management
- [ ] Financial reports and analytics
- [ ] Admin dashboard and oversight
- [ ] Performance optimization

### Phase 5: Reliability & Scale
- [ ] Error handling and fallbacks
- [ ] Offline mode support
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring and analytics

---

## 🚨 CRITICAL ASSUMPTIONS & NOTES

1. **Backend Implementation Status**: All APIs listed in the backend API collection are assumed to be fully implemented and functional.

2. **Payment Integration**: Payment processing is simplified to COD (Cash on Delivery) for initial implementation. Online payment integration will be added in Phase 2.

3. **Real-time Updates**: Current implementation uses polling for order status updates. WebSocket implementation is recommended for production scale.

4. **Geolocation Services**: Frontend assumes reliable GPS/location services. Fallback to manual address entry is implemented for location failures.

5. **Image Handling**: Product and store images are handled via URL references. Actual image upload functionality needs to be implemented.

6. **Multi-language Support**: Current implementation is English-only. i18n framework is in place for future language additions.

7. **Push Notifications**: Native push notifications are not implemented. Web-based notifications are used where supported.

8. **Offline Capability**: Cart persistence is implemented for offline scenarios, but full offline mode requires additional service worker implementation.

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Ready for Implementation