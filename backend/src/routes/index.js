const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'BharatShop Hyperlocal Marketplace API',
    version: '1.0.0',
    description: 'Hyperlocal marketplace connecting local stores with customers',
    endpoints: {
      health: '/api/health',
      zones: '/api/zones',
      stores: '/api/stores',
      products: '/api/products',
      orders: '/api/orders',
      auth: '/api/auth',
      riders: '/api/riders'
    },
    features: [
      'Zone-based serviceability',
      'Store discovery and product browsing',
      'Real-time inventory management',
      'Order lifecycle management',
      'Rider assignment and tracking',
      'OTP-based authentication',
      'Multi-tenant support'
    ]
  });
});

module.exports = router;