const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Send OTP
router.post('/send-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { phone } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update or create user with OTP
    let user = await User.findOne({ phone, tenant });
    if (user) {
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0
      };
      await user.save();
    } else {
      // Create new user with OTP
      user = new User({
        phone,
        name: `user${Date.now()}`, // Temporary name
        email: `${phone}@temp.com`, // Temporary email
        password: 'temp123', // Will be set later
        role: 'customer',
        tenant
      });
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0
      };
      await user.save();
    }

    // In production, send OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      phone,
      expiresIn: 300 // 5 minutes
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone, tenant });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ error: 'No OTP found' });
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Check if OTP is correct
    if (user.otp.code !== otp) {
      user.otp.attempts += 1;
      if (user.otp.attempts >= 3) {
        // Clear OTP after 3 failed attempts
        user.otp = undefined;
        await user.save();
        return res.status(400).json({ error: 'Too many failed attempts. Please request new OTP.' });
      }
      await user.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid - clear it and generate token
    user.otp = undefined;
    await user.save();

    const token = user.generateToken();

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isNewUser: user.name.startsWith('user') // Check if temporary name
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;