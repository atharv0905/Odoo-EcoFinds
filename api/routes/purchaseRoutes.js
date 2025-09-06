const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');

// Add purchase
router.post('/', async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'userId and products array are required' 
      });
    }

    const purchase = new Purchase({
      userId,
      products
    });

    const savedPurchase = await purchase.save();
    res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase: savedPurchase
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get user's previous purchases
router.get('/:userId', async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.params.userId })
                                  .sort({ createdAt: -1 });
    
    // Calculate total products purchased
    const totalProducts = purchases.reduce((sum, purchase) => 
      sum + purchase.products.length, 0
    );

    res.json({
      message: 'Purchase history retrieved successfully',
      purchases,
      count: purchases.length,
      totalProducts
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
