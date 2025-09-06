const express = require('express');
const router = express.Router();
const ProductOrder = require('../models/ProductOrder');
const Product = require('../models/Product');

// Create a new product order
router.post('/', async (req, res) => {
  try {
    const { productId, sellerId, buyerId, quantity, shippingAddress, notes } = req.body;

    if (!productId || !sellerId || !buyerId || !quantity) {
      return res.status(400).json({ 
        error: 'Product ID, seller ID, buyer ID, and quantity are required' 
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Check if product belongs to the seller
    if (product.createdBy !== sellerId) {
      return res.status(403).json({ 
        error: 'Product does not belong to the specified seller' 
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${product.stock}` 
      });
    }

    // Check if buyer is not the seller
    if (buyerId === sellerId) {
      return res.status(400).json({ 
        error: 'Cannot buy your own product' 
      });
    }

    // Create the order
    const productOrder = new ProductOrder({
      productId,
      sellerId,
      buyerId,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      shippingAddress,
      notes
    });

    const savedOrder = await productOrder.save();

    // Reduce product stock
    product.reduceStock(quantity);
    await product.save();

    // Populate product details for response
    await savedOrder.populate('productId', 'title image category');

    res.status(201).json({
      message: 'Order placed successfully',
      order: savedOrder
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get orders for a seller (products they sell)
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await ProductOrder.getSellerOrders(req.params.sellerId, status);
    
    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    
    res.json({
      message: 'Seller orders retrieved successfully',
      orders,
      summary: {
        totalOrders,
        totalRevenue,
        pendingOrders
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get orders for a buyer (products they buy)
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await ProductOrder.getBuyerOrders(req.params.buyerId, status);
    
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

// Get orders for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const orders = await ProductOrder.find({ productId: req.params.productId })
      .populate('productId', 'title image category')
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Product orders retrieved successfully',
      orders,
      count: orders.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await ProductOrder.findById(req.params.id)
      .populate('productId', 'title image category description');
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }
    
    res.json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, sellerId } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required' 
      });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const order = await ProductOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Verify seller permission
    if (sellerId && order.sellerId !== sellerId) {
      return res.status(403).json({ 
        error: 'Only the seller can update order status' 
      });
    }

    // Handle cancellation - restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.addStock(order.quantity);
        await product.save();
      }
    }

    order.status = status;
    await order.save();

    await order.populate('productId', 'title image category');

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Cancel order (buyer or seller can cancel)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    const order = await ProductOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Check if user is buyer or seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ 
        error: 'Only buyer or seller can cancel the order' 
      });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled in its current status' 
      });
    }

    // Restore stock to product
    const product = await Product.findById(order.productId);
    if (product) {
      product.addStock(order.quantity);
      await product.save();
    }

    order.status = 'cancelled';
    if (reason) order.notes = (order.notes || '') + `\nCancellation reason: ${reason}`;
    await order.save();

    await order.populate('productId', 'title image category');

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

// Get order statistics for seller
router.get('/seller/:sellerId/stats', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    
    // Get all orders for seller
    const allOrders = await ProductOrder.find({ sellerId });
    
    // Calculate statistics
    const stats = {
      totalOrders: allOrders.length,
      totalRevenue: allOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      averageOrderValue: allOrders.length > 0 ? allOrders.reduce((sum, order) => sum + order.totalPrice, 0) / allOrders.length : 0,
      statusBreakdown: {
        pending: allOrders.filter(o => o.status === 'pending').length,
        confirmed: allOrders.filter(o => o.status === 'confirmed').length,
        shipped: allOrders.filter(o => o.status === 'shipped').length,
        delivered: allOrders.filter(o => o.status === 'delivered').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length
      }
    };
    
    res.json({
      message: 'Seller statistics retrieved successfully',
      stats
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
