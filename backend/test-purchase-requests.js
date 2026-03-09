/**
 * Test Purchase Request APIs
 * Tests the complete purchase request flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users (from previous tests)
const testUsers = {
  buyer: {
    email: 'buyer@test.com',
    password: 'password123',
    token: null
  },
  seller: {
    email: 'seller@test.com', 
    password: 'password123',
    token: null
  }
};

let testProductId = null;
let testRequestId = null;

/**
 * Login user and get token
 */
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('Login failed');
  } catch (error) {
    console.error(`Login error for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a test product for purchase requests
 */
async function createTestProduct(token) {
  try {
    const response = await axios.post(`${BASE_URL}/products`, {
      title: 'Test Product for Purchase Request',
      description: 'This is a test product for purchase request testing',
      price: 100000,
      category: 'electronics',
      condition: 'new',
      location: 'Ho Chi Minh City',
      images: ['test-image.jpg']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Test product created:', response.data.data._id);
      return response.data.data._id;
    }
    throw new Error('Product creation failed');
  } catch (error) {
    console.error('Create product error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 1: Create purchase request
 */
async function testCreatePurchaseRequest() {
  console.log('\n🧪 Test 1: Create Purchase Request');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/purchase-request`, {
      listingId: testProductId,
      message: 'Tôi muốn mua sản phẩm này. Có thể thương lượng giá không?',
      agreedPrice: 95000
    }, {
      headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
    });
    
    if (response.data.success) {
      testRequestId = response.data.data._id;
      console.log('✅ Purchase request created successfully');
      console.log('   Request ID:', testRequestId);
      console.log('   Message:', response.data.data.message);
      console.log('   Agreed Price:', response.data.data.agreedPrice);
      console.log('   Status:', response.data.data.status);
    } else {
      console.log('❌ Purchase request creation failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Purchase request creation error:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Get sent purchase requests (buyer)
 */
async function testGetSentRequests() {
  console.log('\n🧪 Test 2: Get Sent Purchase Requests (Buyer)');
  
  try {
    const response = await axios.get(`${BASE_URL}/orders/purchase-requests/sent`, {
      headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Sent requests retrieved successfully');
      console.log('   Total requests:', response.data.data.requests.length);
      console.log('   Pagination:', response.data.data.pagination);
      
      if (response.data.data.requests.length > 0) {
        const request = response.data.data.requests[0];
        console.log('   First request:');
        console.log('     - Product:', request.listingId.title);
        console.log('     - Status:', request.status);
        console.log('     - Agreed Price:', request.agreedPrice);
      }
    } else {
      console.log('❌ Get sent requests failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Get sent requests error:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Get received purchase requests (seller)
 */
async function testGetReceivedRequests() {
  console.log('\n🧪 Test 3: Get Received Purchase Requests (Seller)');
  
  try {
    const response = await axios.get(`${BASE_URL}/orders/purchase-requests/received`, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Received requests retrieved successfully');
      console.log('   Total requests:', response.data.data.requests.length);
      console.log('   Pagination:', response.data.data.pagination);
      
      if (response.data.data.requests.length > 0) {
        const request = response.data.data.requests[0];
        console.log('   First request:');
        console.log('     - Product:', request.listingId.title);
        console.log('     - Buyer:', request.buyerId.fullName);
        console.log('     - Status:', request.status);
        console.log('     - Message:', request.message);
        console.log('     - Agreed Price:', request.agreedPrice);
      }
    } else {
      console.log('❌ Get received requests failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Get received requests error:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 4: Accept purchase request
 */
async function testAcceptPurchaseRequest() {
  console.log('\n🧪 Test 4: Accept Purchase Request');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/${testRequestId}/accept`, {}, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Purchase request accepted successfully');
      console.log('   Order ID:', response.data.data._id);
      console.log('   Status:', response.data.data.status);
      console.log('   Agreed Amount:', response.data.data.agreedAmount);
      console.log('   Platform Fee:', response.data.data.platformFee);
      console.log('   Total to Pay:', response.data.data.totalToPay);
      console.log('   Payment Status:', response.data.data.paymentStatus);
    } else {
      console.log('❌ Accept purchase request failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Accept purchase request error:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 5: Try to create duplicate purchase request (should fail)
 */
async function testDuplicatePurchaseRequest() {
  console.log('\n🧪 Test 5: Try Duplicate Purchase Request (Should Fail)');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/purchase-request`, {
      listingId: testProductId,
      message: 'Another request for the same product',
      agreedPrice: 90000
    }, {
      headers: { Authorization: `Bearer ${testUsers.buyer.token}` }
    });
    
    console.log('❌ Duplicate request should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Duplicate request correctly rejected:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
}

/**
 * Test 6: Try to buy own product (should fail)
 */
async function testBuyOwnProduct() {
  console.log('\n🧪 Test 6: Try to Buy Own Product (Should Fail)');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/purchase-request`, {
      listingId: testProductId,
      message: 'Trying to buy my own product',
      agreedPrice: 100000
    }, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    
    console.log('❌ Buying own product should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Buying own product correctly rejected:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Purchase Request API Tests...\n');
  
  try {
    // Login users
    console.log('📝 Logging in test users...');
    testUsers.buyer.token = await loginUser(testUsers.buyer.email, testUsers.buyer.password);
    testUsers.seller.token = await loginUser(testUsers.seller.email, testUsers.seller.password);
    console.log('✅ Users logged in successfully\n');
    
    // Create test product
    console.log('📦 Creating test product...');
    testProductId = await createTestProduct(testUsers.seller.token);
    
    // Run tests
    await testCreatePurchaseRequest();
    await testGetSentRequests();
    await testGetReceivedRequests();
    await testAcceptPurchaseRequest();
    await testDuplicatePurchaseRequest();
    await testBuyOwnProduct();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };