const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'manual', 'cash_on_delivery'],
    default: 'manual'
  },
  paymentId: {
    type: String,
    sparse: true
  },
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['draft', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'draft'
  },
  // Admin manual payment tracking
  adminProcessed: {
    type: Boolean,
    default: false
  },
  adminProcessedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ adminProcessed: 1 });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24)); // days
});

// Static method to get orders by buyer
orderSchema.statics.getBuyerOrders = function(buyerId, status = null) {
  const query = { buyerId };
  if (status) query.status = status;
  return this.find(query)
    .sort({ createdAt: -1 });
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['draft', 'pending_payment', 'paid', 'processing'].includes(this.status);
};

// Method to update payment status
orderSchema.methods.markAsPaid = function(paymentDetails = {}) {
  this.paymentStatus = 'paid';
  this.status = 'paid';
  
  if (paymentDetails.paymentId) {
    this.paymentId = paymentDetails.paymentId;
  }
  if (paymentDetails.razorpayPaymentId) {
    this.razorpayPaymentId = paymentDetails.razorpayPaymentId;
  }
  if (paymentDetails.razorpaySignature) {
    this.razorpaySignature = paymentDetails.razorpaySignature;
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
