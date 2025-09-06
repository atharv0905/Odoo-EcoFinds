const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create user (only name and email required)
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ 
        error: 'Name and email are required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    const user = new User({
      email,
      name
    });

    const savedUser = await user.save();
    res.status(201).json({
      message: 'User created successfully. Complete your profile using the update endpoint.',
      user: savedUser
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, paymentConfig, gamification, role } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (paymentConfig) updateData.paymentConfig = paymentConfig;
    if (gamification) updateData.gamification = gamification;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'User profile updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update user profile (dedicated endpoint for profile updates)
router.put('/:id/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update payment configuration
router.put('/:id/payment-config', async (req, res) => {
  try {
    const { paymentConfig } = req.body;
    
    if (!paymentConfig) {
      return res.status(400).json({ 
        error: 'Payment configuration is required' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { paymentConfig },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'Payment configuration updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update gamification data
router.put('/:id/gamification', async (req, res) => {
  try {
    const { gamification } = req.body;
    
    if (!gamification) {
      return res.status(400).json({ 
        error: 'Gamification data is required' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { gamification },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'Gamification data updated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
