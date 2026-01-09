const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['groceries', 'dairy', 'beverages', 'snacks', 'personal-care', 'household', 'pharmacy', 'others']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    alt: String
  }],
  pricing: {
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0 }
  },
  inventory: {
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, enum: ['piece', 'kg', 'g', 'ml', 'l', 'pack'] },
    lowStockThreshold: { type: Number, default: 5 },
    maxOrderQuantity: { type: Number, default: 10 }
  },
  specifications: {
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shelfLife: String,
    storageInstructions: String
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String],
  tenant: {
    type: String,
    required: true,
    default: 'bharatshop'
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ category: 1, subcategory: 1, store: 1 });
productSchema.index({ slug: 1, store: 1, tenant: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.inventory.stock === 0) return 'out_of_stock';
  if (this.inventory.stock <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Method to check if quantity can be ordered
productSchema.methods.canOrderQuantity = function(quantity) {
  return this.inventory.stock >= quantity && quantity <= this.inventory.maxOrderQuantity;
};

// Method to reduce stock
productSchema.methods.reduceStock = async function(quantity) {
  if (!this.canOrderQuantity(quantity)) {
    throw new Error('Insufficient stock');
  }
  this.inventory.stock -= quantity;
  return this.save();
};

// Static method to find active products by store
productSchema.statics.findActiveByStore = function(storeId, category = null) {
  const query = { store: storeId, isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query).populate('store', 'name slug');
};

// Static method to find in-stock products
productSchema.statics.findInStock = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true,
    'inventory.stock': { $gt: 0 }
  }).populate('store', 'name slug');
};

module.exports = mongoose.model('Product', productSchema);