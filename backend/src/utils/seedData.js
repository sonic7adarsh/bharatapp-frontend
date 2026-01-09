const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Rider = require('../models/Rider');

// Sample zones
const sampleZones = [
  {
    name: 'Koramangala',
    code: 'KOR',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [77.622, 12.935],
        [77.635, 12.935],
        [77.635, 12.925],
        [77.622, 12.925],
        [77.622, 12.935]
      ]]
    },
    center: [77.6285, 12.93],
    radius: 5,
    deliveryEta: 30,
    isActive: true,
    tenant: 'bharatshop'
  },
  {
    name: 'HSR Layout',
    code: 'HSR',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [77.633, 12.908],
        [77.645, 12.908],
        [77.645, 12.898],
        [77.633, 12.898],
        [77.633, 12.908]
      ]]
    },
    center: [77.639, 12.903],
    radius: 4,
    deliveryEta: 25,
    isActive: true,
    tenant: 'bharatshop'
  }
];

// Sample stores
const sampleStores = [
  {
    name: 'Fresh Mart',
    slug: 'fresh-mart',
    description: 'Your neighborhood grocery store',
    category: 'grocery',
    address: {
      street: '100, 1st Main Road, Koramangala 1st Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      coordinates: {
        lat: 12.935,
        lng: 77.625
      }
    },
    contact: {
      phone: '+917022223334',
      email: 'contact@freshmart.com'
    },
    operatingHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '21:00', isOpen: true }
    },
    isActive: true,
    isOpen: true,
    prepTime: 15,
    deliveryRadius: 3,
    commissionRate: 15,
    rating: { average: 4.5, count: 120 },
    owner: null,
    tenant: 'bharatshop'
  },
  {
    name: 'Quick Bites',
    slug: 'quick-bites',
    description: 'Fast food and snacks',
    category: 'food',
    address: {
      street: '201, 27th Main Road, HSR Layout 2nd Sector',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      coordinates: {
        lat: 12.903,
        lng: 77.639
      }
    },
    contact: {
      phone: '+917022225556',
      email: 'hello@quickbites.com'
    },
    operatingHours: {
      monday: { open: '11:00', close: '23:00', isOpen: true },
      tuesday: { open: '11:00', close: '23:00', isOpen: true },
      wednesday: { open: '11:00', close: '23:00', isOpen: true },
      thursday: { open: '11:00', close: '23:00', isOpen: true },
      friday: { open: '11:00', close: '24:00', isOpen: true },
      saturday: { open: '11:00', close: '24:00', isOpen: true },
      sunday: { open: '11:00', close: '23:00', isOpen: true }
    },
    isActive: true,
    isOpen: true,
    prepTime: 10,
    deliveryRadius: 2,
    commissionRate: 12,
    rating: { average: 4.3, count: 85 },
    owner: null,
    tenant: 'bharatshop'
  }
];

// Sample products
const sampleProducts = [
  {
    name: 'Fresh Milk',
    slug: 'fresh-milk',
    description: 'Farm fresh milk 1 liter',
    category: 'dairy',
    pricing: {
      mrp: 70,
      sellingPrice: 65,
      costPrice: 55
    },
    inventory: {
      stock: 50,
      unit: 'liters',
      lowStockThreshold: 10
    },
    specifications: {
      brand: 'Local Dairy',
      weight: '1 liter',
      expiry: '3 days'
    },
    isActive: true,
    rating: { average: 4.2, count: 45 },
    tenant: 'bharatshop'
  },
  {
    name: 'Organic Tomatoes',
    slug: 'organic-tomatoes',
    description: 'Fresh organic tomatoes 500g',
    category: 'vegetables',
    pricing: {
      mrp: 40,
      sellingPrice: 35,
      costPrice: 25
    },
    inventory: {
      stock: 30,
      unit: 'kg',
      lowStockThreshold: 5
    },
    specifications: {
      brand: 'Local Farm',
      weight: '500g',
      origin: 'Local'
    },
    isActive: true,
    rating: { average: 4.0, count: 23 },
    tenant: 'bharatshop'
  },
  {
    name: 'Chicken Burger',
    slug: 'chicken-burger',
    description: 'Delicious chicken burger with fresh veggies',
    category: 'burgers',
    pricing: {
      mrp: 120,
      sellingPrice: 110,
      costPrice: 80
    },
    inventory: {
      stock: 25,
      unit: 'pieces',
      lowStockThreshold: 5
    },
    specifications: {
      brand: 'Quick Bites',
      weight: '200g',
      ingredients: 'Chicken, bun, veggies'
    },
    isActive: true,
    rating: { average: 4.5, count: 67 },
    tenant: 'bharatshop'
  }
];

