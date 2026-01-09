const mongoose = require('mongoose');

// Zone Schema
const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of numbers
      required: true
    }
  },
  center: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  radius: {
    type: Number, // in kilometers
    required: true,
    min: 1,
    max: 50
  },
  deliveryEta: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 120
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenant: {
    type: String,
    required: true,
    default: 'bharatshop'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
zoneSchema.index({ coordinates: '2dsphere' });

// Method to check if a point is inside this zone
zoneSchema.methods.isPointInside = function(latitude, longitude) {
  const point = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  
  return this.coordinates.coordinates.some(polygon => {
    return isPointInPolygon(point.coordinates, polygon);
  });
};

// Static method to find zone containing a point
zoneSchema.statics.findZoneContainingPoint = async function(latitude, longitude, tenant = 'bharatshop') {
  const point = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  
  return this.findOne({
    coordinates: {
      $geoIntersects: {
        $geometry: point
      }
    },
    isActive: true,
    tenant
  });
};

// Static method to find zones near a point within radius
zoneSchema.statics.findZonesNearPoint = async function(latitude, longitude, maxDistance = 10000, tenant = 'bharatshop') {
  return this.find({
    center: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    tenant
  });
};

// Helper function to check if point is in polygon
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

module.exports = mongoose.model('Zone', zoneSchema);