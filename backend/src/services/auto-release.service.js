const cron = require('node-cron');
const Order = require('../modules/orders/order.model');
const Product = require('../modules/products/product.model');
const escrowService = require('../modules/payments/escrow.service');
const logger = require('../common/utils/logger.util');
const mongoose = require('mongoose');

/**
 * Auto-Release Service
 * Handles automatic release of funds for orders shipped > 10 days ago
 */

/**
 * Tim cac don du dieu kien tu dong giai ngan
 * Don da giao hon 10 ngay va khong co tranh chap
 */
async function findEligibleOrders() {
  try {
    // Dam bao da ket noi den co so du lieu
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Database not connected, skipping auto-release');
      return [];
    }
    
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    // Tim don da giao hang va qua 10 ngay
    const orders = await Order.find({
      status: 'shipped',
      shippedAt: { $lte: tenDaysAgo }
    }).populate([
      { path: 'productId', select: 'title' },
      { path: 'buyerId', select: 'fullName email' },
      { path: 'sellerId', select: 'fullName email' }
    ]);
    
    // Loai bo don co tranh chap (neu ton tai dispute model)
    const eligibleOrders = [];
    
    for (const order of orders) {
      try {
        // Kiem tra dispute model co ton tai va co tranh chap hay khong
        const Dispute = require('../modules/reports/dispute.model');
        const dispute = await Dispute.findOne({ orderId: order._id });
        
        if (!dispute) {
          eligibleOrders.push(order);
        } else {
          logger.info(`Order ${order._id} has dispute, skipping auto-release`);
        }
      } catch (error) {
        // Neu khong co dispute model thi xem nhu khong co tranh chap
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
 * Tu dong giai ngan tien cho cac don du dieu kien
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
        // Giai ngan tien dang giu trong escrow
        await escrowService.releaseFunds(
          order._id, 
          'Auto-release after 10 days', 
          true // Co tu dong giai ngan
        );
        
        // Cap nhat trang thai don sang completed
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        if (order.productId?._id) {
          await Product.findByIdAndUpdate(order.productId._id, { status: 'sold' });
        }
        
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
 * Khoi dong cron job tu dong giai ngan
 * Chay hang ngay luc 2:00 sang
 */
function startAutoReleaseCronJob() {
  // Chay hang ngay luc 2:00 sang
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