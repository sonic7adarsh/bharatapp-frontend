const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const { store, category, inStock = 'true', search, page = 1, limit = 20 } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    let query = { isActive: true, tenant };
    
    if (store) {
      query.store = store;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (inStock === 'true') {
      query['inventory.stock'] = { $gt: 0 };
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .populate('store', 'name slug address.coordinates')
      .select('name slug category pricing inventory images rating stockStatus')
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('store', 'name slug address.coordinates zone')
      .populate('zone', 'name code deliveryEta');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('category').isIn(['groceries', 'dairy', 'beverages', 'snacks', 'personal-care', 'household', 'pharmacy', 'others']).withMessage('Invalid category'),
  body('sku').trim().isLength({ min: 2 }).withMessage('SKU is required'),
  body('store').isMongoId().withMessage('Valid store ID is required'),
  body('pricing.mrp').isNumeric({ min: 0 }).withMessage('MRP must be a positive number'),
  body('pricing.sellingPrice').isNumeric({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('inventory.stock').isNumeric({ min: 0 }).withMessage('Stock must be a non-negative number'),
  body('inventory.unit').isIn(['piece', 'kg', 'g', 'ml', 'l', 'pack']).withMessage('Invalid unit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, description, category, subcategory, brand, sku, barcode, pricing, inventory, specifications, tags } = req.body;

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Check if SKU exists for this store
    const existingSku = await Product.findOne({ sku, store: req.body.store, tenant });
    if (existingSku) {
      return res.status(400).json({ error: 'SKU already exists for this store' });
    }

    const product = new Product({
      name,
      slug,
      description,
      category,
      subcategory,
      brand,
      sku,
      barcode,
      pricing,
      inventory,
      specifications,
      tags,
      store: req.body.store,
      tenant
    });

    await product.save();
    await product.populate('store', 'name slug');
    
    res.status(201).json({ 
      message: 'Product created successfully',
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        pricing: product.pricing,
        inventory: product.inventory,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product inventory
router.patch('/:id/inventory', [
  body('stock').optional().isNumeric({ min: 0 }).withMessage('Stock must be a non-negative number'),
  body('lowStockThreshold').optional().isNumeric({ min: 0 }).withMessage('Low stock threshold must be non-negative'),
  body('maxOrderQuantity').optional().isNumeric({ min: 1 }).withMessage('Max order quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stock, lowStockThreshold, maxOrderQuantity } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update inventory fields
    if (stock !== undefined) product.inventory.stock = stock;
    if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
    if (maxOrderQuantity !== undefined) product.inventory.maxOrderQuantity = maxOrderQuantity;

    await product.save();
    
    res.json({ 
      message: 'Inventory updated successfully',
      product: {
        id: product._id,
        name: product.name,
        inventory: product.inventory,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Bulk update inventory
router.post('/bulk-inventory', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, stock }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { productId, stock } = update;
        
        if (!productId || stock === undefined) {
          errors.push({ productId, error: 'Product ID and stock are required' });
          continue;
        }

        const product = await Product.findById(productId);
        if (!product) {
          errors.push({ productId, error: 'Product not found' });
          continue;
        }

        product.inventory.stock = stock;
        await product.save();

        results.push({
          productId,
          name: product.name,
          newStock: stock,
          stockStatus: product.stockStatus
        });
      } catch (error) {
        errors.push({ productId: update.productId, error: error.message });
      }
    }

    res.json({ 
      message: 'Bulk inventory update completed',
      updated: results.length,
      errors: errors.length,
      results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk inventory update error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const { store } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    let query = { isActive: true, tenant };
    
    if (store) {
      query.store = store;
    }
    
    // Find products where stock is less than or equal to low stock threshold
    const lowStockProducts = await Product.find({
      ...query,
      $expr: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
    })
    .populate('store', 'name slug')
    .sort({ 'inventory.stock': 1 });
    
    res.json({ 
      products: lowStockProducts,
      totalCount: lowStockProducts.length
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

module.exports = router;