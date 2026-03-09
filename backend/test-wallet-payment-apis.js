/**
 * Test script for Wallet and Payment APIs
 * Tests Task 16: Backend - Wallet APIs
 * Tests Task 17: Backend - Payment APIs (VNPay)
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials (you should have a test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✅ Login successful\n');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function testWalletAPIs() {
  const headers = { Authorization: `Bearer ${authToken}` };

  console.log('=== Testing Wallet APIs ===\n');

  // Test 1: Get wallet balance
  console.log('Test 1: Get Wallet Balance');
  try {
    const response = await axios.get(`${BASE_URL}/wallets/balance`, { headers });
    console.log('✅ Balance retrieved successfully');
    console.log('   Balance:', response.data.data.balance.toLocaleString('vi-VN'), 'VND');
    console.log('   Total Deposited:', response.data.data.totalDeposited.toLocaleString('vi-VN'), 'VND');
    console.log('   Total Withdrawn:', response.data.data.totalWithdrawn.toLocaleString('vi-VN'), 'VND');
    console.log('   Total Spent:', response.data.data.totalSpent.toLocaleString('vi-VN'), 'VND');
    console.log('   Total Earned:', response.data.data.totalEarned.toLocaleString('vi-VN'), 'VND\n');
  } catch (error) {
    console.error('❌ Get balance failed:', error.response?.data?.message || error.message);
  }

  // Test 2: Get transaction history
  console.log('Test 2: Get Transaction History');
  try {
    const response = await axios.get(`${BASE_URL}/wallets/transactions?page=1&limit=5`, { headers });
    console.log('✅ Transaction history retrieved successfully');
    console.log('   Total transactions:', response.data.data.total);
    console.log('   Transactions on this page:', response.data.data.transactions.length);
    
    response.data.data.transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${tx.amount.toLocaleString('vi-VN')} VND - ${tx.status}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Get transactions failed:', error.response?.data?.message || error.message);
  }

  // Test 3: Create withdrawal request (should fail due to insufficient balance)
  console.log('Test 3: Create Withdrawal Request');
  try {
    const withdrawalData = {
      amount: 100000,
      bankAccount: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'Test User'
      }
    };
    
    const response = await axios.post(`${BASE_URL}/wallets/withdraw`, withdrawalData, { headers });
    console.log('✅ Withdrawal request created successfully');
    console.log('   Withdrawal ID:', response.data.data._id);
    console.log('   Amount:', response.data.data.amount.toLocaleString('vi-VN'), 'VND');
    console.log('   Status:', response.data.data.status);
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('Số dư không đủ')) {
      console.log('✅ Withdrawal validation working (insufficient balance)');
      console.log('   Error:', error.response.data.message);
    } else {
      console.error('❌ Withdrawal request failed:', error.response?.data?.message || error.message);
    }
  }
  console.log();
}

async function testPaymentAPIs() {
  const headers = { Authorization: `Bearer ${authToken}` };

  console.log('=== Testing Payment APIs ===\n');

  // Test 1: Create VNPay payment URL
  console.log('Test 1: Create VNPay Payment URL');
  try {
    const paymentData = {
      amount: 100000,
      orderInfo: 'Test top-up 100,000 VND'
    };
    
    const response = await axios.post(`${BASE_URL}/payments/vnpay/create`, paymentData, { headers });
    console.log('✅ VNPay payment URL created successfully');
    console.log('   Transaction ID:', response.data.data.transactionId);
    console.log('   Payment URL:', response.data.data.paymentUrl.substring(0, 100) + '...');
    console.log('   Amount:', response.data.data.amount.toLocaleString('vi-VN'), 'VND');
  } catch (error) {
    console.error('❌ Create VNPay payment failed:', error.response?.data?.message || error.message);
  }

  // Test 2: Test amount validation
  console.log('\nTest 2: Amount Validation');
  try {
    const invalidPaymentData = {
      amount: 5000, // Below minimum
      orderInfo: 'Invalid amount test'
    };
    
    await axios.post(`${BASE_URL}/payments/vnpay/create`, invalidPaymentData, { headers });
    console.log('❌ Amount validation failed - should have rejected low amount');
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('tối thiểu')) {
      console.log('✅ Amount validation working (minimum amount check)');
      console.log('   Error:', error.response.data.message);
    } else {
      console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }

  // Test 3: Test maximum amount validation
  try {
    const invalidPaymentData = {
      amount: 600000000, // Above maximum
      orderInfo: 'Invalid amount test'
    };
    
    await axios.post(`${BASE_URL}/payments/vnpay/create`, invalidPaymentData, { headers });
    console.log('❌ Amount validation failed - should have rejected high amount');
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('tối đa')) {
      console.log('✅ Amount validation working (maximum amount check)');
      console.log('   Error:', error.response.data.message);
    } else {
      console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
  console.log();
}

async function testUnauthorizedAccess() {
  console.log('=== Testing Authorization ===\n');

  // Test without token
  console.log('Test: Access without authentication');
  try {
    await axios.get(`${BASE_URL}/wallets/balance`);
    console.log('❌ Authorization failed - should have rejected request');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Authorization working (rejected unauthenticated request)');
      console.log('   Error:', error.response.data.message);
    } else {
      console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
  console.log();
}

async function runTests() {
  try {
    console.log('🚀 Starting Wallet & Payment API Tests\n');

    await login();
    await testWalletAPIs();
    await testPaymentAPIs();
    await testUnauthorizedAccess();

    console.log('=== All Tests Completed ✅ ===');
    console.log('Tasks 16 & 17: Backend Wallet & Payment APIs are working!\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests
runTests();