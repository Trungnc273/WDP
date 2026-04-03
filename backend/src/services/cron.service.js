const cron = require('node-cron');
const Order = require('../modules/orders/order.model');
const escrowService = require('../modules/payments/escrow.service');

/**
 * Cron Service
 * Chạy các tác vụ định kỳ của hệ thống
 */

/**
 * Cron 1: Auto-cancel đơn chưa thanh toán sau 10 phút
 * Chạy mỗi phút
 */
function startPaymentTimeoutCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const expiredOrders = await Order.find({
        status: 'awaiting_payment',
        paymentDeadline: { $lt: new Date() }
      });

      if (expiredOrders.length === 0) return;

      console.log(`[Cron] Auto-cancel: found ${expiredOrders.length} expired payment order(s)`);

      for (const order of expiredOrders) {
        try {
          order.status = 'cancelled';
          order.cancelledAt = new Date();
          order.cancellationReason = 'Hết thời gian thanh toán (10 phút)';
          await order.save();

          // Unlock sản phẩm
          const Product = require('../modules/products/product.model');
          await Product.findByIdAndUpdate(order.productId, {
            $unset: { activeOrderId: 1 },
            status: 'active'
          });

          console.log(`[Cron] Auto-cancelled order ${order._id} (payment timeout)`);
        } catch (err) {
          console.error(`[Cron] Failed to cancel order ${order._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Cron] Payment timeout job error:', err.message);
    }
  });

  console.log('✅ Cron: payment timeout job started (every 1 min)');
}

/**
 * Cron 2: Auto-complete đơn đã DELIVERED sau 5 ngày (không có khiếu nại)
 * Chạy mỗi giờ
 */
function startAutoCompleteDeliveredCron() {
  cron.schedule('0 * * * *', async () => {
    try {
      const eligibleOrders = await escrowService.getOrdersEligibleForAutoRelease();

      if (eligibleOrders.length === 0) return;

      console.log(`[Cron] Auto-complete: found ${eligibleOrders.length} eligible order(s)`);

      for (const order of eligibleOrders) {
        try {
          await escrowService.releaseFunds(
            order._id,
            'Tự động hoàn thành sau 5 ngày giao hàng',
            true // isAutoRelease
          );
          console.log(`[Cron] Auto-completed order ${order._id} (5 days after delivery)`);
        } catch (err) {
          console.error(`[Cron] Failed to auto-complete order ${order._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Cron] Auto-complete delivered job error:', err.message);
    }
  });

  console.log('✅ Cron: auto-complete delivered job started (every 1 hour)');
}

/**
 * Cron 3: Auto-refund (cancel) after 24h of payment if not shipped
 * Chạy mỗi giờ
 */
function startLateShippingRefundCron() {
  cron.schedule('0 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const expiredOrders = await Order.find({
        status: 'paid',
        paidAt: { $lte: twentyFourHoursAgo }
      });

      if (expiredOrders.length === 0) return;

      console.log(`[Cron] Auto-refund: found ${expiredOrders.length} order(s) not shipped after 24h`);

      for (const order of expiredOrders) {
        try {
          await escrowService.refundFunds(
            order._id,
            'Hủy tự động: Người bán không giao hàng trong vòng 24h'
          );
          console.log(`[Cron] Auto-refunded order ${order._id} (seller late shipping)`);
        } catch (err) {
          console.error(`[Cron] Failed to auto-refund order ${order._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Cron] Late shipping refund job error:', err.message);
    }
  });

  console.log('✅ Cron: auto-refund late shipping job started (every 1 hour)');
}

/**
 * Khởi động tất cả cron jobs
 */
function startAllCronJobs() {
  startPaymentTimeoutCron();
  startAutoCompleteDeliveredCron();
  startLateShippingRefundCron();
}

module.exports = { startAllCronJobs };
