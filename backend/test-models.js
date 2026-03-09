/**
 * Test script for new models and services
 * Run: node test-models.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./src/modules/orders/order.model');
const PurchaseRequest = require('./src/modules/orders/purchase-request.model');
const Wallet = require('./src/modules/payments/wallet.model');
const Transaction = require('./src/modules/payments/transaction.model');
const EscrowHold = require('./src/modules/payments/escrow-hold.model');
const Conversation = require('./src/modules/chat/conversation.model');
const Message = require('./src/modules/chat/message.model');
const Review = require('./src/modules/reports/review.model');
const Report = require('./src/modules/reports/report.model');
const Dispute = require('./src/modules/reports/dispute.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const User = require('./src/modules/users/user.model');
const Product = require('./src/modules/products/product.model');

// Import services
const walletService = require('./src/modules/payments/wallet.service');

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

async function testModels() {
  console.log('\n📋 Testing Models...\n');
  
  const models = [
    { name: 'Order', model: Order },
    { name: 'PurchaseRequest', model: PurchaseRequest },
    { name: 'Wallet', model: Wallet },
    { name: 'Transaction', model: Transaction },
    { name: 'EscrowHold', model: EscrowHold },
    { name: 'Conversation', model: Conversation },
    { name: 'Message', model: Message },
    { name: 'Review', model: Review },
    { name: 'Report', model: Report },
    { name: 'Dispute', model: Dispute },
    { name: 'Delivery', model: Delivery },
    { name: 'User (updated)', model: User },
    { name: 'Product (updated)', model: Product }
  ];
  
  for (const { name, model } of models) {
    try {
      // Check if model is properly defined
      if (!model || !model.modelName) {
        console.log(`❌ ${name}: Model not properly defined`);
        continue;
      }
      
      // Check schema
      const schema = model.schema;
      const paths = Object.keys(schema.paths);
      
      console.log(`✅ ${name}: Model loaded successfully`);
      console.log(`   - Fields: ${paths.length}`);
      console.log(`   - Indexes: ${schema.indexes().length}`);
      
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
}

async function testUserModel() {
  console.log('\n👤 Testing User Model Updates...\n');
  
  try {
    // Find a test user
    const user = await User.findOne();
    
    if (!user) {
      console.log('⚠️  No users found in database. Skipping user test.');
      return;
    }
    
    console.log('✅ User model fields:');
    console.log(`   - Has phone field: ${user.schema.paths.hasOwnProperty('phone')}`);
    console.log(`   - Has address field: ${user.schema.paths.hasOwnProperty('address')}`);
    console.log(`   - Has avatar field: ${user.schema.paths.hasOwnProperty('avatar')}`);
    console.log(`   - Has kycStatus field: ${user.schema.paths.hasOwnProperty('kycStatus')}`);
    console.log(`   - Has rating field: ${user.schema.paths.hasOwnProperty('rating')}`);
    console.log(`   - Has totalReviews field: ${user.schema.paths.hasOwnProperty('totalReviews')}`);
    
  } catch (error) {
    console.log(`❌ User model test failed: ${error.message}`);
  }
}

async function testProductModel() {
  console.log('\n📦 Testing Product Model Updates...\n');
  
  try {
    // Find a test product
    const product = await Product.findOne();
    
    if (!product) {
      console.log('⚠️  No products found in database. Skipping product test.');
      return;
    }
    
    console.log('✅ Product model fields:');
    console.log(`   - Has viewCount field: ${product.schema.paths.hasOwnProperty('viewCount')}`);
    console.log(`   - Has isFeatured field: ${product.schema.paths.hasOwnProperty('isFeatured')}`);
    console.log(`   - Has featuredUntil field: ${product.schema.paths.hasOwnProperty('featuredUntil')}`);
    console.log(`   - Has moderationStatus field: ${product.schema.paths.hasOwnProperty('moderationStatus')}`);
    console.log(`   - Status enum includes "hidden": ${product.schema.paths.status.enumValues.includes('hidden')}`);
    console.log(`   - Status enum includes "deleted": ${product.schema.paths.status.enumValues.includes('deleted')}`);
    
  } catch (error) {
    console.log(`❌ Product model test failed: ${error.message}`);
  }
}

async function testWalletService() {
  console.log('\n💰 Testing Wallet Service...\n');
  
  try {
    // Find a test user
    const user = await User.findOne();
    
    if (!user) {
      console.log('⚠️  No users found in database. Skipping wallet service test.');
      return;
    }
    
    console.log(`Testing with user: ${user.email}`);
    
    // Test 1: Get or create wallet
    console.log('\n1️⃣ Testing getOrCreateWallet...');
    const wallet = await walletService.getOrCreateWallet(user._id);
    console.log(`✅ Wallet created/retrieved: ${wallet._id}`);
    console.log(`   - Balance: ${wallet.balance} VND`);
    
    // Test 2: Get balance
    console.log('\n2️⃣ Testing getBalance...');
    const balance = await walletService.getBalance(user._id);
    console.log(`✅ Balance retrieved:`);
    console.log(`   - Current balance: ${balance.balance} VND`);
    console.log(`   - Total deposited: ${balance.totalDeposited} VND`);
    console.log(`   - Total spent: ${balance.totalSpent} VND`);
    
    // Test 3: Increment balance (deposit)
    console.log('\n3️⃣ Testing incrementBalance (deposit)...');
    const depositAmount = 100000;
    await walletService.incrementBalance(
      user._id,
      depositAmount,
      'deposit',
      'Test deposit'
    );
    console.log(`✅ Deposited ${depositAmount} VND`);
    
    const newBalance = await walletService.getBalance(user._id);
    console.log(`   - New balance: ${newBalance.balance} VND`);
    
    // Test 4: Get transactions
    console.log('\n4️⃣ Testing getTransactions...');
    const transactions = await walletService.getTransactions(user._id, {}, { page: 1, limit: 5 });
    console.log(`✅ Retrieved ${transactions.transactions.length} transactions`);
    console.log(`   - Total transactions: ${transactions.pagination.total}`);
    
    if (transactions.transactions.length > 0) {
      const lastTx = transactions.transactions[0];
      console.log(`   - Last transaction: ${lastTx.type} - ${lastTx.amount} VND`);
    }
    
    // Test 5: Decrement balance (payment)
    console.log('\n5️⃣ Testing decrementBalance (payment)...');
    const paymentAmount = 50000;
    
    if (newBalance.balance >= paymentAmount) {
      await walletService.decrementBalance(
        user._id,
        paymentAmount,
        'payment',
        'Test payment'
      );
      console.log(`✅ Payment of ${paymentAmount} VND successful`);
      
      const finalBalance = await walletService.getBalance(user._id);
      console.log(`   - Final balance: ${finalBalance.balance} VND`);
    } else {
      console.log(`⚠️  Insufficient balance for payment test (need ${paymentAmount} VND)`);
    }
    
    // Test 6: Test insufficient balance error
    console.log('\n6️⃣ Testing insufficient balance error...');
    try {
      await walletService.decrementBalance(
        user._id,
        999999999,
        'payment',
        'Test insufficient balance'
      );
      console.log('❌ Should have thrown insufficient balance error');
    } catch (error) {
      if (error.message === 'Số dư không đủ') {
        console.log('✅ Insufficient balance error handled correctly');
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Wallet service test failed: ${error.message}`);
    console.error(error);
  }
}

async function testIndexes() {
  console.log('\n🔍 Testing Database Indexes...\n');
  
  const collections = [
    'orders',
    'purchaserequests',
    'wallets',
    'transactions',
    'escrowholds',
    'conversations',
    'messages',
    'reviews',
    'reports',
    'disputes',
    'deliveries'
  ];
  
  for (const collectionName of collections) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`✅ ${collectionName}: ${indexes.length} indexes`);
      
      // Show index details
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        console.log(`   - ${index.name}: [${keys}]`);
      });
      
    } catch (error) {
      console.log(`⚠️  ${collectionName}: Collection not found (will be created on first insert)`);
    }
  }
}

async function runTests() {
  try {
    await connectDB();
    
    console.log('\n🧪 Starting Model and Service Tests...\n');
    console.log('='.repeat(60));
    
    await testModels();
    await testUserModel();
    await testProductModel();
    await testWalletService();
    await testIndexes();
    
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
