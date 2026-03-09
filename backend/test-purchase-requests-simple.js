/**
 * Simple test for Purchase Request APIs
 * Creates test users first, then tests the APIs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users to create
const testUsers = {
  buyer: {
    fullName: 'Test Buyer',
    email: 'testbuyer@example.com',
    password: 'password123',
    token: null
  },
  seller: {
    fullName: 'Test Seller', 
    email: 'testseller@example.com',
    password: 'password123',
    token: null
  }
};

let testProductId = null;
let testRequestId = null;

/**
 * Register a new user or login if exists
 */
async function registerOrLoginUser(userData) {
  try {
    // Try to register first
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    
    if (response.data.success) {
      console.log(`✅ User registered: ${userData.email}`);
      return response.data.data.token;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('đã được sử dụng')) {
      console.log(`ℹ️  User already exists: ${userData.email}, trying to login...`);
      return await loginUser(userData.email, userData.password);
    }
    console.error(`Registration error for ${userData.email}:`, error.response?.data || error.message);
    throw error;
  }
}

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
      console.log(`✅ User logged in: ${email}`);
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
      category: 'electronics', // Use slug, the service will convert it
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
 * Test creating a purchase request
 */
async function testCreatePurchaseRequest() {
  console.log('\n🧪 Testing: Create Purchase Request');
  
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
      console.log('   Status:', response.data.data.status);
      return true;
    } else {
      console.log('❌ Purchase request creation failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Purchase request creation error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test getting received requests
 */
async function testGetReceivedRequests() {
  console.log('\n🧪 Testing: Get Received Purchase Requests');
  
  try {
    const response = await axios.get(`${BASE_URL}/orders/purchase-requests/received`, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Received requests retrieved successfully');
      console.log('   Total requests:', response.data.data.requests.length);
      
      if (response.data.data.requests.length > 0) {
        const request = response.data.data.requests[0];
        console.log('   First request status:', request.status);
      }
      return true;
    } else {
      console.log('❌ Get received requests failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get received requests error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test accepting a purchase request
 */
async function testAcceptPurchaseRequest() {
  console.log('\n🧪 Testing: Accept Purchase Request');
  
  try {
    const response = await axios.post(`${BASE_URL}/orders/${testRequestId}/accept`, {}, {
      headers: { Authorization: `Bearer ${testUsers.seller.token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Purchase request accepted successfully');
      console.log('   Order created with ID:', response.data.data._id);
      console.log('   Total to pay:', response.data.data.totalToPay);
      return true;
    } else {
      console.log('❌ Accept purchase request failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Accept purchase request error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Purchase Request API Tests...\n');
  
  try {
    // Register/login users
    console.log('📝 Setting up test users...');
    testUsers.buyer.token = await registerOrLoginUser(testUsers.buyer);
    testUsers.seller.token = await registerOrLoginUser(testUsers.seller);
    console.log('✅ Test users ready\n');
    
    // Create test product
    console.log('📦 Creating test product...');
    testProductId = await createTestProduct(testUsers.seller.token);
    
    // Run core tests
    const results = [];
    results.push(await testCreatePurchaseRequest());
    results.push(await testGetReceivedRequests());
    results.push(await testAcceptPurchaseRequest());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Purchase Request APIs are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
    
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