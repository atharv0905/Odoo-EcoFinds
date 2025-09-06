const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const VendorPaymentConfig = require('../models/VendorPaymentConfig');

// Get vendor payment configuration
router.get('/vendor-config/:vendorId', async (req, res) => {
  try {
    let config = await VendorPaymentConfig.findOne({ vendorId: req.params.vendorId });
    
    if (!config) {
      // Create default config if not exists
      config = new VendorPaymentConfig({
        vendorId: req.params.vendorId,
        paymentMethod: 'manual',
        manual: {
          enabled: true
        }
      });
      await config.save();
    }

    const paymentConfig = config.getPaymentConfig();

    res.json({
      message: 'Vendor payment configuration retrieved',
      config: {
        method: paymentConfig.method,
        // Only send non-sensitive config data
        ...(paymentConfig.method === 'razorpay' && {
          razorpay: {
            keyId: paymentConfig.config.keyId,
            enabled: config.razorpay.enabled
          }
        }),
        ...(paymentConfig.method === 'manual' && {
          manual: {
            accountHolderName: paymentConfig.config.accountHolderName,
            bankName: paymentConfig.config.bankName,
            upiId: paymentConfig.config.upiId,
            enabled: paymentConfig.config.enabled
          }
        })
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update vendor payment configuration
router.put('/vendor-config/:vendorId', async (req, res) => {
  try {
    const { paymentMethod, razorpay, manual, commission } = req.body;
    
    let config = await VendorPaymentConfig.findOne({ vendorId: req.params.vendorId });
    
    if (!config) {
      config = new VendorPaymentConfig({ vendorId: req.params.vendorId });
    }

    if (paymentMethod) config.paymentMethod = paymentMethod;
    if (razorpay) config.razorpay = { ...config.razorpay, ...razorpay };
    if (manual) config.manual = { ...config.manual, ...manual };
    if (commission) config.commission = { ...config.commission, ...commission };

    await config.save();

    res.json({
      message: 'Vendor payment configuration updated successfully',
      config
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Create Razorpay order for payment
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        error: 'Order ID is required' 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Get product orders to identify vendors
    const ProductOrder = require('../models/ProductOrder');
    const productOrders = await ProductOrder.find({ orderId: order._id });
    
    if (!productOrders || productOrders.length === 0) {
      return res.status(400).json({ 
        error: 'No product orders found for this order' 
      });
    }

    // Get unique vendor IDs
    const vendorIds = [...new Set(productOrders.map(po => po.sellerId))];
    
    // Determine which Razorpay keys to use
    let razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    let selectedVendorId = null;

    // Check if any vendor has their own Razorpay configuration
    for (const vendorId of vendorIds) {
      const vendorConfig = await VendorPaymentConfig.findOne({ vendorId });
      
      if (vendorConfig && vendorConfig.razorpay.enabled && 
          vendorConfig.razorpay.keyId && vendorConfig.razorpay.keySecret) {
        // Vendor has their own Razorpay keys - use those
        razorpayKeyId = vendorConfig.razorpay.keyId;
        razorpayKeySecret = vendorConfig.razorpay.keySecret;
        selectedVendorId = vendorId;
        break; // Use the first vendor with custom keys
      }
    }

    // If no vendor has custom keys, use default environment keys
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(400).json({ 
        error: 'Razorpay keys not configured' 
      });
    }

    // Initialize Razorpay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(order.totalAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        buyerId: order.buyerId,
        vendors: vendorIds.join(','),
        selectedVendor: selectedVendorId || 'default'
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentMethod = 'razorpay';
    await order.save();

    res.json({
      message: 'Razorpay order created successfully',
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      keyId: razorpayKeyId,
      selectedVendor: selectedVendorId || 'default',
      paymentConfig: selectedVendorId ? 'vendor_custom' : 'default'
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Verify Razorpay payment
router.post('/verify-razorpay-payment', async (req, res) => {
  try {
    const { 
      orderId, 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        error: 'All payment details are required' 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ 
        error: 'Order ID mismatch' 
      });
    }

    // Get product orders to identify vendors and determine which keys were used
    const ProductOrder = require('../models/ProductOrder');
    const productOrders = await ProductOrder.find({ orderId: order._id });
    const vendorIds = [...new Set(productOrders.map(po => po.sellerId))];
    
    // Determine which key secret to use for verification (same logic as order creation)
    let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    // Check if any vendor has their own Razorpay configuration
    for (const vendorId of vendorIds) {
      const vendorConfig = await VendorPaymentConfig.findOne({ vendorId });
      
      if (vendorConfig && vendorConfig.razorpay.enabled && 
          vendorConfig.razorpay.keyId && vendorConfig.razorpay.keySecret) {
        // Vendor has their own Razorpay keys - use their secret for verification
        razorpayKeySecret = vendorConfig.razorpay.keySecret;
        break; // Use the first vendor with custom keys
      }
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ 
        error: 'Invalid payment signature' 
      });
    }

    // Mark order as paid
    await order.markAsPaid({
      paymentId: razorpayPaymentId,
      razorpayPaymentId,
      razorpaySignature
    });

    res.json({
      message: 'Payment verified and order marked as paid',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Handle Razorpay webhooks
router.post('/razorpay-webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (secret) {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      // Find order by Razorpay order ID
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      
      if (order && order.paymentStatus !== 'paid') {
        await order.markAsPaid({
          paymentId: payment.id,
          razorpayPaymentId: payment.id
        });
        
        console.log(`Order ${order._id} marked as paid via webhook`);
      }
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
