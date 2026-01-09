const Zone = require('../models/Zone');
const Store = require('../models/Store');

// Check if coordinates are serviceable
const checkServiceability = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    // Find zone containing the point
    const zone = await Zone.findZoneContainingPoint(latitude, longitude, tenant);
    
    if (!zone) {
      return res.status(400).json({ 
        error: 'Service not available in this area',
        message: 'We are not serving your location yet. Please check back later.'
      });
    }

    req.serviceableZone = zone;
    next();
  } catch (error) {
    console.error('Serviceability check error:', error);
    res.status(500).json({ error: 'Failed to check serviceability' });
  }
};

// Validate store is in user's serviceable zone
const validateStoreZone = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const store = await Store.findById(storeId).populate('zone');
    if (!store || !store.isActive) {
      return res.status(404).json({ error: 'Store not found or inactive' });
    }

    // If coordinates provided, check if store is serviceable from user's location
    if (latitude && longitude) {
      const userZone = await Zone.findZoneContainingPoint(latitude, longitude, store.tenant);
      if (!userZone || userZone._id.toString() !== store.zone._id.toString()) {
        return res.status(400).json({ 
          error: 'Store not serviceable from your location',
          message: 'This store does not deliver to your area'
        });
      }
    }

    req.validStore = store;
    next();
  } catch (error) {
    console.error('Store zone validation error:', error);
    res.status(500).json({ error: 'Failed to validate store zone' });
  }
};

// Get serviceable stores for a zone
const getServiceableStores = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const tenant = req.headers['x-tenant-domain'] || 'bharatshop';
    
    // Find zone containing the point
    const zone = await Zone.findZoneContainingPoint(latitude, longitude, tenant);
    
    if (!zone) {
      return res.status(400).json({ 
        error: 'Service not available in this area',
        message: 'We are not serving your location yet. Please check back later.'
      });
    }

    // Find active stores in this zone
    const stores = await Store.find({
      zone: zone._id,
      isActive: true,
      isOpen: true,
      temporaryClosure: { $exists: false }
    })
    .populate('zone', 'name deliveryEta')
    .select('name slug category address contact operatingHours rating')
    .sort({ rating: -1, name: 1 });

    req.serviceableStores = stores;
    req.serviceableZone = zone;
    next();
  } catch (error) {
    console.error('Get serviceable stores error:', error);
    res.status(500).json({ error: 'Failed to fetch serviceable stores' });
  }
};

// Calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
  checkServiceability,
  validateStoreZone,
  getServiceableStores,
  calculateDistance
};