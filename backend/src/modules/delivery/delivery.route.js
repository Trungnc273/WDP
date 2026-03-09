const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');

// Create delivery record
router.post('/create', authenticate, deliveryController.createDelivery);

// Get delivery by order ID
router.get('/:orderId', authenticate, deliveryController.getDelivery);

// Update delivery status
router.put('/:orderId/status', authenticate, deliveryController.updateDeliveryStatus);

// Get tracking history
router.get('/:orderId/tracking', authenticate, deliveryController.getTrackingHistory);

// Update delivery information
router.put('/:orderId', authenticate, deliveryController.updateDelivery);

// Get all deliveries (admin/management)
router.get('/all', authenticate, deliveryController.getAllDeliveries);

module.exports = router;