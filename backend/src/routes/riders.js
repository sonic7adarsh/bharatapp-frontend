const express = require('express');
const router = express.Router();
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

// Rider registration
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
  body('vehicle.type').isIn(['bike', 'scooter', 'cycle']).withMessage('Valid vehicle type is required'),
  body('vehicle.number').trim().isLength({ min: 5 }).withMessage('Vehicle number is required'),
  body('license.number').trim().isLength({ min: 10 }).withMessage('License number is required'),
  body('zones').isArray({ min: 1 }).withMessage('At least one zone is required'),
  body('zones.*').isMongoId().withMessage('Valid zone ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, email, phone, vehicle, license, zones } = req.body;

    // Check if rider already exists
    const existingRider = await Rider.findOne({ 
      $or: [{ email }, { phone }],
      tenant
    });

    if (existingRider) {
      return res.status(400).json({ error: 'Rider with this email or phone already exists' });
    }

    const rider = new Rider({
      name,
      email,
      phone,
      vehicle,
      license,
      zones,
      tenant
    });

    await rider.save();

    res.status(201).json({
      message: 'Rider registered successfully',
      rider: {
        id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicle: rider.vehicle,
        status: rider.status
      }
    });
  } catch (error) {
    console.error('Rider registration error:', error);
    res.status(500).json({ error: 'Failed to register rider' });
  }
});

// Rider login
router.post('/login', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('Valid OTP is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { phone, otp } = req.body;

    const rider = await Rider.findOne({ phone, tenant });
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Verify OTP (simplified - in production, use proper OTP service)
    if (otp !== '123456') { // Demo OTP
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Update last login
    rider.lastLogin = new Date();
    await rider.save();

    res.json({
      message: 'Login successful',
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        status: rider.status,
        isActive: rider.isActive,
        isVerified: rider.isVerified
      }
    });
  } catch (error) {
    console.error('Rider login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Update rider location
router.patch('/location', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { latitude, longitude, accuracy } = req.body;

    const rider = await Rider.findOne({ _id: req.user.id, tenant });
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    rider.currentLocation = {
      coordinates: [longitude, latitude],
      accuracy: accuracy || 10
    };

    await rider.save();

    res.json({
      message: 'Location updated successfully',
      location: rider.currentLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Update rider availability
router.patch('/availability', [
  body('isAvailable').isBoolean().withMessage('Availability status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { isAvailable } = req.body;

    const rider = await Rider.findOne({ _id: req.user.id, tenant });
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Check if rider can be available
    if (isAvailable && !rider.canBeAvailable()) {
      return res.status(400).json({ 
        error: 'Cannot be available. Please complete verification and ensure vehicle is active.' 
      });
    }

    rider.status = isAvailable ? 'available' : 'offline';
    await rider.save();

    res.json({
      message: `Rider ${isAvailable ? 'available' : 'offline'} successfully`,
      status: rider.status
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Accept order assignment
router.patch('/orders/:id/accept', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const order = await Order.findOne({ _id: req.params.id, tenant }).populate('store zone');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is ready for pickup
    if (order.status !== 'ready_for_pickup') {
      return res.status(400).json({ error: 'Order is not ready for pickup' });
    }

    // Check if order already has a rider
    if (order.rider) {
      return res.status(400).json({ error: 'Order already assigned to another rider' });
    }

    const rider = await Rider.findOne({ _id: req.user.id, tenant });
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Check if rider can accept orders
    if (!rider.canAcceptOrders()) {
      return res.status(400).json({ 
        error: 'Cannot accept orders. Please complete verification and be available.' 
      });
    }

    // Check if order is in rider's zones
    if (!rider.zones.includes(order.zone._id)) {
      return res.status(400).json({ 
        error: 'Order is not in your serviceable zones' 
      });
    }

    // Assign order to rider
    await order.assignRider(rider._id);

    res.json({
      message: 'Order accepted successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        store: order.store,
        customer: order.customer,
        deliveryAddress: order.deliveryAddress
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Update order status (picked up, delivered)
router.patch('/orders/:id/status', [
  body('status').isIn(['picked_up', 'delivered']).withMessage('Invalid status'),
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

    // Check if rider is assigned to this order
    if (order.rider?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      'rider_assigned': ['picked_up'],
      'picked_up': ['delivered']
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    await order.updateStatus(status, note, 'rider');

    // If delivered, update earnings
    if (status === 'delivered') {
      const rider = await Rider.findById(req.user.id);
      await rider.addEarnings(order.pricing.deliveryFee);
    }

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

// Get rider earnings
router.get('/earnings', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const rider = await Rider.findOne({ _id: req.user.id, tenant });
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json({
      earnings: {
        today: rider.earnings.today,
        thisWeek: rider.earnings.thisWeek,
        thisMonth: rider.earnings.thisMonth,
        total: rider.earnings.total
      },
      performance: rider.performance
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// Get rider orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    let query = { rider: req.user.id, tenant };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('store', 'name address contact')
      .populate('customer', 'name phone deliveryAddress')
      .select('orderNumber status pricing estimatedDeliveryTime createdAt items store customer deliveryAddress')
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
    console.error('Get rider orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;