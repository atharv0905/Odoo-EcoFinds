const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Create product
router.post('/', async (req, res) => {
  try {
    const { title, description, category, price, image, createdBy } = req.body;

    const product = new Product({
      title,
      description,
      category,
      price,
      image,
      createdBy
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Update product (owners can update their product details)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, price, image, createdBy } = req.body;
    
    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Optional: Add ownership check if createdBy is provided
    if (createdBy && currentProduct.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only update your own products' 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (image) updateData.image = image;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    res.json({
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get user's products
router.get('/user/:userId', async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.params.userId })
                                  .sort({ createdAt: -1 });
    
    res.json({
      message: 'User products retrieved successfully',
      products,
      count: products.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      message: 'Products retrieved successfully',
      products,
      count: products.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Smart product search with pagination and fallback
router.get('/smart-search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Search query (q) is required' 
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let products = [];
    let totalResults = 0;

    try {
      // Primary search using MongoDB text search
      const textSearchResults = await Product.find({
        $text: { $search: q }
      }, {
        score: { $meta: 'textScore' }
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limitNum);

      // Get total count for text search
      const textSearchTotal = await Product.countDocuments({
        $text: { $search: q }
      });

      if (textSearchResults.length > 0) {
        products = textSearchResults;
        totalResults = textSearchTotal;
      } else {
        // Fallback to regex search on title if no text search results
        const regexSearchResults = await Product.find({
          title: { $regex: new RegExp(q, 'i') }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

        // Get total count for regex search
        const regexSearchTotal = await Product.countDocuments({
          title: { $regex: new RegExp(q, 'i') }
        });

        products = regexSearchResults;
        totalResults = regexSearchTotal;
      }
    } catch (textSearchError) {
      // If text search fails, fallback to regex search
      const regexSearchResults = await Product.find({
        title: { $regex: new RegExp(q, 'i') }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

      const regexSearchTotal = await Product.countDocuments({
        title: { $regex: new RegExp(q, 'i') }
      });

      products = regexSearchResults;
      totalResults = regexSearchTotal;
    }

    const totalPages = Math.ceil(totalResults / limitNum);

    res.json({
      message: 'Smart search results retrieved successfully',
      results: products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalResults,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      query: q
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Search by title keyword (legacy endpoint)
router.get('/search/:keyword', async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const products = await Product.find({
      $text: { $search: keyword }
    }).sort({ score: { $meta: 'textScore' } });

    res.json({
      message: 'Search results retrieved successfully',
      products,
      count: products.length,
      keyword
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Filter by category
router.get('/filter/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ 
      category: { $regex: new RegExp(category, 'i') }
    }).sort({ createdAt: -1 });

    res.json({
      message: 'Filtered products retrieved successfully',
      products,
      count: products.length,
      category
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
