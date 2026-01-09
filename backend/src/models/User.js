const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: function() { return !this.phone; },
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: function() { return !this.email; },
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.phone; },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin', 'rider'],
    default: 'customer'
  },
  avatar: {
    url: String,
    publicId: String
  },
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    name: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: { type: Boolean, default: false }
  }],
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses'
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  deviceTokens: [String],
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
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
userSchema.index({ email: 1, tenant: 1 });
userSchema.index({ phone: 1, tenant: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      tenant: this.tenant
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Method to add address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address, make it default
  if (this.addresses.length === 0) {
    addressData.isDefault = true;
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Method to set default address
userSchema.methods.setDefaultAddress = function(addressId) {
  this.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId;
  });
  return this.save();
};

// Static method to find by email or phone
userSchema.statics.findByEmailOrPhone = function(email, phone) {
  const query = {};
  if (email) query.email = email;
  if (phone) query.phone = phone;
  return this.findOne(query);
};

module.exports = mongoose.model('User', userSchema);