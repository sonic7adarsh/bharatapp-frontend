const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'seller']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, email, phone, password, role = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }],
      tenant
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      tenant
    });

    await user.save();

    const token = user.generateToken();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[6-9]\d{9}$/),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    const user = await User.findOne({
      $or: [{ email }, { phone }],
      tenant
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = user.generateToken();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get profile
router.get('/profile', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const user = await User.findOne({ _id: req.user.id, tenant })
      .select('-password -otp');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.patch('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[6-9]\d{9}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, email, phone } = req.body;

    const user = await User.findOne({ _id: req.user.id, tenant });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for duplicate email/phone
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, tenant });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email;
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, tenant });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone already exists' });
      }
      user.phone = phone;
    }

    if (name) user.name = name;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add address
router.post('/addresses', [
  body('type').isIn(['home', 'work', 'other']).withMessage('Valid address type is required'),
  body('address').isObject().withMessage('Address is required'),
  body('address.street').trim().isLength({ min: 1 }).withMessage('Street is required'),
  body('address.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('address.pincode').matches(/^[1-9]\d{5}$/).withMessage('Valid pincode is required'),
  body('address.coordinates').optional().isObject(),
  body('address.coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
  body('address.coordinates.lng').optional().isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { type, address } = req.body;

    const user = await User.findOne({ _id: req.user.id, tenant });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAddress = {
      type,
      ...address,
      isDefault: user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// Get addresses
router.get('/addresses', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    const user = await User.findOne({ _id: req.user.id, tenant })
      .select('addresses');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

module.exports = router;