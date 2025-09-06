const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ProductOrder = require('../models/ProductOrder');
const User = require('../models/User');
const Product = require('../models/Product');

// Get all payments with filtering and user details
router.get('/payments', async (req, res) => {
  try {
    const { filter = 'all', status = 'all', page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Filter by payment method
    if (filter === 'manual') {
      query.paymentMethod = 'manual';
    } else if (filter === 'razorpay') {
      query.paymentMethod = 'razorpay';
    }
    
    // Filter by payment status
    if (status !== 'all') {
      query.paymentStatus = status;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get user details for all orders
    const buyerIds = [...new Set(orders.map(order => order.buyerId))];
    const users = await User.find({ firebaseId: { $in: buyerIds } });
    const usersMap = users.reduce((acc, user) => {
      acc[user.firebaseId] = user;
      return acc;
    }, {});

    // Get product orders for each order
    const orderIds = orders.map(order => order._id);
    const productOrders = await ProductOrder.find({ orderId: { $in: orderIds } })
      .populate('productId', 'title image category')
      .exec();

    // Group product orders by orderId
    const productOrdersMap = productOrders.reduce((acc, po) => {
      if (!acc[po.orderId]) {
        acc[po.orderId] = [];
      }
      acc[po.orderId].push(po);
      return acc;
    }, {});

    // Get seller details
    const sellerIds = [...new Set(productOrders.map(po => po.sellerId))];
    const sellers = await User.find({ firebaseId: { $in: sellerIds } });
    const sellersMap = sellers.reduce((acc, seller) => {
      acc[seller.firebaseId] = seller;
      return acc;
    }, {});

    // Combine all data
    const paymentsWithDetails = orders.map(order => ({
      ...order.toObject(),
      buyer: usersMap[order.buyerId] || { name: 'Unknown', email: 'Unknown' },
      productOrders: productOrdersMap[order._id] || [],
      sellers: [...new Set((productOrdersMap[order._id] || []).map(po => po.sellerId))]
        .map(sellerId => sellersMap[sellerId] || { name: 'Unknown', email: 'Unknown' })
    }));

    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Get summary statistics
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
            }
          },
          unpaidOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0]
            }
          },
          manualPayments: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'manual'] }, 1, 0]
            }
          },
          razorpayPayments: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'razorpay'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      message: 'Admin payments retrieved successfully',
      payments: paymentsWithDetails,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      stats: stats[0] || {
        totalAmount: 0,
        totalOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0,
        manualPayments: 0,
        razorpayPayments: 0
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// Mark manual payment as sent
router.patch('/payments/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (action === 'mark_manual_paid') {
      if (order.paymentMethod !== 'manual') {
        return res.status(400).json({
          error: 'Only manual payments can be marked as paid by admin'
        });
      }

      await order.markAsPaid({
        paymentId: `admin_manual_${Date.now()}`,
        adminProcessed: true,
        adminProcessedAt: new Date()
      });

      // Also update associated product orders
      await ProductOrder.updateMany(
        { orderId: order._id },
        {
          paymentStatus: 'paid',
          status: 'confirmed'
        }
      );

      res.json({
        message: 'Manual payment marked as paid successfully',
        order
      });
    } else {
      res.status(400).json({
        error: 'Invalid action'
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Get buyer details for recent orders
    const buyerIds = recentOrders.map(order => order.buyerId);
    const buyers = await User.find({ firebaseId: { $in: buyerIds } });
    const buyersMap = buyers.reduce((acc, buyer) => {
      acc[buyer.firebaseId] = buyer;
      return acc;
    }, {});

    const recentOrdersWithBuyers = recentOrders.map(order => ({
      ...order.toObject(),
      buyer: buyersMap[order.buyerId] || { name: 'Unknown', email: 'Unknown' }
    }));

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      message: 'Admin dashboard stats retrieved successfully',
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders: recentOrdersWithBuyers,
        paymentBreakdown,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// Get all users with their payment preferences
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments();

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

module.exports = router;
