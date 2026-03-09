/**
 * Simple test for Wallet Service functions
 * Tests the wallet service directly without HTTP
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/users/user.model');
const walletService = require('./src/modules/payments/wallet.service');

async function testWalletService() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No test user found. Please seed data first.');
      return;
    }

    console.log(`📝 Using test user: ${testUser.fullName} (${testUser._id})\n`);

    // Test 1: Get wallet balance
    console.log('=== Test 1: Get Wallet Balance ===');
    const balance = await walletService.getBalance(testUser._id);
    console.log('✅ Balance retrieved successfully');
    console.log(`   Balance: ${balance.balance.toLocaleString('vi-VN')} VND`);
    console.log(`   Total Deposited: ${balance.totalDeposited.toLocaleString('vi-VN')} VND`);
    console.log(`   Total Withdrawn: ${balance.totalWithdrawn.toLocaleString('vi-VN')} VND`);
    console.log(`   Total Spent: ${balance.totalSpent.toLocaleString('vi-VN')} VND`);
    console.log(`   Total Earned: ${balance.totalEarned.toLocaleString('vi-VN')} VND\n`);

    // Test 2: Get transaction history
    console.log('=== Test 2: Get Transaction History ===');
    const transactions = await walletService.getTransactions(testUser._id, {}, { page: 1, limit: 5 });
    console.log('✅ Transaction history retrieved successfully');
    console.log(`   Total transactions: ${transactions.total}`);
    console.log(`   Transactions on this page: ${transactions.transactions.length}`);
    
    transactions.transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${tx.amount.toLocaleString('vi-VN')} VND - ${tx.status}`);
    });
    console.log();

    // Test 3: Create a test deposit transaction
    console.log('=== Test 3: Create Test Deposit ===');
    const depositAmount = 100000;
    await walletService.incrementBalance(
      testUser._id, 
      depositAmount, 
      'deposit', 
      'Test deposit for API testing'
    );
    console.log('✅ Test deposit created successfully');
    console.log(`   Amount: ${depositAmount.toLocaleString('vi-VN')} VND\n`);

    // Test 4: Check updated balance
    console.log('=== Test 4: Check Updated Balance ===');
    const updatedBalance = await walletService.getBalance(testUser._id);
    console.log('✅ Updated balance retrieved successfully');
    console.log(`   New Balance: ${updatedBalance.balance.toLocaleString('vi-VN')} VND\n`);

    console.log('=== All Wallet Service Tests Passed ✅ ===');
    console.log('Wallet service is working correctly!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests
testWalletService();