const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

/**
 * Product Routes
 * Public routes: GET (browsing)
 * Protected routes: POST, PUT, DELETE (requires authentication)
 */

// GET /api/products - Get all products with filters and pagination
// Query params: page, limit, search, category, minPrice, maxPrice, city
router.get('/', productController.getProducts);

// GET /api/products/search - Search products
// Query params: q (keyword), page, limit
router.get('/search', productController.searchProducts);

// GET /api/products/my-products - Get user's products (protected)
// Query params: status, page, limit
router.get('/my-products', authenticate, productController.getMyProducts);

// POST /api/products - Create product (protected)
router.post('/', authenticate, productController.createProduct);

// PUT /api/products/:id - Update product (protected, owner only)
router.put('/:id', authenticate, productController.updateProduct);

// DELETE /api/products/:id - Delete product (protected, owner only)
router.delete('/:id', authenticate, productController.deleteProduct);

// PATCH /api/products/:id/visibility - Hide/show product (protected, owner only)
router.patch('/:id/visibility', authenticate, productController.updateProductVisibility);

// GET /api/products/:id - Get product by ID
router.get('/:id', productController.getProductById);

module.exports = router;
