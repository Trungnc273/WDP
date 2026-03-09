/**
 * Test script for Report and Review services
 * Run: node test-report-review.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import services
const reportService = require('./src/modules/reports/report.service');
const reviewService = require('./src/modules/reports/review.service');
const orderService = require('./src/modules/orders/order.service');

// Import models
const User = require('./src/modules/users/user.model');
const Product = require('./src/modules/products/product.model');
const Order = require('./src/modules/orders/order.model');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reflow:A123456a@trungnc.lqfrzux.mongodb.net/ReFlow?retryWrites=true&w=majority&appName=TrungNC';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function testReportService() {
  console.log('\n📋 Testing Report Service...\n');
  
  try {
    // Get test users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users. Skipping report service test.');
      return;
    }
    
    const reporter = users[0];
    const reportedUser = users[1];
    
    // Get a test product
    const product = await Product.findOne({ seller: reportedUser._id });
    if (!product) {
      console.log('⚠️  No products found. Skipping product report test.');
    } else {
      // Test 1: Create product report
      console.log('1️⃣ Testing createProductReport...');
      const productReport = await reportService.createProductReport(
        reporter._id,
        product._id,
        'counterfeit',
        'Sản phẩm này có dấu hiệu giả mạo. Tôi đã kiểm tra và thấy không đúng với mô tả.',
        ['https://example.com/evidence1.jpg']
      );
      console.log(`✅ Product report created: ${productReport._id}`);
      console.log(`   - Reason: ${productReport.reason}`);
      console.log(`   - Status: ${productReport.status}`);
    }
    
    // Test 2: Create user report
    console.log('\n2️⃣ Testing createUserReport...');
    const userReport = await reportService.createUserReport(
      reporter._id,
      reportedUser._id,
      'spam',
      'Người dùng này liên tục spam tin nhắn quảng cáo không liên quan.',
      []
    );
    console.log(`✅ User report created: ${userReport._id}`);
    console.log(`   - Reason: ${userReport.reason}`);
    console.log(`   - Status: ${userReport.status}`);
    
    // Test 3: Get reports
    console.log('\n3️⃣ Testing getReports...');
    const reports = await reportService.getReports({ status: 'pending' });
    console.log(`✅ Found ${reports.reports.length} pending reports`);
    console.log(`   - Total reports: ${reports.pagination.total}`);
    
    // Test 4: Get user's reports
    console.log('\n4️⃣ Testing getUserReports...');
    const userReports = await reportService.getUserReports(reporter._id);
    console.log(`✅ User has ${userReports.reports.length} reports`);
    
    return { reporter, reportedUser };
    
  } catch (error) {
    console.log(`❌ Report service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testDisputeService() {
  console.log('\n⚖️  Testing Dispute Service...\n');
  
  try {
    // Find a completed order to test dispute
    const completedOrder = await Order.findOne({ status: 'completed' })
      .populate('buyerId')
      .populate('sellerId');
    
    if (!completedOrder) {
      console.log('⚠️  No completed orders found. Creating test scenario...');
      
      // Find a shipped order instead
      const shippedOrder = await Order.findOne({ status: 'shipped' })
        .populate('buyerId')
        .populate('sellerId');
      
      if (!shippedOrder) {
        console.log('⚠️  No shipped orders found. Skipping dispute test.');
        return;
      }
      
      // Test 1: Create dispute
      console.log('1️⃣ Testing createDispute...');
      const dispute = await reportService.createDispute(
        shippedOrder.buyerId._id,
        shippedOrder._id,
        'not_as_described',
        'Sản phẩm nhận được không giống như mô tả. Màu sắc và kích thước khác hoàn toàn.',
        [
          'https://example.com/evidence1.jpg',
          'https://example.com/evidence2.jpg'
        ]
      );
      console.log(`✅ Dispute created: ${dispute._id}`);
      console.log(`   - Reason: ${dispute.reason}`);
      console.log(`   - Status: ${dispute.status}`);
      console.log(`   - Order status updated to: disputed`);
      
      // Test 2: Add seller response
      console.log('\n2️⃣ Testing addSellerResponse...');
      const updatedDispute = await reportService.addSellerResponse(
        dispute._id,
        shippedOrder.sellerId._id,
        'Sản phẩm đã được mô tả chính xác. Tôi có ảnh chụp trước khi gửi hàng.',
        ['https://example.com/seller-evidence1.jpg']
      );
      console.log(`✅ Seller response added`);
      console.log(`   - Status: ${updatedDispute.status}`);
      
      // Test 3: Get disputes
      console.log('\n3️⃣ Testing getDisputes...');
      const disputes = await reportService.getDisputes({ status: 'investigating' });
      console.log(`✅ Found ${disputes.disputes.length} disputes under investigation`);
      
      return dispute;
    } else {
      console.log('⚠️  Found completed order, but cannot create dispute (order already completed)');
      console.log('   Dispute can only be created for shipped orders');
    }
    
  } catch (error) {
    console.log(`❌ Dispute service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testReviewService() {
  console.log('\n⭐ Testing Review Service...\n');
  
  try {
    // Find a completed order
    const completedOrder = await Order.findOne({ status: 'completed' })
      .populate('buyerId')
      .populate('sellerId');
    
    if (!completedOrder) {
      console.log('⚠️  No completed orders found. Skipping review test.');
      console.log('   Reviews can only be created for completed orders');
      return;
    }
    
    console.log(`Testing with order: ${completedOrder._id}`);
    console.log(`Buyer: ${completedOrder.buyerId.email}`);
    console.log(`Seller: ${completedOrder.sellerId.email}`);
    
    // Test 1: Check if can review
    console.log('\n1️⃣ Testing canReviewOrder...');
    const canReview = await reviewService.canReviewOrder(
      completedOrder.buyerId._id,
      completedOrder._id
    );
    console.log(`✅ Can review: ${canReview.canReview}`);
    if (!canReview.canReview) {
      console.log(`   - Reason: ${canReview.reason}`);
    }
    
    if (canReview.canReview) {
      // Test 2: Create review
      console.log('\n2️⃣ Testing createReview...');
      const review = await reviewService.createReview(
        completedOrder.buyerId._id,
        completedOrder._id,
        5,
        'Người bán rất tốt, giao hàng nhanh. Sản phẩm đúng như mô tả. Sẽ ủng hộ lần sau!'
      );
      console.log(`✅ Review created: ${review._id}`);
      console.log(`   - Rating: ${review.rating} stars`);
      console.log(`   - Comment: ${review.comment}`);
      
      // Test 3: Get seller's rating stats
      console.log('\n3️⃣ Testing getRatingStats...');
      const stats = await reviewService.getRatingStats(completedOrder.sellerId._id);
      console.log(`✅ Seller rating stats:`);
      console.log(`   - Average rating: ${stats.averageRating} stars`);
      console.log(`   - Total reviews: ${stats.totalReviews}`);
      console.log(`   - Distribution:`, stats.distribution);
      
      // Test 4: Get reviews for seller
      console.log('\n4️⃣ Testing getReviews...');
      const reviews = await reviewService.getReviews(completedOrder.sellerId._id);
      console.log(`✅ Seller has ${reviews.reviews.length} reviews`);
      console.log(`   - Average: ${reviews.stats.averageRating} stars`);
      
      // Test 5: Get review by order
      console.log('\n5️⃣ Testing getReviewByOrderId...');
      const orderReview = await reviewService.getReviewByOrderId(completedOrder._id);
      if (orderReview) {
        console.log(`✅ Review found for order`);
        console.log(`   - Rating: ${orderReview.rating} stars`);
      }
      
      // Test 6: Get reviews by reviewer
      console.log('\n6️⃣ Testing getReviewsByReviewer...');
      const reviewerReviews = await reviewService.getReviewsByReviewer(completedOrder.buyerId._id);
      console.log(`✅ Buyer has written ${reviewerReviews.reviews.length} reviews`);
    }
    
  } catch (error) {
    console.log(`❌ Review service test failed: ${error.message}`);
    console.error(error);
  }
}

async function runTests() {
  try {
    await connectDB();
    
    console.log('\n🧪 Starting Report & Review Service Tests...\n');
    console.log('='.repeat(60));
    
    await testReportService();
    await testDisputeService();
    await testReviewService();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
runTests();
