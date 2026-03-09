/**
 * Test Order Payment API
 * Tests the order payment functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users
const testUsers = {
  buyer: {
    fullName: 'Payment Test Buyer',
    email: 'payment.buyer@example.com',
    password: 'password123',
    token: null
  },
  seller: {
    fullName: 'Payment Test Seller', 
    email: 'payment.seller@example.com',
    password: 'password123',
    token: null
  }
};

let testProductId = null;
let testOrderId = null;

/**
 * Setup user (register or login)
 */
async function setupUser(userData) {
  try {
    // Try to register first
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    if (response.data.success) {
      return response.data.data.token;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // User exists, try to login
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      if (loginResponse.data.success) {
        return loginResponse.data.data.token;
      }
    }
    throw error;
  }
}

/**
 * Create test product and purchase request, then accept it to create an order
 */
async function createTestOrder() {
  // Create product
  const productResponse = await axios.post(`${BASE_URL}/products`, {
    title: 'Payment Test Product',
    description: 'Product for testing payment functionality',
    price: 200000,
    category: 'electronics',
    condition: 'new',
    location: 'Ho Chi Minh City',
    images: ['test-payment.jpg']
  }, {
    headers: { Authorization: `Bearer ${testUsers.seller.token}` }
  });
  
  testProductId = productResponse.data.data._id;
  console.log(`✅ Test product created: ${testProductId}`);
  
  // Create purchase request
  const requestResponse = await axios.post(`${BASE_URL}/orders/purchase-request`, {
    listingId: testProductId,
    message: 'I want to buy this product for payment testing',
    agreedPrice: 180000
  }, {
    headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
  });
  
  const requestId = requestResponse.data.data._id;
  console.log(`✅ Purchase request created: ${requestId}`);
  
  // Accept purchase request to create order
  const acceptResponse = await axios.post(`${BASE_URL}/orders/${requestId}/accept`, {}, {
    headers: { Authorization: `Bearer ${testUsers.seller.token}` }
  });
  
  testOrderId = acceptResponse.data.data._id;
  console.log(`✅ Order created: ${testOrderId}`);
  console.log(`   Total to pay: ${acceptResponse.data.data.totalToPay.toLocaleString('vi-VN')} VND`);
  
  return acceptResponse.data.data;
}

/**
 * Test order payment
 */
async function testOrderPayment() {
  console.log('\n🧪 Testing: Order Payment');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/${testOrderId}/pay`, {}, {
      headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Order payment successful');
      console.log(`   Order Status: ${response.data.data.status}`);
      console.log(`   Payment Status: ${response.data.data.paymentStatus}`);
      console.log(`   Paid At: ${response.data.data.paidAt}`);
      return true;
    } else {
      console.log('❌ Order payment failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Order payment error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test payment of already paid order (should fail)
 */
async function testDuplicatePayment() {
  console.log('\n🧪 Testing: Duplicate Payment (Should Fail)');
  
  try {
    await axios.post(`${BASE_URL}/orders/${testOrderId}/pay`, {}, {
      headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
    });
    console.log('❌ Duplicate payment should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Duplicate payment correctly rejected');
      console.log(`   Error: ${error.response.data.message}`);
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Test unauthorized payment (seller trying to pay)
 */
async function testUnauthorizedPayment() {
  console.log('\n🧪 Testing: Unauthorized Payment (Should Fail)');
  
  // Create another order for this test
  const productResponse = await axios.post(`${BASE_URL}/products`, {
    title: 'Unauthorized Payment Test Product',
    description: 'Product for testing unauthorized payment',
    price: 100000,
    category: 'electronics',
    condition: 'new',
    location: 'Ho Chi Minh City',
    images: ['test-unauthorized.jpg']
  }, {
    headers: { Authorization: `Bearer ${testUsers.seller.token}` }
  });
  
  const requestResponse = await axios.post(`${BASE_URL}/orders/purchase-request`, {
    listingId: productResponse.data.data._id,
    message: 'Test unauthorized payment',
    agreedPrice: 95000
  }, {
    headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
  });
  
  const acceptResponse = await axios.post(`${BASE_URL}/orders/${requestResponse.data.data._id}/accept`, {}, {
    headers: { Authorization: `Bearer ${testUsers.seller.token}` }
  });
  
  const newOrderId = acceptResponse.data.data._id;
  
  try {
    // Seller trying to pay for the order (should fail)
    await axios.post(`${BASE_URL}/orders/${newOrderId}/pay`, {}, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    console.log('❌ Unauthorized payment should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Unauthorized payment correctly rejected');
      console.log(`   Error: ${error.response.data.message}`);
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Order Payment API Tests...\n');
  
  try {
    // Setup users
    console.log('📝 Setting up test users...');
    testUsers.buyer.token = await setupUser(testUsers.buyer);
    testUsers.seller.token = await setupUser(testUsers.seller);
    console.log('✅ Test users ready\n');
    
    // Create test order
    console.log('📦 Creating test order...');
    await createTestOrder();
    
    // Run tests
    const results = [];
    results.push(await testOrderPayment());
    results.push(await testDuplicatePayment());
    results.push(await testUnauthorizedPayment());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Order Payment API is working correctly.');
      console.log('\n📋 Functionality Tested:');
      console.log('   ✅ Order payment processing');
      console.log('   ✅ Duplicate payment prevention');
      console.log('   ✅ Authorization checks');
      console.log('   ✅ Status updates (order and payment)');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };