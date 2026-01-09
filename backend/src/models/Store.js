const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['kirana', 'pharmacy', 'general', 'restaurant', 'hospitality', 'services']
  },
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    ownerName: { type: String, required: true }
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  temporaryClosure: {
    isClosed: { type: Boolean, default: false },
    reason: String,
    until: Date
  },
  prepTime: {
    type: Number, // minutes
    default: 15,
    min: 5,
    max: 120
  },
  deliveryRadius: {
    type: Number, // kilometers
    default: 5,
    min: 1,
    max: 15
  },
  commissionRate: {
    type: Number, // percentage
    default: 10,
    min: 0,
    max: 30
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: String,
    required: true,
    default: 'bharatshop'
  }
}, {
  timestamps: true
});

// Indexes
storeSchema.index({ zone: 1, isActive: 1, isOpen: 1 });
storeSchema.index({ slug: 1, tenant: 1 });
storeSchema.index({ 'address.coordinates': '2dsphere' });

// Method to check if store is currently open
storeSchema.methods.isCurrentlyOpen = function() {
  if (this.temporaryClosure.isClosed) return false;
  if (!this.isOpen || !this.isActive) return false;
  
  const now = new Date();
  const day = now.toLocaleString('en-US', { weekday: 'lowercase' });
  const todayHours = this.operatingHours[day];
  
  if (!todayHours || !todayHours.isOpen) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Static method to find active stores in a zone
storeSchema.statics.findActiveInZone = function(zoneId) {
  return this.find({
    zone: zoneId,
    isActive: true,
    isOpen: true,
    'temporaryClosure.isClosed': false
  }).populate('zone', 'name code deliveryEta');
};

module.exports = mongoose.model('Store', storeSchema);