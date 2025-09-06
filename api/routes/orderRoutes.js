const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ProductOrder = require('../models/ProductOrder');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const VendorPaymentConfig = require('../models/VendorPaymentConfig');

// Create/Save order from cart (draft status)
router.post('/save-from-cart', async (req, res) => {
  try {
    const { buyerId, shippingAddress, phoneNumber, notes } = req.body;

    if (!buyerId || !shippingAddress || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Buyer ID, shipping address, and phone number are required' 
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: buyerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        error: 'Cart is empty' 
      });
    }

    // Check if user already has a draft order, update it instead of creating new
    let order = await Order.findOne({ 
      buyerId, 
      status: { $in: ['draft', 'pending_payment'] } 
    });

    // Get product details and calculate total
    let totalAmount = 0;
    const productDetails = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          error: `Product ${item.productId} not found` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product.title}. Available: ${product.stock}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      productDetails.push({
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    if (order) {
      // Update existing order
      order.totalAmount = totalAmount;
      order.shippingAddress = shippingAddress;
      order.phoneNumber = phoneNumber;
      order.notes = notes;
      await order.save();

      // Delete existing product orders for this order
      await ProductOrder.deleteMany({ orderId: order._id });
    } else {
      // Create new order
      order = new Order({
        buyerId,
        totalAmount,
        shippingAddress,
        phoneNumber,
        notes,
        status: 'draft'
      });
      await order.save();
    }

    // Create product orders
    for (const item of productDetails) {
      const productOrder = new ProductOrder({
        productId: item.product._id,
        sellerId: item.product.createdBy,
        buyerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        shippingAddress,
        phoneNumber,
        orderId: order._id,
        paymentStatus: 'unpaid'
      });
      await productOrder.save();
    }

    // Clear cart after saving order
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order saved successfully',
      order: {
        _id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        phoneNumber: order.phoneNumber,
        notes: order.notes,
        orderDate: order.orderDate
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get order by ID with product details
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Get associated product orders
    const productOrders = await ProductOrder.find({ orderId: order._id })
      .populate('productId', 'title image category description price');

    // Group by vendor for payment processing
    const vendorGroups = {};
    for (const productOrder of productOrders) {
      const vendorId = productOrder.sellerId;
      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = {
          vendorId,
          items: [],
          totalAmount: 0
        };
      }
      vendorGroups[vendorId].items.push(productOrder);
      vendorGroups[vendorId].totalAmount += productOrder.totalPrice;
    }

    res.json({
      message: 'Order retrieved successfully',
      order: {
        ...order.toObject(),
        productOrders,
        vendorGroups: Object.values(vendorGroups)
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get buyer orders
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await Order.getBuyerOrders(req.params.buyerId, status);
    
    res.json({
      message: 'Buyer orders retrieved successfully',
      orders,
      count: orders.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update order status to pending payment (ready for checkout)
router.patch('/:orderId/checkout', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Order is not in draft status' 
      });
    }

    order.status = 'pending_payment';
    await order.save();

    // Update all associated product orders
    await ProductOrder.updateMany(
      { orderId: order._id },
      { status: 'pending' }
    );

    res.json({
      message: 'Order ready for payment',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Mark order as paid
router.patch('/:orderId/mark-paid', async (req, res) => {
  try {
    const { paymentDetails, buyerId } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ 
        error: 'Unauthorized access to order' 
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ 
        error: 'Order is already paid' 
      });
    }

    // Mark order as paid
    await order.markAsPaid(paymentDetails);

    // Update all associated product orders
    await ProductOrder.updateMany(
      { orderId: order._id },
      { 
        paymentStatus: 'paid',
        status: 'confirmed',
        ...(paymentDetails.paymentId && { paymentId: paymentDetails.paymentId }),
        ...(paymentDetails.razorpayPaymentId && { razorpayPaymentId: paymentDetails.razorpayPaymentId }),
        ...(paymentDetails.razorpaySignature && { razorpaySignature: paymentDetails.razorpaySignature })
      }
    );

    // Reduce stock for all products
    const productOrders = await ProductOrder.find({ orderId: order._id });
    for (const productOrder of productOrders) {
      const product = await Product.findById(productOrder.productId);
      if (product) {
        product.reduceStock(productOrder.quantity);
        await product.save();
      }
    }

    res.json({
      message: 'Order marked as paid successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Cancel order
router.patch('/:orderId/cancel', async (req, res) => {
  try {
    const { buyerId, reason } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ 
        error: 'Unauthorized access to order' 
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled in its current status' 
      });
    }

    // If order was paid, restore stock
    if (order.paymentStatus === 'paid') {
      const productOrders = await ProductOrder.find({ orderId: order._id });
      for (const productOrder of productOrders) {
        const product = await Product.findById(productOrder.productId);
        if (product) {
          product.addStock(productOrder.quantity);
          await product.save();
        }
      }
    }

    order.status = 'cancelled';
    if (reason) order.notes = (order.notes || '') + `\nCancellation reason: ${reason}`;
    await order.save();

    // Update all associated product orders
    await ProductOrder.updateMany(
      { orderId: order._id },
      { status: 'cancelled' }
    );

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
