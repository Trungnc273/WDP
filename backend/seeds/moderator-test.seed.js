/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/modules/users/user.model');
const Wallet = require('../src/modules/payments/wallet.model');
const Transaction = require('../src/modules/payments/transaction.model');
const Order = require('../src/modules/orders/order.model');
const Review = require('../src/modules/reports/review.model');
const Dispute = require('../src/modules/reports/dispute.model');
const Report = require('../src/modules/reports/report.model');

function pickReason(index) {
  const reasons = ['not_as_described', 'damaged', 'not_received', 'other'];
  return reasons[index % reasons.length];
}

async function ensureWallet(userId) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 300000,
      totalDeposited: 300000,
      totalWithdrawn: 0,
      totalSpent: 0,
      totalEarned: 0,
      status: 'active'
    });
  }
  return wallet;
}

async function seedWithdrawals(users) {
  let created = 0;

  for (let i = 0; i < Math.min(users.length, 3); i += 1) {
    const user = users[i];
    const wallet = await ensureWallet(user._id);

    const exists = await Transaction.findOne({
      userId: user._id,
      type: 'withdrawal',
      'metadata.seedTag': 'moderator-test',
      status: 'pending'
    });

    if (exists) continue;

    const amount = 50000 + i * 20000;
    const balanceBefore = wallet.balance;
    const balanceAfter = Math.max(0, wallet.balance - amount);

    await Transaction.create({
      walletId: wallet._id,
      userId: user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Yeu cau rut tien test cho moderator #${i + 1}`,
      balanceBefore,
      balanceAfter,
      metadata: {
        seedTag: 'moderator-test',
        bankName: 'Vietcombank',
        bankAccount: `0123${i}56789`,
        bankOwner: user.fullName
      }
    });

    created += 1;
  }

  return created;
}

async function seedReviews() {
  const completedOrders = await Order.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  let created = 0;

  for (let i = 0; i < completedOrders.length && created < 3; i += 1) {
    const order = completedOrders[i];
    const exists = await Review.findOne({ orderId: order._id });
    if (exists) continue;

    await Review.create({
      orderId: order._id,
      reviewerId: order.buyerId,
      reviewedUserId: order.sellerId,
      productId: order.productId,
      rating: 3 + (created % 3),
      comment: `Danh gia test #${created + 1} cho moderator`,
      status: created % 2 === 0 ? 'reported' : 'active'
    });

    created += 1;
  }

  return created;
}

async function seedDisputes() {
  const disputeCandidates = await Order.find({
    status: { $in: ['paid', 'shipped', 'completed', 'disputed'] }
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  let created = 0;

  for (let i = 0; i < disputeCandidates.length && created < 3; i += 1) {
    const order = disputeCandidates[i];
    const exists = await Dispute.findOne({ orderId: order._id });
    if (exists) continue;

    await Dispute.create({
      orderId: order._id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      productId: order.productId,
      reason: pickReason(created),
      description: `Noi dung tranh chap test #${created + 1}`,
      evidenceImages: [
        'https://via.placeholder.com/640x420.png?text=Dispute+Evidence+1',
        'https://via.placeholder.com/640x420.png?text=Dispute+Evidence+2'
      ],
      status: created === 0 ? 'pending' : created === 1 ? 'investigating' : 'resolved',
      moderatorNotes: created === 2 ? 'Tranh chap da duoc xu ly trong du lieu test' : ''
    });

    created += 1;
  }

  return created;
}

async function seedReports(users) {
  const reportsCount = await Report.countDocuments({ 'evidenceImages.0': { $exists: true } });
  if (reportsCount >= 2 || users.length < 2) return 0;

  const targetUser = users[1];
  const reporter = users[0];

  await Report.create({
    reporterId: reporter._id,
    reportedUserId: targetUser._id,
    reportType: 'user',
    reason: 'spam',
    description: 'Bao cao test de kiem tra hien thi anh va phan hoi nguoi dung.',
    evidenceImages: [
      'https://via.placeholder.com/640x420.png?text=Report+Evidence+1',
      'https://via.placeholder.com/640x420.png?text=Report+Evidence+2'
    ],
    status: 'pending'
  });

  return 1;
}

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI trong file .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Da ket noi MongoDB');

  const users = await User.find({ role: { $in: ['user', 'moderator', 'admin'] } })
    .sort({ createdAt: -1 })
    .limit(10);

  if (!users.length) {
    throw new Error('Khong tim thay user nao de seed du lieu test');
  }

  const [withdrawals, reviews, disputes, reports] = await Promise.all([
    seedWithdrawals(users),
    seedReviews(),
    seedDisputes(),
    seedReports(users)
  ]);

  console.log('Seed moderator test data thanh cong:');
  console.log(`- Withdrawals moi: ${withdrawals}`);
  console.log(`- Reviews moi: ${reviews}`);
  console.log(`- Disputes moi: ${disputes}`);
  console.log(`- Reports moi: ${reports}`);

  await mongoose.disconnect();
  console.log('Da dong ket noi MongoDB');
}

run().catch(async (error) => {
  console.error('Seed that bai:', error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // ignore
  }
  process.exit(1);
});
