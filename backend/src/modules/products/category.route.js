const express = require('express');
const router = express.Router();
const Category = require('./category.model');

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description icon')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get category by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
