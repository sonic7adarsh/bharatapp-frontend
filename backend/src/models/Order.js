const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    default: null
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    substitution: {
      allowed: { type: Boolean, default: true },
      note: String
    }
  }],
  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  deliveryAddress: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    instructions: String
  },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'out_for_delivery', 'delivered', 'cancelled', 'failed'],
    default: 'placed'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    actor: { type: String, enum: ['customer', 'store', 'rider', 'system'] }
  }],
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  estimatedDeliveryTime: {
    min: Number, // minutes
    max: Number  // minutes
  },
  actualDeliveryTime: Date,
  preparationTime: {
    estimated: Number, // minutes
    actual: Number     // minutes
  },
  riderAssignment: {
    assignedAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  cancellation: {
    cancelledBy: { type: String, enum: ['customer', 'store', 'rider', 'system'] },
    reason: String,
    cancelledAt: Date
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    images: [String]
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
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ store: 1, status: 1, createdAt: -1 });
orderSchema.index({ rider: 1, status: 1 });
orderSchema.index({ orderNumber: 1, tenant: 1 });
orderSchema.index({ zone: 1, status: 1 });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

// Method to update status with history
orderSchema.methods.updateStatus = function(newStatus, note = '', actor = 'system') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note,
    actor
  });
  
  // Update actual delivery time when delivered
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to assign rider
orderSchema.methods.assignRider = function(riderId) {
  this.rider = riderId;
  this.riderAssignment.assignedAt = new Date();
  this.status = 'rider_assigned';
  
  this.statusHistory.push({
    status: 'rider_assigned',
    actor: 'system',
    note: `Rider ${riderId} assigned`
  });
  
  return this.save();
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status, storeId = null) {
  const query = { status };
  if (storeId) {
    query.store = storeId;
  }
  return this.find(query).populate('customer store rider', 'name phone');
};

// Static method to find pending rider assignments
orderSchema.statics.findPendingRiderAssignments = function(zoneId) {
  return this.find({
    zone: zoneId,
    status: 'ready_for_pickup',
    rider: null
  }).populate('store', 'name address.coordinates');
};

module.exports = mongoose.model('Order', orderSchema);