const express = require('express');
const router = express.Router();
const favoriteController = require('./favorite.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// POST /api/favorites - Add to favorites
router.post('/', favoriteController.addFavorite);

// GET /api/favorites - Get user's favorites
router.get('/', favoriteController.getFavorites);

// GET /api/favorites/check/:productId - Check if product is favorited
router.get('/check/:productId', favoriteController.checkFavorite);

// DELETE /api/favorites/:productId - Remove from favorites
router.delete('/:productId', favoriteController.removeFavorite);

module.exports = router;
