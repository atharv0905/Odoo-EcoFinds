const mongoose = require('mongoose');

const vendorPaymentConfigSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['manual', 'razorpay'],
    default: 'manual'
  },
  // Razorpay configuration
  razorpay: {
    keyId: {
      type: String,
      sparse: true
    },
    keySecret: {
      type: String,
      sparse: true
    },
    webhookSecret: {
      type: String,
      sparse: true
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },
  // Manual payment configuration
  manual: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    enabled: {
      type: Boolean,
      default: true
    }
  },
  // Commission settings
  commission: {
    percentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
vendorPaymentConfigSchema.index({ vendorId: 1 });

// Method to get active payment method
vendorPaymentConfigSchema.methods.getActivePaymentMethod = function() {
  if (this.razorpay.enabled && this.razorpay.keyId && this.razorpay.keySecret) {
    return 'razorpay';
  }
  return 'manual';
};

// Method to get payment configuration for active method
vendorPaymentConfigSchema.methods.getPaymentConfig = function() {
  const activeMethod = this.getActivePaymentMethod();
  
  if (activeMethod === 'razorpay') {
    return {
      method: 'razorpay',
      config: {
        keyId: this.razorpay.keyId,
        keySecret: this.razorpay.keySecret,
        webhookSecret: this.razorpay.webhookSecret
      }
    };
  }
  
  return {
    method: 'manual',
    config: this.manual
  };
};

module.exports = mongoose.model('VendorPaymentConfig', vendorPaymentConfigSchema);
