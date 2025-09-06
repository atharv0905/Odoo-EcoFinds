const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  paymentConfig: {
    mode: {
      type: String,
      enum: ["razorpay_direct", "manual_payout"],
      default: "manual_payout"
    },
    razorpayKeyId: {
      type: String
    },
    razorpaySecret: {
      type: String
    }
  },
  gamification: {
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      type: String
    }],
    level: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ firebaseId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
