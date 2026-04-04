const { SePayPgClient } = require('sepay-pg-node');
const walletService = require('./wallet.service');
const Transaction = require('./transaction.model');

// SePay Payment Gateway Service
// Uses the official sepay-pg-node SDK for correct signature generation

function getSePayClient() {
  const env = process.env.SEPAY_ENV || 'sandbox';
  const merchantId = process.env.SEPAY_MERCHANT_ID;
  const secretKey = process.env.SEPAY_SECRET_KEY;
  if (!merchantId || !secretKey) throw new Error('Missing SEPAY_MERCHANT_ID or SEPAY_SECRET_KEY in .env');
  return new SePayPgClient({ env, merchant_id: merchantId, secret_key: secretKey });
}

async function createSePayPayment(userId, amount, orderInfo) {
  orderInfo = orderInfo || 'Nap tien vao vi';
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('So tien khong hop le');
  if (!Number.isInteger(normalizedAmount)) throw new Error('So tien nap phai la so nguyen VND');
  if (normalizedAmount < 10000) throw new Error('So tien nap toi thieu la 10,000 VND');
  if (normalizedAmount > 500000000) throw new Error('So tien nap toi da la 500,000,000 VND');
  const transaction = await walletService.createTransaction(userId, {
    type: 'deposit', amount: normalizedAmount, status: 'pending',
    description: orderInfo, paymentMethod: 'sepay',
  });
  const client = getSePayClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inv = transaction._id.toString();
  const checkoutUrl = client.checkout.initCheckoutUrl();
  const fields = client.checkout.initOneTimePaymentFields({
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: inv,
    order_amount: normalizedAmount,
    currency: 'VND',
    order_description: orderInfo,
    customer_id: userId.toString(),
    success_url: frontendUrl + '/wallet/topup-success?transactionId=' + inv,
    error_url: frontendUrl + '/wallet/topup-result?success=false&message=Loi',
    cancel_url: frontendUrl + '/wallet/topup-result?success=false&message=Huy',
  });
  return { checkoutUrl, fields, transactionId: inv };
}

async function createSePayOrderPayment(userId, orderId, amount, orderInfo) {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('So tien khong hop le');
  const transaction = await walletService.createTransaction(userId, {
    type: 'payment', orderId: orderId, amount: normalizedAmount,
    status: 'pending', description: orderInfo, paymentMethod: 'sepay',
  });
  const client = getSePayClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inv = transaction._id.toString();
  const checkoutUrl = client.checkout.initCheckoutUrl();
  const fields = client.checkout.initOneTimePaymentFields({
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: inv,
    order_amount: normalizedAmount,
    currency: 'VND',
    order_description: orderInfo || 'Thanh toan don hang',
    customer_id: userId.toString(),
    success_url: frontendUrl + '/orders',
    error_url: frontendUrl + '/orders/sepay-result?success=false&message=Loi',
    cancel_url: frontendUrl + '/orders/sepay-result?success=false&message=Huy',
  });
  return { checkoutUrl, fields, transactionId: inv };
}

async function handleSePayIPN(body, receivedSecretKey) {
  const expectedSecretKey = process.env.SEPAY_SECRET_KEY;
  
  const trimmedReceived = receivedSecretKey ? receivedSecretKey.trim() : '';
  const trimmedExpected = expectedSecretKey ? expectedSecretKey.trim() : '';

  if (!trimmedReceived || trimmedReceived !== trimmedExpected) {
    console.warn('[SEPay IPN] Unauthorized: Key mismatch.');
    console.warn('[SEPay IPN] Expected (first 5):', trimmedExpected.substring(0, 5));
    console.warn('[SEPay IPN] Received (first 5):', trimmedReceived.substring(0, 5));
    return { success: false, message: 'Unauthorized' };
  }

  const notification_type = body && body.notification_type;
  const order = body && body.order;
  const txInfo = body && body.transaction;
  
  console.log('[SEPay IPN] Payload:', JSON.stringify(body));
  if (notification_type !== 'ORDER_PAID') return { success: true, message: 'Event ignored' };
  const inv = order && order.order_invoice_number;
  if (!inv) return { success: false, message: 'Missing order_invoice_number' };
  const pendingTx = await Transaction.findById(inv);
  if (!pendingTx) return { success: false, message: 'Transaction not found' };
  if (pendingTx.status === 'completed') return { success: true, message: 'Already processed' };
  const paidAmount = Number(order && order.order_amount);
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) return { success: false, message: 'Invalid amount' };
  if (paidAmount !== Number(pendingTx.amount)) {
    pendingTx.status = 'failed'; pendingTx.failedAt = new Date();
    pendingTx.failureReason = 'Amount mismatch'; await pendingTx.save();
    return { success: false, message: 'Amount mismatch' };
  }
  try {
    if (pendingTx.type === 'deposit') {
      await walletService.incrementBalance(pendingTx.userId, paidAmount, 'deposit',
        'Nap tien qua SePay - ' + ((txInfo && txInfo.transaction_id) || inv),
        { transactionId: pendingTx._id });
    } else if (pendingTx.type === 'payment' && pendingTx.orderId) {
      await walletService.incrementBalance(pendingTx.userId, paidAmount, 'deposit',
        'Nap tu dong cho don hang - ' + ((txInfo && txInfo.transaction_id) || inv));
      const orderService = require('../orders/order.service');
      await orderService.payOrder(pendingTx.orderId, pendingTx.userId);
    }
    pendingTx.status = 'completed'; pendingTx.completedAt = new Date(); await pendingTx.save();
    console.log('[SEPay IPN] Processed', pendingTx.type, paidAmount);
    return { success: true, message: 'Payment processed' };
  } catch (err) {
    console.error('[SEPay IPN] Error:', err.message);
    pendingTx.status = 'failed'; pendingTx.failedAt = new Date(); pendingTx.failureReason = err.message;
    await pendingTx.save();
    return { success: false, message: 'Error processing payment' };
  }
}

async function handleSePayOrderReturn(transactionId) {
  if (!transactionId) return { success: false, message: 'Khong co ma giao dich' };
  const tx = await Transaction.findById(transactionId);
  if (!tx) return { success: false, message: 'Khong tim thay giao dich' };
  if (tx.status === 'completed') return { success: true, message: 'Thanh toan don hang thanh cong', amount: tx.amount, orderId: tx.orderId, transactionId: tx._id, status: 'completed' };
  return { success: tx.status !== 'failed', message: tx.status === 'pending' ? 'Dang xu ly.' : 'That bai', amount: tx.amount, orderId: tx.orderId, transactionId: tx._id, status: tx.status };
}

async function handleSePayReturn(transactionId) {
  if (!transactionId) return { success: false, message: 'Khong co ma giao dich' };
  const tx = await Transaction.findById(transactionId);
  if (!tx) return { success: false, message: 'Khong tim thay giao dich' };
  if (tx.status === 'completed') return { success: true, message: 'Nap tien thanh cong', amount: tx.amount, transactionId: tx._id, status: 'completed' };
  return { success: tx.status !== 'failed', message: tx.status === 'pending' ? 'Dang xu ly.' : 'That bai', amount: tx.amount, transactionId: tx._id, status: tx.status };
}

module.exports = { createSePayPayment, createSePayOrderPayment, handleSePayIPN, handleSePayReturn, handleSePayOrderReturn };
