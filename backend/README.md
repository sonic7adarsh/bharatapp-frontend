# BharatShop Backend API

A comprehensive Node.js backend for BharatShop, a hyperlocal marketplace connecting local stores with customers.

## Features

- **Zone-based Serviceability**: Geographical zones with delivery coverage
- **Multi-tenant Support**: Support for multiple marketplace instances
- **Store Management**: Complete store onboarding and management
- **Product Catalog**: Inventory management with stock tracking
- **Order Lifecycle**: Full order flow from placement to delivery
- **Rider Management**: Rider registration, assignment, and tracking
- **Authentication**: JWT-based auth with OTP support for mobile
- **Geospatial Queries**: MongoDB-based location services

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update profile
- `POST /api/auth/addresses` - Add address
- `GET /api/auth/addresses` - Get addresses

### Mobile Authentication
- `POST /api/mobile-auth/send-otp` - Send OTP
- `POST /api/mobile-auth/verify-otp` - Verify OTP

### Zones
- `GET /api/zones/check-serviceability` - Check if location is serviceable
- `GET /api/zones/serviceable-stores` - Get stores for a location
- `GET /api/zones` - Get all active zones
- `GET /api/zones/:id` - Get zone by ID
- `POST /api/zones` - Create new zone

### Stores
- `GET /api/stores` - Get stores (with zone and location filters)
- `GET /api/stores/:id` - Get store by ID
- `GET /api/stores/:id/products` - Get store products
- `POST /api/stores` - Create new store
- `PATCH /api/stores/:id/status` - Update store status
- `PATCH /api/stores/:id/temporary-closure` - Set temporary closure

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PATCH /api/products/:id/inventory` - Update inventory
- `PATCH /api/products/bulk-inventory` - Bulk inventory update
- `GET /api/products/low-stock` - Get low stock products

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/customer` - Get customer orders
- `GET /api/orders/store` - Get store orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status (store)
- `PATCH /api/orders/:id/cancel` - Cancel order (customer)
- `GET /api/orders/pending/rider` - Get pending orders for riders

### Riders
- `POST /api/riders/register` - Rider registration
- `POST /api/riders/login` - Rider login
- `PATCH /api/riders/location` - Update location
- `PATCH /api/riders/availability` - Update availability
- `PATCH /api/riders/orders/:id/accept` - Accept order
- `PATCH /api/riders/orders/:id/status` - Update order status
- `GET /api/riders/earnings` - Get earnings
- `GET /api/riders/orders` - Get rider orders

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=8081
MONGODB_URI=mongodb://localhost:27017/bharatshop
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
DEFAULT_TENANT=bharatshop
```

## Getting Started

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up MongoDB locally or use MongoDB Atlas

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the server:
```bash
npm start        # Production
npm run dev      # Development with auto-reload
```

6. Test the API:
```bash
curl http://localhost:8081/api/health
```

## Sample Data

After running `npm run seed`, you'll have:

- **Zones**: Koramangala, HSR Layout
- **Stores**: Fresh Mart (grocery), Quick Bites (food)
- **Products**: Fresh Milk, Organic Tomatoes, Chicken Burger
- **Users**: Customer, Seller, Rider accounts
- **Riders**: Ravi Kumar, Suresh Patel

Sample login credentials:
- Customer: `john@example.com` / `password123`
- Seller: `jane@example.com` / `password123`
- Rider: `mike@example.com` / `password123`

## Architecture

- **Models**: Mongoose schemas for Zone, Store, Product, Order, User, Rider
- **Routes**: Express.js API endpoints organized by domain
- **Middleware**: Authentication, authorization, validation, error handling
- **Zone-based Serviceability**: Geospatial queries for delivery coverage
- **Multi-tenant**: Support for multiple marketplace instances

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Rate limiting
- CORS configuration
- Helmet security headers
- Environment variable protection

## Error Handling

- Centralized error handling middleware
- Mongoose validation errors
- Duplicate key errors
- JWT token errors
- Custom error messages

## Testing

The API includes comprehensive validation and error handling. Test with tools like:
- Postman
- curl
- Thunder Client (VS Code extension)
- Your preferred API testing tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the BharatShop hyperlocal marketplace system.