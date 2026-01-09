const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { validateStoreZone } = require('../middleware/zoneMiddleware');
const { body, validationResult } = require('express-validator');

// Get all stores (with optional zone filter)
router.get('/', async (req, res) => {
  try {
    const { lat, lng, zone } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    let query = { isActive: true, tenant };
    
    if (zone) {
      query.zone = zone;
    }
    
    let stores = await Store.find(query)
      .populate('zone', 'name code deliveryEta')
      .select('name slug category address rating isOpen prepTime deliveryRadius operatingHours')
      .sort({ 'rating.average': -1, name: 1 });
    
    // Filter by location if provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      stores = stores.filter(store => {
        const distance = calculateDistance(
          userLat, userLng,
          store.address.coordinates.lat, store.address.coordinates.lng
        );
        return distance <= store.deliveryRadius;
      });
      
      // Add distance and sort by distance
      stores = stores.map(store => {
        const distance = calculateDistance(
          userLat, userLng,
          store.address.coordinates.lat, store.address.coordinates.lng
        );
        return {
          ...store.toObject(),
          distance: Math.round(distance * 10) / 10,
          isCurrentlyOpen: store.isCurrentlyOpen()
        };
      }).sort((a, b) => a.distance - b.distance);
    }
    
    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get store by ID
router.get('/:id', validateStoreZone, async (req, res) => {
  try {
    const store = req.store;
    
    res.json({ 
      store: {
        ...store.toObject(),
        isCurrentlyOpen: store.isCurrentlyOpen()
      }
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Get store products
router.get('/:id/products', validateStoreZone, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { category, inStock = 'true' } = req.query;
    
    let query = { store: req.params.id, isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (inStock === 'true') {
      query['inventory.stock'] = { $gt: 0 };
    }
    
    const products = await Product.find(query)
      .select('name slug category pricing inventory images rating stockStatus')
      .sort({ category: 1, name: 1 });
    
    // Group by category
    const groupedProducts = {};
    products.forEach(product => {
      if (!groupedProducts[product.category]) {
        groupedProducts[product.category] = [];
      }
      groupedProducts[product.category].push(product);
    });
    
    res.json({ 
      products,
      groupedByCategory: groupedProducts,
      totalCount: products.length
    });
  } catch (error) {
    console.error('Get store products error:', error);
    res.status(500).json({ error: 'Failed to fetch store products' });
  }
});

// Create new store
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('category').isIn(['kirana', 'pharmacy', 'general', 'restaurant', 'hospitality', 'services']).withMessage('Invalid category'),
  body('zone').isMongoId().withMessage('Valid zone ID is required'),
  body('address.street').trim().isLength({ min: 5 }).withMessage('Street address is required'),
  body('address.city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('contact.phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('contact.ownerName').trim().isLength({ min: 2 }).withMessage('Owner name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, description, category, zone, address, contact, operatingHours, prepTime, deliveryRadius } = req.body;

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Check if slug exists
    const existingSlug = await Store.findOne({ slug, tenant });
    if (existingSlug) {
      return res.status(400).json({ error: 'Store name already exists' });
    }

    const store = new Store({
      name,
      slug,
      description,
      category,
      zone,
      address,
      contact,
      operatingHours: operatingHours || getDefaultOperatingHours(),
      prepTime: prepTime || 15,
      deliveryRadius: deliveryRadius || 5,
      owner: req.user.id, // Assuming auth middleware sets req.user
      tenant
    });

    await store.save();
    await store.populate('zone', 'name code deliveryEta');
    
    res.status(201).json({ 
      message: 'Store created successfully',
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        address: store.address,
        zone: store.zone,
        isCurrentlyOpen: store.isCurrentlyOpen()
      }
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Update store status (open/close)
router.patch('/:id/status', async (req, res) => {
  try {
    const { isOpen } = req.body;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const store = await Store.findOne({ _id: req.params.id, tenant, owner: req.user.id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    store.isOpen = isOpen;
    await store.save();
    
    res.json({ 
      message: `Store ${isOpen ? 'opened' : 'closed'} successfully`,
      store: { id: store._id, isOpen: store.isOpen }
    });
  } catch (error) {
    console.error('Update store status error:', error);
    res.status(500).json({ error: 'Failed to update store status' });
  }
});

// Set temporary closure
router.patch('/:id/closure', async (req, res) => {
  try {
    const { isClosed, reason, until } = req.body;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const store = await Store.findOne({ _id: req.params.id, tenant, owner: req.user.id });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    store.temporaryClosure = {
      isClosed,
      reason: isClosed ? reason : '',
      until: isClosed ? new Date(until) : null
    };
    
    await store.save();
    
    res.json({ 
      message: isClosed ? 'Store temporarily closed' : 'Store reopened',
      store: { 
        id: store._id, 
        temporaryClosure: store.temporaryClosure 
      }
    });
  } catch (error) {
    console.error('Update store closure error:', error);
    res.status(500).json({ error: 'Failed to update store closure' });
  }
});

// Helper function for default operating hours
function getDefaultOperatingHours() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hours = {};
  
  days.forEach(day => {
    hours[day] = {
      isOpen: day !== 'sunday',
      open: '09:00',
      close: '21:00'
    };
  });
  
  return hours;
}

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;