const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Rider = require('../models/Rider');
const { body, validationResult } = require('express-validator');

// Create new order
router.post('/', [
  body('store').isMongoId().withMessage('Valid store ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isNumeric({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').isObject().withMessage('Delivery address is required'),
  body('paymentMethod').isIn(['cod', 'online', 'upi']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { store: storeId, items, deliveryAddress, paymentMethod, estimatedDeliveryTime } = req.body;

    // Verify store exists and is operational
    const store = await Store.findById(storeId).populate('zone');
    if (!store || !store.isActive || !store.isOpen || store.temporaryClosure.isClosed) {
      return res.status(400).json({ error: 'Store is not available for orders' });
    }

    // Verify all products exist and have sufficient stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product ${item.product} not found` });
      }

      if (product.store.toString() !== storeId) {
        return res.status(400).json({ error: 'Product does not belong to this store' });
      }

      if (!product.canOrderQuantity(item.quantity)) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}`,
          availableStock: product.inventory.stock,
          requestedQuantity: item.quantity
        });
      }

      const itemTotal = product.pricing.sellingPrice * item.quantity;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.pricing.sellingPrice,
        total: itemTotal,
        substitution: item.substitution || { allowed: true }
      });
      subtotal += itemTotal;
    }

    // Calculate pricing
    const deliveryFee = 30; // Fixed delivery fee
    const commission = Math.round(subtotal * store.commissionRate / 100);
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const total = subtotal + deliveryFee + tax;

    // Create order
    const order = new Order({
      customer: req.user.id,
      store: storeId,
      zone: store.zone._id,
      items: orderItems,
      pricing: {
        subtotal,
        deliveryFee,
        commission,
        tax,
        total,
        discount: 0
      },
      deliveryAddress,
      paymentMethod,
      estimatedDeliveryTime: estimatedDeliveryTime || store.zone.deliveryEta,
      tenant
    });

    // Add initial status
    order.statusHistory.push({
      status: 'placed',
      actor: 'customer',
      note: 'Order placed successfully'
    });

    await order.save();

    // Reduce inventory for all products
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      await product.reduceStock(item.quantity);
    }

    await order.populate('customer store zone items.product', 'name phone address.coordinates zone.name');

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        pricing: order.pricing,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        store: order.store,
        items: order.items
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get customer orders
router.get('/customer', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    let query = { customer: req.user.id, tenant };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('store', 'name slug address.coordinates')
      .populate('rider', 'name phone')
      .select('orderNumber status pricing estimatedDeliveryTime createdAt items store rider')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get store orders
router.get('/store', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    // Find stores owned by this user
    const Store = require('../models/Store');
    const stores = await Store.find({ owner: req.user.id, tenant }, '_id');
    const storeIds = stores.map(s => s._id);
    
    if (storeIds.length === 0) {
      return res.json({ orders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
    }
    
    let query = { store: { $in: storeIds }, tenant };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('rider', 'name phone')
      .select('orderNumber status pricing estimatedDeliveryTime createdAt items customer rider')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({ error: 'Failed to fetch store orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const order = await Order.findOne({ _id: req.params.id, tenant })
      .populate('customer', 'name phone addresses')
      .populate('store', 'name slug address contact operatingHours')
      .populate('rider', 'name phone currentLocation vehicle')
      .populate('zone', 'name code deliveryEta')
      .populate('items.product', 'name slug category pricing images');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user has access to this order
    if (order.customer._id.toString() !== req.user.id && 
        order.store.owner?.toString() !== req.user.id &&
        order.rider?._id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (store)
router.patch('/:id/status', [
  body('status').isIn(['accepted', 'preparing', 'ready_for_pickup', 'cancelled']).withMessage('Invalid status'),
  body('note').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { status, note } = req.body;

    const order = await Order.findOne({ _id: req.params.id, tenant }).populate('store');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns the store
    if (order.store.owner?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      'placed': ['accepted', 'cancelled'],
      'accepted': ['preparing', 'cancelled'],
      'preparing': ['ready_for_pickup', 'cancelled'],
      'ready_for_pickup': ['cancelled'],
      'rider_assigned': ['cancelled'],
      'out_for_delivery': ['cancelled']
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    await order.updateStatus(status, note, 'store');

    res.json({ 
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        status: order.status,
        statusHistory: order.statusHistory.slice(-1)[0]
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (customer)
router.patch('/:id/cancel', [
  body('reason').trim().isLength({ min: 5 }).withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, tenant });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is the customer
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['placed', 'accepted', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled at this stage' 
      });
    }

    // Restore inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      product.inventory.stock += item.quantity;
      await product.save();
    }

    order.cancellation = {
      cancelledBy: 'customer',
      reason,
      cancelledAt: new Date()
    };

    await order.updateStatus('cancelled', reason, 'customer');

    res.json({ 
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        status: order.status,
        cancellation: order.cancellation
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get pending orders for rider assignment
router.get('/pending/rider', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const orders = await Order.find({ status: 'ready_for_pickup', rider: null, tenant })
      .populate('store', 'name address.coordinates zone')
      .populate('customer', 'name phone deliveryAddress')
      .populate('zone', 'name code')
      .select('orderNumber status pricing estimatedDeliveryTime createdAt items store customer zone')
      .sort({ createdAt: 1 });
    
    res.json({ orders });
  } catch (error) {
    console.error('Get pending rider orders error:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

module.exports = router;