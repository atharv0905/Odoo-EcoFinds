const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Create text index for search functionality
productSchema.index({ 
  title: 'text', 
  description: 'text',
  category: 'text'
});

// Additional indexes for better query performance
productSchema.index({ category: 1, title: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, stock: 1 });

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= 5) return 'low_stock';
  return 'in_stock';
});

// Instance method to reduce stock
productSchema.methods.reduceStock = function(quantity) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    this.totalSold += quantity;
    this.isActive = this.stock > 0;
    return true;
  }
  return false;
};

// Instance method to add stock
productSchema.methods.addStock = function(quantity) {
  this.stock += quantity;
  this.isActive = this.stock > 0;
};

// Instance method to increment view count
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);