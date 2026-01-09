const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    url: String,
    publicId: String
  },
  vehicle: {
    type: { type: String, enum: ['bike', 'scooter', 'bicycle', 'car'], required: true },
    number: { type: String, required: true },
    model: String,
    color: String
  },
  license: {
    number: { type: String, required: true },
    expiry: { type: Date, required: true },
    image: { url: String, publicId: String }
  },
  address: {
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  zones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  }],
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  status: {
    type: String,
    enum: ['offline', 'online', 'busy', 'on_leave'],
    default: 'offline'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  earnings: {
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    todayEarned: { type: Number, default: 0 },
    weekEarned: { type: Number, default: 0 },
    monthEarned: { type: Number, default: 0 }
  },
  performance: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  device: {
    token: String,
    platform: { type: String, enum: ['android', 'ios'] },
    appVersion: String
  },
  availability: {
    monday: { isAvailable: Boolean, start: String, end: String },
    tuesday: { isAvailable: Boolean, start: String, end: String },
    wednesday: { isAvailable: Boolean, start: String, end: String },
    thursday: { isAvailable: Boolean, start: String, end: String },
    friday: { isAvailable: Boolean, start: String, end: String },
    saturday: { isAvailable: Boolean, start: String, end: String },
    sunday: { isAvailable: Boolean, start: String, end: String }
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
riderSchema.index({ phone: 1, tenant: 1 });
riderSchema.index({ email: 1, tenant: 1 });
riderSchema.index({ zones: 1, status: 1, isActive: 1 });
riderSchema.index({ 'currentLocation': '2dsphere' });

// Method to check if rider is available now
riderSchema.methods.isAvailableNow = function() {
  if (!this.isActive || !this.isVerified) return false;
  if (this.status !== 'online') return false;
  
  const now = new Date();
  const day = now.toLocaleString('en-US', { weekday: 'lowercase' });
  const todayAvailability = this.availability[day];
  
  if (!todayAvailability || !todayAvailability.isAvailable) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = todayAvailability.start.split(':').map(Number);
  const [endHour, endMin] = todayAvailability.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Method to update location
riderSchema.methods.updateLocation = function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    updatedAt: new Date()
  };
  return this.save();
};

// Method to update earnings
riderSchema.methods.addEarnings = function(amount) {
  this.earnings.balance += amount;
  this.earnings.totalEarned += amount;
  this.earnings.todayEarned += amount;
  this.earnings.weekEarned += amount;
  this.earnings.monthEarned += amount;
  return this.save();
};

// Static method to find available riders in zones
riderSchema.statics.findAvailableInZones = function(zoneIds) {
  return this.find({
    zones: { $in: zoneIds },
    status: 'online',
    isActive: true,
    isVerified: true
  }).populate('zones', 'name code');
};

// Static method to find nearest available rider
riderSchema.statics.findNearestAvailable = function(lat, lng, zoneIds) {
  return this.findOne({
    zones: { $in: zoneIds },
    status: 'online',
    isActive: true,
    isVerified: true,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: 5000 // 5km radius
      }
    }
  }).populate('zones', 'name code');
};

module.exports = mongoose.model('Rider', riderSchema);