const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ 
        error: 'userId and productId are required' 
      });
    }

    // Find existing cart for user
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if product exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if product doesn't exist
        cart.items.push({ productId, quantity });
      }
    } else {
      // Create new cart if doesn't exist
      cart = new Cart({
        userId,
        items: [{ productId, quantity }]
      });
    }

    const savedCart = await cart.save();
    res.status(201).json({
      message: 'Item added to cart successfully',
      cart: savedCart
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get cart items
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      return res.json({
        message: 'Cart is empty',
        cart: { userId: req.params.userId, items: [] },
        totalItems: 0
      });
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      message: 'Cart retrieved successfully',
      cart,
      totalItems
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Remove item from cart
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ 
        error: 'Cart not found' 
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => item.productId !== productId);

    const savedCart = await cart.save();
    
    res.json({
      message: 'Item removed from cart successfully',
      cart: savedCart
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
