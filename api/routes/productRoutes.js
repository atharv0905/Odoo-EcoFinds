const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { upload, uploadMultipleImages, deleteFromCloudinary } = require('../config/cloudinary');

// Create product with image uploads
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, category, price, createdByFId, stock = 0 } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price || !createdByFId) {
      return res.status(400).json({ 
        error: 'Title, description, category, price, and createdByFId are required' 
      });
    }

    // Find user by Firebase ID to get MongoDB ObjectId
    const user = await User.findOne({ firebaseId: createdByFId });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Please ensure the Firebase ID is correct.' 
      });
    }

    // Validate that at least one image is uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'At least one product image is required' 
      });
    }

    // Upload images to Cloudinary first
    const uploadedImages = await uploadMultipleImages(req.files);

    const product = new Product({
      title,
      description,
      category,
      price: parseFloat(price),
      images: uploadedImages,
      createdByFId,
      createdBy: user._id,
      stock: parseInt(stock),
      isActive: parseInt(stock) > 0
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: 'Product created successfully with images',
      product: savedProduct,
      imageCount: uploadedImages.length
    });
  } catch (error) {
    // If product creation fails, clean up uploaded images
    if (req.uploadedImages) {
      try {
        await Promise.all(
          req.uploadedImages.map(img => deleteFromCloudinary(img.publicId))
        );
      } catch (cleanupError) {
        console.error('Error cleaning up images:', cleanupError);
      }
    }
    
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Create product without images (legacy support)
router.post('/no-images', async (req, res) => {
  try {
    const { title, description, category, price, createdByFId, stock = 0 } = req.body;

    // Find user by Firebase ID to get MongoDB ObjectId
    const user = await User.findOne({ firebaseId: createdByFId });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Please ensure the Firebase ID is correct.' 
      });
    }

    const product = new Product({
      title,
      description,
      category,
      price: parseFloat(price),
      images: [], // Empty images array
      createdByFId,
      createdBy: user._id,
      stock: parseInt(stock),
      isActive: parseInt(stock) > 0
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: 'Product created successfully without images',
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
    const { title, description, category, price, createdByFId, stock } = req.body;
    
    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Optional: Add ownership check if createdByFId is provided
    if (createdByFId && currentProduct.createdByFId !== createdByFId) {
      return res.status(403).json({ 
        error: 'You can only update your own products' 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) {
      updateData.stock = parseInt(stock);
      updateData.isActive = parseInt(stock) > 0;
    }

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

// Add images to existing product
router.post('/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const { createdBy } = req.body;
    
    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Verify ownership
    if (createdBy && currentProduct.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only add images to your own products' 
      });
    }

    // Validate that images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'At least one image is required' 
      });
    }

    // Check if adding these images would exceed the limit (max 10 images per product)
    const totalImages = currentProduct.images.length + req.files.length;
    if (totalImages > 10) {
      return res.status(400).json({ 
        error: `Cannot exceed 10 images per product. Current: ${currentProduct.images.length}, Trying to add: ${req.files.length}` 
      });
    }

    // Upload new images to Cloudinary
    const uploadedImages = await uploadMultipleImages(req.files);

    // Add new images to existing images array
    const updatedImages = [...currentProduct.images, ...uploadedImages];

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { images: updatedImages },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Images added successfully',
      product,
      newImagesCount: uploadedImages.length,
      totalImagesCount: updatedImages.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Delete specific image from product
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { createdBy } = req.body;
    const { imageId } = req.params;
    
    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Verify ownership
    if (createdBy && currentProduct.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only delete images from your own products' 
      });
    }

    // Find the image to delete
    const imageToDelete = currentProduct.images.find(img => img._id.toString() === imageId);
    if (!imageToDelete) {
      return res.status(404).json({ 
        error: 'Image not found' 
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(imageToDelete.publicId);

    // Remove image from product's images array
    const updatedImages = currentProduct.images.filter(img => img._id.toString() !== imageId);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { images: updatedImages },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Image deleted successfully',
      product,
      remainingImagesCount: updatedImages.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Replace all images for a product
router.put('/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const { createdBy } = req.body;
    
    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Verify ownership
    if (createdBy && currentProduct.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only update images for your own products' 
      });
    }

    // Validate that images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'At least one image is required' 
      });
    }

    // Upload new images to Cloudinary
    const uploadedImages = await uploadMultipleImages(req.files);

    // Delete old images from Cloudinary
    if (currentProduct.images && currentProduct.images.length > 0) {
      try {
        await Promise.all(
          currentProduct.images.map(img => deleteFromCloudinary(img.publicId))
        );
      } catch (deleteError) {
        console.error('Error deleting old images:', deleteError);
        // Continue with update even if some deletions fail
      }
    }

    // Update product with new images
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { images: uploadedImages },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product images updated successfully',
      product,
      imageCount: uploadedImages.length
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
    const { createdBy } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Verify ownership
    if (createdBy && product.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only delete your own products' 
      });
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        await Promise.all(
          product.images.map(img => deleteFromCloudinary(img.publicId))
        );
      } catch (deleteError) {
        console.error('Error deleting images from Cloudinary:', deleteError);
        // Continue with product deletion even if some image deletions fail
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Product and all associated images deleted successfully',
      product: {
        _id: product._id,
        title: product.title,
        deletedImages: product.images?.length || 0
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get user's products by Firebase ID
router.get('/user/firebase/:firebaseId', async (req, res) => {
  try {
    const products = await Product.find({ createdByFId: req.params.firebaseId })
                                  .populate('createdBy', 'name email')
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

// Get user's products by MongoDB ID
router.get('/user/:userId', async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.params.userId })
                                  .populate('createdBy', 'name email')
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

// Get all products (only active products with stock)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      stock: { $gt: 0 } 
    }).sort({ createdAt: -1 });
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

// Update product stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stock, createdBy } = req.body;
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ 
        error: 'Valid stock quantity is required' 
      });
    }

    // Get current product to verify ownership
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Verify ownership
    if (createdBy && currentProduct.createdBy !== createdBy) {
      return res.status(403).json({ 
        error: 'You can only update stock for your own products' 
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stock: stock,
        isActive: stock > 0
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product stock updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

// Get all products for management (includes inactive products)
router.get('/all/management', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      message: 'All products retrieved successfully',
      products,
      count: products.length
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

module.exports = router;
