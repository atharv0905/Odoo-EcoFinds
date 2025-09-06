const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Email service is configured in services/emailService.js

// Import routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const productOrderRoutes = require('./routes/productOrderRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow all origins
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: false, // Set to false when origin is '*'
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/product-orders', productOrderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoFinds API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      cart: '/api/cart',
      purchases: '/api/purchases',
      productOrders: '/api/product-orders',
      orders: '/api/orders',
      payments: '/api/payments'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`EcoFinds API server is running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

module.exports = app;
