const cron = require('node-cron');
const Order = require('../modules/orders/order.model');
const escrowService = require('../modules/payments/escrow.service');
const logger = require('../common/utils/logger.util');
const mongoose = require('mongoose');

/**
 * Auto-Release Service
 * Handles automatic release of funds for orders shipped > 5 days ago
 */

/**
 * Find orders eligible for auto-release
 * Orders that have been shipped for more than 5 days without dispute
 */
async function findEligibleOrders() {
  try {
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Database not connected, skipping auto-release');
      return [];
    }
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    // Find orders that are shipped and older than 5 days
    const orders = await Order.find({
      status: 'shipped',
      shippedAt: { $lte: fiveDaysAgo }
    }).populate([
      { path: 'productId', select: 'title' },
      { path: 'buyerId', select: 'fullName email' },
      { path: 'sellerId', select: 'fullName email' }
    ]);
    
    // Filter out orders with disputes (if dispute model exists)
    const eligibleOrders = [];
    
    for (const order of orders) {
      try {
        // Check if dispute model exists and if there are any disputes
        const Dispute = require('../modules/reports/dispute.model');
        const dispute = await Dispute.findOne({ orderId: order._id });
        
        if (!dispute) {
          eligibleOrders.push(order);
        } else {
          logger.info(`Order ${order._id} has dispute, skipping auto-release`);
        }
      } catch (error) {
        // If dispute model doesn't exist, assume no disputes
        eligibleOrders.push(order);
      }
    }
    
    return eligibleOrders;
  } catch (error) {
    logger.error('Error finding eligible orders for auto-release:', error);
    throw error;
  }
}

/**
 * Auto-release funds for eligible orders
 */
async function autoReleaseOrders() {
  try {
    logger.info('Starting auto-release job...');
    
    const eligibleOrders = await findEligibleOrders();
    
    if (eligibleOrders.length === 0) {
      logger.info('No orders eligible for auto-release');
      return { processed: 0, successful: 0, failed: 0 };
    }
    
    logger.info(`Found ${eligibleOrders.length} orders eligible for auto-release`);
    
    let successful = 0;
    let failed = 0;
    
    for (const order of eligibleOrders) {
      try {
        // Release funds from escrow
        await escrowService.releaseFunds(
          order._id, 
          'Auto-release after 5 days', 
          true // isAuto flag
        );
        
        // Update order status to completed
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
        
        successful++;
        
        logger.info(`Auto-released order ${order._id} for product "${order.productId.title}"`);
        logger.info(`  Buyer: ${order.buyerId.fullName} (${order.buyerId.email})`);
        logger.info(`  Seller: ${order.sellerId.fullName} (${order.sellerId.email})`);
        logger.info(`  Amount: ${order.agreedAmount.toLocaleString('vi-VN')} VND`);
        
      } catch (error) {
        failed++;
        logger.error(`Failed to auto-release order ${order._id}:`, error);
      }
    }
    
    const result = {
      processed: eligibleOrders.length,
      successful,
      failed
    };
    
    logger.info(`Auto-release job completed: ${successful} successful, ${failed} failed`);
    
    return result;
  } catch (error) {
    logger.error('Auto-release job failed:', error);
    throw error;
  }
}

/**
 * Start the auto-release cron job
 * Runs daily at 2:00 AM
 */
function startAutoReleaseCronJob() {
  // Run daily at 2:00 AM
  const cronExpression = '0 2 * * *';
  
  cron.schedule(cronExpression, async () => {
    try {
      await autoReleaseOrders();
    } catch (error) {
      logger.error('Auto-release cron job error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  logger.info('Auto-release cron job started (daily at 2:00 AM Vietnam time)');
}

/**
 * Manual trigger for testing
 */
async function triggerManualAutoRelease() {
  logger.info('Manual auto-release triggered');
  return await autoReleaseOrders();
}

module.exports = {
  startAutoReleaseCronJob,
  triggerManualAutoRelease,
  findEligibleOrders,
  autoReleaseOrders
};