// Sample users
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    password: 'password123',
    role: 'customer',
    isActive: true,
    tenant: 'bharatshop'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543211',
    password: 'password123',
    role: 'seller',
    isActive: true,
    tenant: 'bharatshop'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '9876543212',
    password: 'password123',
    role: 'rider',
    isActive: true,
    tenant: 'bharatshop'
  }
];

// Sample riders
const sampleRiders = [
  {
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    phone: '9876543213',
    vehicle: {
      type: 'bike',
      number: 'KA01AB1234',
      model: 'Honda Activa'
    },
    license: {
      number: 'DL1234567890123',
      expiry: '2025-12-31'
    },
    address: {
      street: '123, 4th Cross, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034'
    },
    zones: [],
    currentLocation: {
      coordinates: [77.6285, 12.93],
      accuracy: 5
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    tenant: 'bharatshop'
  },
  {
    name: 'Suresh Patel',
    email: 'suresh@example.com',
    phone: '9876543214',
    vehicle: {
      type: 'scooter',
      number: 'KA02CD5678',
      model: 'TVS Jupiter'
    },
    license: {
      number: 'DL9876543210987',
      expiry: '2025-10-15'
    },
    address: {
      street: '456, 5th Main, HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102'
    },
    zones: [],
    currentLocation: {
      coordinates: [77.639, 12.903],
      accuracy: 3
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    tenant: 'bharatshop'
  }
];

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Wait for MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatshop');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Zone.deleteMany({ tenant: 'bharatshop' });
    await Store.deleteMany({ tenant: 'bharatshop' });
    await Product.deleteMany({ tenant: 'bharatshop' });
    await User.deleteMany({ tenant: 'bharatshop' });
    await Order.deleteMany({ tenant: 'bharatshop' });
    await Rider.deleteMany({ tenant: 'bharatshop' });

    console.log('Cleared existing data');

    // Create zones
    const createdZones = await Zone.create(sampleZones);
    console.log(`Created ${createdZones.length} zones`);

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Create stores with zone and owner references
    const storesWithRefs = sampleStores.map((store, index) => ({
      ...store,
      zone: createdZones[index % createdZones.length]._id,
      owner: createdUsers[index % createdUsers.length]._id
    }));

    const createdStores = await Store.create(storesWithRefs);
    console.log(`Created ${createdStores.length} stores`);

    // Create products with store references
    const productsWithRefs = sampleProducts.map((product, index) => ({
      ...product,
      store: createdStores[index % createdStores.length]._id
    }));

    const createdProducts = await Product.create(productsWithRefs);
    console.log(`Created ${createdProducts.length} products`);

    // Create riders with zone references
    const ridersWithZones = sampleRiders.map(rider => ({
      ...rider,
      zones: createdZones.map(zone => zone._id)
    }));

    const createdRiders = await Rider.create(ridersWithZones);
    console.log(`Created ${createdRiders.length} riders`);

    console.log('Data seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- Zones: ${createdZones.length}`);
    console.log(`- Stores: ${createdStores.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Riders: ${createdRiders.length}`);

    // Print sample login credentials
    console.log('\nSample login credentials:');
    console.log('Customer: john@example.com / password123');
    console.log('Seller: jane@example.com / password123');
    console.log('Rider: mike@example.com / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;