const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  products: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

// Indexes
purchaseSchema.index({ userId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
