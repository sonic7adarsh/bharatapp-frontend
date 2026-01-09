### BharatShop Backend API Collection

#### Environment Variables
```json
{
  "baseUrl": "http://localhost:8081",
  "tenant": "bharatshop"
}
```

#### Authentication

##### Register User
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "customer"
}
```

##### Login
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "email": "john@example.com",
  "password": "password123"
}
```

##### Get Profile (Requires Auth)
```http
GET {{baseUrl}}/api/auth/profile
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

#### Mobile Authentication

##### Send OTP
```http
POST {{baseUrl}}/api/mobile-auth/send-otp
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "phone": "9876543210"
}
```

##### Verify OTP
```http
POST {{baseUrl}}/api/mobile-auth/verify-otp
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "phone": "9876543210",
  "otp": "123456"
}
```

#### Zones

##### Check Serviceability
```http
POST {{baseUrl}}/api/zones/check-serviceability
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "latitude": 12.935,
  "longitude": 77.625
}
```

##### Get Serviceable Stores
```http
GET {{baseUrl}}/api/zones/serviceable-stores?latitude=12.935&longitude=77.625
x-tenant-domain: {{tenant}}
```

##### Get All Zones
```http
GET {{baseUrl}}/api/zones
x-tenant-domain: {{tenant}}
```

#### Stores

##### Get Stores
```http
GET {{baseUrl}}/api/stores
x-tenant-domain: {{tenant}}
```

##### Get Store by ID
```http
GET {{baseUrl}}/api/stores/:storeId
x-tenant-domain: {{tenant}}
```

##### Get Store Products
```http
GET {{baseUrl}}/api/stores/:storeId/products
x-tenant-domain: {{tenant}}
```

##### Create Store (Seller)
```http
POST {{baseUrl}}/api/stores
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "name": "Test Store",
  "description": "A test store",
  "category": "grocery",
  "address": {
    "street": "123 Test Street",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "coordinates": {
      "lat": 12.935,
      "lng": 77.625
    }
  },
  "contact": {
    "phone": "+917022223334",
    "email": "test@store.com"
  },
  "zone": "zoneIdHere"
}
```

#### Products

##### Get Products
```http
GET {{baseUrl}}/api/products
x-tenant-domain: {{tenant}}
```

##### Create Product (Seller)
```http
POST {{baseUrl}}/api/products
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

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

##### Update Inventory
```http
PATCH {{baseUrl}}/api/products/:productId/inventory
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "stock": 75
}
```

#### Orders

##### Create Order (Customer)
```http
POST {{baseUrl}}/api/orders
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "store": "storeIdHere",
  "items": [
    {
      "product": "productIdHere",
      "quantity": 2
    }
  ],
  "deliveryAddress": {
    "street": "123 Delivery Street",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "coordinates": {
      "lat": 12.935,
      "lng": 77.625
    }
  },
  "paymentMethod": "cod"
}
```

##### Get Customer Orders
```http
GET {{baseUrl}}/api/orders/customer
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

##### Get Store Orders (Seller)
```http
GET {{baseUrl}}/api/orders/store
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

##### Update Order Status (Store)
```http
PATCH {{baseUrl}}/api/orders/:orderId/status
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "status": "accepted",
  "note": "Order accepted, preparing items"
}
```

##### Cancel Order (Customer)
```http
PATCH {{baseUrl}}/api/orders/:orderId/cancel
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "reason": "Changed my mind"
}
```

#### Riders

##### Register Rider
```http
POST {{baseUrl}}/api/riders/register
Content-Type: application/json
x-tenant-domain: {{tenant}}

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

##### Rider Login
```http
POST {{baseUrl}}/api/riders/login
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "phone": "9876543215",
  "otp": "123456"
}
```

##### Update Location (Rider)
```http
PATCH {{baseUrl}}/api/riders/location
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "latitude": 12.935,
  "longitude": 77.625,
  "accuracy": 5
}
```

##### Update Availability (Rider)
```http
PATCH {{baseUrl}}/api/riders/availability
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "isAvailable": true
}
```

##### Accept Order (Rider)
```http
PATCH {{baseUrl}}/api/riders/orders/:orderId/accept
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

##### Update Order Status (Rider)
```http
PATCH {{baseUrl}}/api/riders/orders/:orderId/status
Authorization: Bearer {{token}}
Content-Type: application/json
x-tenant-domain: {{tenant}}

{
  "status": "picked_up",
  "note": "Order picked up from store"
}
```

##### Get Rider Earnings
```http
GET {{baseUrl}}/api/riders/earnings
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

##### Get Rider Orders
```http
GET {{baseUrl}}/api/riders/orders
Authorization: Bearer {{token}}
x-tenant-domain: {{tenant}}
```

#### Health Check
```http
GET {{baseUrl}}/api/health
```

#### API Info
```http
GET {{baseUrl}}/api
```

### Notes
- Replace `{{token}}` with actual JWT token from login response
- Replace `{{tenant}}` with your tenant domain or use default "bharatshop"
- Replace `:storeId`, `:productId`, `:orderId` with actual MongoDB ObjectIds
- Demo OTP is always "123456" for testing
- All coordinates use [longitude, latitude] format