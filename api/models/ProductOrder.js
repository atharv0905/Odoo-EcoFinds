const mongoose = require('mongoose');

const productOrderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productOrderSchema.index({ sellerId: 1, createdAt: -1 });
productOrderSchema.index({ buyerId: 1, createdAt: -1 });
productOrderSchema.index({ productId: 1, createdAt: -1 });
productOrderSchema.index({ status: 1 });

// Pre-save middleware to calculate total price
productOrderSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  next();
});

// Virtual for order age
productOrderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24)); // days
});

// Instance method to check if order can be cancelled
productOrderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Static method to get orders by seller
productOrderSchema.statics.getSellerOrders = function(sellerId, status = null) {
  const query = { sellerId };
  if (status) query.status = status;
  return this.find(query)
    .populate('productId', 'title image category')
    .sort({ createdAt: -1 });
};

// Static method to get orders by buyer
productOrderSchema.statics.getBuyerOrders = function(buyerId, status = null) {
  const query = { buyerId };
  if (status) query.status = status;
  return this.find(query)
    .populate('productId', 'title image category')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('ProductOrder', productOrderSchema);
