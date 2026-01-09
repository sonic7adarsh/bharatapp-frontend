const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const { checkServiceability, getServiceableStores } = require('../middleware/zoneMiddleware');
const { body, validationResult } = require('express-validator');

// Check serviceability for coordinates
router.post('/check', [
  body('lat').isNumeric().withMessage('Latitude must be a number'),
  body('lng').isNumeric().withMessage('Longitude must be a number')
], checkServiceability);

// Get serviceable stores for location
router.get('/stores', getServiceableStores);

// Get all active zones
router.get('/', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const zones = await Zone.find({ isActive: true, tenant })
      .select('name code centerPoint radius deliveryEta')
      .sort({ name: 1 });
    
    res.json({ zones });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// Get zone by ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const zone = await Zone.findOne({ _id: req.params.id, tenant })
      .select('name code centerPoint radius deliveryEta');
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    res.json({ zone });
  } catch (error) {
    console.error('Get zone error:', error);
    res.status(500).json({ error: 'Failed to fetch zone' });
  }
});

// Create new zone (admin only)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Code must be at least 2 characters'),
  body('centerPoint.lat').isNumeric().withMessage('Center latitude must be a number'),
  body('centerPoint.lng').isNumeric().withMessage('Center longitude must be a number'),
  body('radius').isNumeric().isInt({ min: 1, max: 50 }).withMessage('Radius must be between 1-50 km')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    const { name, code, centerPoint, radius, deliveryEta } = req.body;

    // Check if code already exists
    const existing = await Zone.findOne({ code: code.toUpperCase(), tenant });
    if (existing) {
      return res.status(400).json({ error: 'Zone code already exists' });
    }

    const zone = new Zone({
      name,
      code: code.toUpperCase(),
      centerPoint,
      radius,
      deliveryEta: deliveryEta || { min: 15, max: 45 },
      tenant
    });

    await zone.save();
    
    res.status(201).json({ 
      message: 'Zone created successfully',
      zone: {
        id: zone._id,
        name: zone.name,
        code: zone.code,
        centerPoint: zone.centerPoint,
        radius: zone.radius,
        deliveryEta: zone.deliveryEta
      }
    });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

module.exports = router;