const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
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
  image: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ title: 'text', description: 'text' }); // Text index for searching
productSchema.index({ category: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ category: 1, title: 1 }); // Compound index

module.exports = mongoose.model('Product', productSchema);
