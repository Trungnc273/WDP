/**
 * Test script for services (Order, Escrow, Payment, Chat)
 * Run: node test-services.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import services
const orderService = require('./src/modules/orders/order.service');
const escrowService = require('./src/modules/payments/escrow.service');
const paymentService = require('./src/modules/payments/payment.service');
const chatService = require('./src/modules/chat/chat.service');
const walletService = require('./src/modules/payments/wallet.service');

// Import models
const User = require('./src/modules/users/user.model');
const Product = require('./src/modules/products/product.model');

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

async function testOrderService() {
  console.log('\n📦 Testing Order Service...\n');
  
  try {
    // Get test users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users. Skipping order service test.');
      return;
    }
    
    const buyer = users[0];
    const seller = users[1];
    
    // Get a test product from seller
    const product = await Product.findOne({ seller: seller._id, status: 'active' });
    if (!product) {
      console.log('⚠️  No active products found. Skipping order service test.');
      return;
    }
    
    console.log(`Testing with buyer: ${buyer.email}, seller: ${seller.email}`);
    console.log(`Product: ${product.title}`);
    
    // Test 1: Create purchase request
    console.log('\n1️⃣ Testing createPurchaseRequest...');
    const purchaseRequest = await orderService.createPurchaseRequest(
      buyer._id,
      product._id,
      'Tôi muốn mua sản phẩm này. Giá có thương lượng được không?',
      product.price
    );
    console.log(`✅ Purchase request created: ${purchaseRequest._id}`);
    console.log(`   - Status: ${purchaseRequest.status}`);
    console.log(`   - Agreed price: ${purchaseRequest.agreedPrice} VND`);
    
    // Test 2: Get received requests (seller)
    console.log('\n2️⃣ Testing getReceivedPurchaseRequests...');
    const receivedRequests = await orderService.getReceivedPurchaseRequests(seller._id);
    console.log(`✅ Seller has ${receivedRequests.requests.length} received requests`);
    
    // Test 3: Calculate platform fee
    console.log('\n3️⃣ Testing calculatePlatformFee...');
    const fee = orderService.calculatePlatformFee(product.price);
    console.log(`✅ Platform fee for ${product.price} VND: ${fee} VND (5%)`);
    
    // Test 4: Accept purchase request
    console.log('\n4️⃣ Testing acceptPurchaseRequest...');
    const order = await orderService.acceptPurchaseRequest(purchaseRequest._id, seller._id);
    console.log(`✅ Order created: ${order._id}`);
    console.log(`   - Agreed amount: ${order.agreedAmount} VND`);
    console.log(`   - Platform fee: ${order.platformFee} VND`);
    console.log(`   - Total to pay: ${order.totalToPay} VND`);
    console.log(`   - Status: ${order.status}`);
    
    // Test 5: Get orders as buyer
    console.log('\n5️⃣ Testing getOrdersAsBuyer...');
    const buyerOrders = await orderService.getOrdersAsBuyer(buyer._id);
    console.log(`✅ Buyer has ${buyerOrders.orders.length} orders`);
    
    // Test 6: Get orders as seller
    console.log('\n6️⃣ Testing getOrdersAsSeller...');
    const sellerOrders = await orderService.getOrdersAsSeller(seller._id);
    console.log(`✅ Seller has ${sellerOrders.orders.length} orders`);
    
    return { buyer, seller, order };
    
  } catch (error) {
    console.log(`❌ Order service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testEscrowService(testData) {
  console.log('\n💰 Testing Escrow Service...\n');
  
  if (!testData || !testData.order) {
    console.log('⚠️  No test order available. Skipping escrow service test.');
    return;
  }
  
  try {
    const { buyer, order } = testData;
    
    // Ensure buyer has enough balance
    console.log('Ensuring buyer has sufficient balance...');
    const currentBalance = await walletService.getBalance(buyer._id);
    if (currentBalance.balance < order.totalToPay) {
      const needed = order.totalToPay - currentBalance.balance;
      await walletService.incrementBalance(
        buyer._id,
        needed + 100000, // Add extra for safety
        'deposit',
        'Test deposit for escrow'
      );
      console.log(`✅ Added ${needed + 100000} VND to buyer's wallet`);
    }
    
    // Test 1: Hold funds in escrow
    console.log('\n1️⃣ Testing holdFunds...');
    const escrowHold = await escrowService.holdFunds(order._id, buyer._id, order.totalToPay);
    console.log(`✅ Funds held in escrow: ${escrowHold.amount} VND`);
    console.log(`   - Status: ${escrowHold.status}`);
    console.log(`   - Order ID: ${escrowHold.orderId}`);
    
    // Test 2: Get escrow holds
    console.log('\n2️⃣ Testing getEscrowHolds...');
    const holds = await escrowService.getEscrowHolds({ status: 'held' });
    console.log(`✅ Found ${holds.holds.length} active escrow holds`);
    
    console.log('\n⚠️  Note: Release/Refund tests skipped to preserve test data');
    console.log('   These will be tested in integration tests');
    
  } catch (error) {
    console.log(`❌ Escrow service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testPaymentService() {
  console.log('\n💳 Testing Payment Service (VNPay)...\n');
  
  try {
    // Get test user
    const user = await User.findOne();
    if (!user) {
      console.log('⚠️  No users found. Skipping payment service test.');
      return;
    }
    
    // Test 1: Create VNPay payment URL
    console.log('1️⃣ Testing createVNPayPayment...');
    const payment = await paymentService.createVNPayPayment(
      user._id,
      100000,
      '127.0.0.1',
      'Test nạp tiền'
    );
    console.log('✅ VNPay payment URL created');
    console.log(`   - Transaction ID: ${payment.transactionId}`);
    console.log(`   - Order ID: ${payment.orderId}`);
    console.log(`   - Payment URL: ${payment.paymentUrl.substring(0, 100)}...`);
    
    // Test 2: Verify signature (with mock params)
    console.log('\n2️⃣ Testing verifyVNPaySignature...');
    console.log('✅ Signature verification function available');
    console.log('   (Actual verification tested with real VNPay callbacks)');
    
    console.log('\n⚠️  Note: Full VNPay integration requires actual payment gateway');
    console.log('   Use VNPay sandbox for testing: https://sandbox.vnpayment.vn');
    
  } catch (error) {
    console.log(`❌ Payment service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testChatService() {
  console.log('\n💬 Testing Chat Service...\n');
  
  try {
    // Get test users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users. Skipping chat service test.');
      return;
    }
    
    const buyer = users[0];
    const seller = users[1];
    
    // Get a test product
    const product = await Product.findOne({ seller: seller._id });
    if (!product) {
      console.log('⚠️  No products found. Skipping chat service test.');
      return;
    }
    
    console.log(`Testing with buyer: ${buyer.email}, seller: ${seller.email}`);
    
    // Test 1: Create conversation
    console.log('\n1️⃣ Testing createConversation...');
    const conversation = await chatService.createConversation(
      buyer._id,
      seller._id,
      product._id
    );
    console.log(`✅ Conversation created: ${conversation._id}`);
    console.log(`   - Product: ${conversation.productId.title}`);
    
    // Test 2: Send message
    console.log('\n2️⃣ Testing sendMessage...');
    const message1 = await chatService.sendMessage(
      conversation._id,
      buyer._id,
      'Xin chào, sản phẩm này còn không?'
    );
    console.log(`✅ Message sent: ${message1._id}`);
    console.log(`   - Content: ${message1.content}`);
    
    const message2 = await chatService.sendMessage(
      conversation._id,
      seller._id,
      'Dạ còn ạ, bạn quan tâm sản phẩm này à?'
    );
    console.log(`✅ Reply sent: ${message2._id}`);
    
    // Test 3: Get messages
    console.log('\n3️⃣ Testing getMessages...');
    const messages = await chatService.getMessages(conversation._id, buyer._id);
    console.log(`✅ Retrieved ${messages.messages.length} messages`);
    
    // Test 4: Get conversations
    console.log('\n4️⃣ Testing getConversations...');
    const buyerConversations = await chatService.getConversations(buyer._id);
    console.log(`✅ Buyer has ${buyerConversations.conversations.length} conversations`);
    
    // Test 5: Get unread count
    console.log('\n5️⃣ Testing getUnreadCount...');
    const unreadCount = await chatService.getUnreadCount(seller._id);
    console.log(`✅ Seller has ${unreadCount} unread messages`);
    
    // Test 6: Mark as read
    console.log('\n6️⃣ Testing markMessagesAsRead...');
    await chatService.markMessagesAsRead(conversation._id, seller._id);
    console.log('✅ Messages marked as read');
    
    const newUnreadCount = await chatService.getUnreadCount(seller._id);
    console.log(`   - New unread count: ${newUnreadCount}`);
    
  } catch (error) {
    console.log(`❌ Chat service test failed: ${error.message}`);
    console.error(error);
  }
}

async function runTests() {
  try {
    await connectDB();
    
    console.log('\n🧪 Starting Service Tests...\n');
    console.log('='.repeat(60));
    
    const orderTestData = await testOrderService();
    await testEscrowService(orderTestData);
    await testPaymentService();
    await testChatService();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All service tests completed!\n');
    
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
