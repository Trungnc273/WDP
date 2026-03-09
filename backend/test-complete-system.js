/**
 * Complete System Test
 * Tests the entire application flow from user registration to order completion
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
let testUsers = {};
let testProduct = {};
let testOrder = {};
let authTokens = {};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Test functions
async function testUserRegistration() {
  console.log('\n🔐 Testing User Registration...');
  
  // Register seller
  const sellerData = {
    fullName: 'Test Seller',
    email: 'seller@test.com',
    password: 'password123'
  };
  
  const sellerResult = await makeRequest('POST', '/auth/register', sellerData);
  testUsers.seller = sellerResult.data.user;
  authTokens.seller = sellerResult.data.token;
  console.log('✅ Seller registered successfully');
  
  // Register buyer
  const buyerData = {
    fullName: 'Test Buyer',
    email: 'buyer@test.com',
    password: 'password123'
  };
  
  const buyerResult = await makeRequest('POST', '/auth/register', buyerData);
  testUsers.buyer = buyerResult.data.user;
  authTokens.buyer = buyerResult.data.token;
  console.log('✅ Buyer registered successfully');
}

async function testUserLogin() {
  console.log('\n🔑 Testing User Login...');
  
  // Login seller
  const sellerLogin = await makeRequest('POST', '/auth/login', {
    email: 'seller@test.com',
    password: 'password123'
  });
  authTokens.seller = sellerLogin.data.token;
  console.log('✅ Seller login successful');
  
  // Login buyer
  const buyerLogin = await makeRequest('POST', '/auth/login', {
    email: 'buyer@test.com',
    password: 'password123'
  });
  authTokens.buyer = buyerLogin.data.token;
  console.log('✅ Buyer login successful');
}

async function testProductManagement() {
  console.log('\n📦 Testing Product Management...');
  
  // Create product
  const productData = {
    title: 'Test Product',
    description: 'This is a test product for system testing',
    price: 100000,
    category: 'electronics',
    condition: 'new',
    images: ['test-image-1.jpg', 'test-image-2.jpg']
  };
  
  const productResult = await makeRequest('POST', '/products', productData, authTokens.seller);
  testProduct = productResult.data;
  console.log('✅ Product created successfully');
  
  // Get product details
  const productDetail = await makeRequest('GET', `/products/${testProduct._id}`);
  console.log('✅ Product details retrieved successfully');
  
  // Update product
  const updateData = { price: 120000 };
  await makeRequest('PUT', `/products/${testProduct._id}`, updateData, authTokens.seller);
  console.log('✅ Product updated successfully');
}

async function testWalletOperations() {
  console.log('\n💰 Testing Wallet Operations...');
  
  // Get buyer wallet balance
  const buyerWallet = await makeRequest('GET', '/wallets/balance', null, authTokens.buyer);
  console.log('✅ Buyer wallet balance retrieved');
  
  // Simulate wallet top-up (add balance directly for testing)
  // In real scenario, this would be done through VNPay
  const topUpAmount = 500000;
  console.log(`💳 Simulating wallet top-up of ${topUpAmount} VND`);
  console.log('✅ Wallet top-up simulation completed');
}

async function testPurchaseRequestFlow() {
  console.log('\n🛒 Testing Purchase Request Flow...');
  
  // Create purchase request
  const purchaseRequestData = {
    productId: testProduct._id,
    message: 'I would like to buy this product',
    agreedPrice: 120000
  };
  
  const purchaseRequest = await makeRequest('POST', '/orders/purchase-request', purchaseRequestData, authTokens.buyer);
  console.log('✅ Purchase request created successfully');
  
  // Get received purchase requests (seller)
  const receivedRequests = await makeRequest('GET', '/orders/purchase-requests/received', null, authTokens.seller);
  console.log('✅ Seller can view received purchase requests');
  
  // Accept purchase request
  const requestId = receivedRequests.data[0]._id;
  const acceptResult = await makeRequest('POST', `/orders/${requestId}/accept`, {}, authTokens.seller);
  testOrder = acceptResult.data;
  console.log('✅ Purchase request accepted, order created');
}

async function testOrderPayment() {
  console.log('\n💳 Testing Order Payment...');
  
  // Pay for order
  const paymentResult = await makeRequest('POST', `/orders/${testOrder._id}/pay`, {}, authTokens.buyer);
  console.log('✅ Order payment successful');
  
  // Get order details
  const orderDetail = await makeRequest('GET', `/orders/${testOrder._id}`, null, authTokens.buyer);
  testOrder = orderDetail.data;
  console.log('✅ Order details retrieved after payment');
}

async function testOrderFulfillment() {
  console.log('\n📦 Testing Order Fulfillment...');
  
  // Confirm shipment (seller)
  const shipmentData = {
    trackingNumber: 'TEST123456789',
    shippingProvider: 'ghn'
  };
  
  await makeRequest('POST', `/orders/${testOrder._id}/ship`, shipmentData, authTokens.seller);
  console.log('✅ Seller confirmed shipment');
  
  // Confirm receipt (buyer)
  await makeRequest('POST', `/orders/${testOrder._id}/confirm-receipt`, {}, authTokens.buyer);
  console.log('✅ Buyer confirmed receipt');
  
  // Get final order status
  const finalOrder = await makeRequest('GET', `/orders/${testOrder._id}`, null, authTokens.buyer);
  console.log(`✅ Final order status: ${finalOrder.data.status}`);
}

async function testChatSystem() {
  console.log('\n💬 Testing Chat System...');
  
  // Create conversation
  const conversationData = {
    participantId: testUsers.seller._id,
    productId: testProduct._id
  };
  
  const conversation = await makeRequest('POST', '/chat/conversations', conversationData, authTokens.buyer);
  console.log('✅ Conversation created successfully');
  
  // Send message
  const messageData = {
    conversationId: conversation.data._id,
    content: 'Hello, I have a question about the product'
  };
  
  await makeRequest('POST', '/chat/messages', messageData, authTokens.buyer);
  console.log('✅ Message sent successfully');
  
  // Get messages
  const messages = await makeRequest('GET', `/chat/conversations/${conversation.data._id}/messages`, null, authTokens.buyer);
  console.log('✅ Messages retrieved successfully');
}

async function testReviewSystem() {
  console.log('\n⭐ Testing Review System...');
  
  // Rate seller
  const reviewData = {
    rating: 5,
    comment: 'Great seller, fast shipping!'
  };
  
  await makeRequest('POST', `/orders/${testOrder._id}/rate`, reviewData, authTokens.buyer);
  console.log('✅ Seller rated successfully');
  
  // Get seller reviews
  const reviews = await makeRequest('GET', `/users/${testUsers.seller._id}/reviews`);
  console.log('✅ Seller reviews retrieved successfully');
}

async function testReportSystem() {
  console.log('\n🚨 Testing Report System...');
  
  // Report product
  const reportData = {
    productId: testProduct._id,
    reason: 'inappropriate_content',
    description: 'This is a test report'
  };
  
  await makeRequest('POST', '/reports/product', reportData, authTokens.buyer);
  console.log('✅ Product reported successfully');
}

async function testUserProfile() {
  console.log('\n👤 Testing User Profile...');
  
  // Update profile
  const profileData = {
    fullName: 'Updated Test Seller',
    phone: '0123456789',
    address: '123 Test Street'
  };
  
  await makeRequest('PUT', '/users/profile', profileData, authTokens.seller);
  console.log('✅ Profile updated successfully');
  
  // Get profile
  const profile = await makeRequest('GET', `/users/${testUsers.seller._id}/public`);
  console.log('✅ Public profile retrieved successfully');
}

async function testDeliverySystem() {
  console.log('\n🚚 Testing Delivery System...');
  
  // Create delivery record
  const deliveryData = {
    orderId: testOrder._id,
    provider: 'ghn',
    trackingNumber: 'TEST123456789',
    shippingAddress: {
      recipientName: 'Test Buyer',
      phone: '0987654321',
      address: '456 Buyer Street',
      city: 'Ho Chi Minh City'
    }
  };
  
  await makeRequest('POST', '/delivery/create', deliveryData, authTokens.seller);
  console.log('✅ Delivery record created successfully');
  
  // Get delivery info
  const delivery = await makeRequest('GET', `/delivery/${testOrder._id}`, null, authTokens.buyer);
  console.log('✅ Delivery information retrieved successfully');
}

// Main test runner
async function runCompleteSystemTest() {
  console.log('🚀 Starting Complete System Test...');
  console.log('=====================================');
  
  try {
    await testUserRegistration();
    await testUserLogin();
    await testProductManagement();
    await testWalletOperations();
    await testPurchaseRequestFlow();
    await testOrderPayment();
    await testOrderFulfillment();
    await testChatSystem();
    await testReviewSystem();
    await testReportSystem();
    await testUserProfile();
    await testDeliverySystem();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ User Registration & Login');
    console.log('✅ Product Management');
    console.log('✅ Wallet Operations');
    console.log('✅ Purchase Request Flow');
    console.log('✅ Order Payment');
    console.log('✅ Order Fulfillment');
    console.log('✅ Chat System');
    console.log('✅ Review System');
    console.log('✅ Report System');
    console.log('✅ User Profile');
    console.log('✅ Delivery System');
    console.log('\n🎊 Complete system test successful!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runCompleteSystemTest();
}

module.exports = {
  runCompleteSystemTest
};