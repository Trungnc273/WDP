/**
 * Test Review and Report APIs
 * Tests the newly implemented review and report endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
let authToken = '';
let testUserId = '';
let testProductId = '';
let testOrderId = '';

async function testReviewReportAPIs() {
  console.log('🧪 Testing Review and Report APIs...\n');
  
  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'buyer@test.com',
      password: 'password123'
    });
    
    authToken = loginResponse.data.data.token;
    testUserId = loginResponse.data.data.user._id;
    console.log('✅ Login successful');
    
    // Step 2: Get a product to test with
    console.log('\n2. Getting test product...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    if (productsResponse.data.data.products.length > 0) {
      testProductId = productsResponse.data.data.products[0]._id;
      console.log('✅ Test product found:', testProductId);
    } else {
      console.log('❌ No products found for testing');
      return;
    }
    
    // Step 3: Get a completed order to test reviews
    console.log('\n3. Getting test order...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders/buying`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (ordersResponse.data.data.orders.length > 0) {
      // Find a completed order
      const completedOrder = ordersResponse.data.data.orders.find(order => order.status === 'completed');
      if (completedOrder) {
        testOrderId = completedOrder._id;
        console.log('✅ Completed order found:', testOrderId);
      } else {
        console.log('⚠️ No completed orders found, will test other endpoints');
      }
    }
    
    // Step 4: Test review endpoints
    if (testOrderId) {
      console.log('\n4. Testing review endpoints...');
      
      // Check if can review
      try {
        const canReviewResponse = await axios.get(`${BASE_URL}/orders/${testOrderId}/can-review`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Can review check:', canReviewResponse.data.data.canReview);
        
        // Create review if allowed
        if (canReviewResponse.data.data.canReview) {
          const reviewResponse = await axios.post(`${BASE_URL}/orders/${testOrderId}/rate`, {
            rating: 5,
            comment: 'Excellent seller, highly recommended!'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          console.log('✅ Review created successfully');
        }
      } catch (error) {
        console.log('⚠️ Review test:', error.response?.data?.message || error.message);
      }
      
      // Get review by order
      try {
        const reviewResponse = await axios.get(`${BASE_URL}/orders/${testOrderId}/review`);
        console.log('✅ Get review by order successful');
      } catch (error) {
        console.log('⚠️ Get review by order:', error.response?.data?.message || error.message);
      }
    }
    
    // Step 5: Test report endpoints
    console.log('\n5. Testing report endpoints...');
    
    // Create product report
    try {
      const reportResponse = await axios.post(`${BASE_URL}/reports/product`, {
        productId: testProductId,
        reason: 'inappropriate',
        description: 'This product contains inappropriate content that violates community guidelines.',
        evidenceImages: ['https://example.com/evidence1.jpg']
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Product report created successfully');
    } catch (error) {
      console.log('⚠️ Product report test:', error.response?.data?.message || error.message);
    }
    
    // Get my reports
    try {
      const myReportsResponse = await axios.get(`${BASE_URL}/reports/my-reports`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Get my reports successful, count:', myReportsResponse.data.data.reports.length);
    } catch (error) {
      console.log('⚠️ Get my reports:', error.response?.data?.message || error.message);
    }
    
    // Step 6: Test dispute endpoints (if we have a shipped order)
    console.log('\n6. Testing dispute endpoints...');
    
    // Find a shipped order
    const shippedOrder = ordersResponse.data.data.orders.find(order => order.status === 'shipped');
    if (shippedOrder) {
      try {
        const disputeResponse = await axios.post(`${BASE_URL}/orders/${shippedOrder._id}/dispute`, {
          reason: 'not_as_described',
          description: 'The product received does not match the description provided by the seller.',
          evidenceImages: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg']
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Dispute created successfully');
      } catch (error) {
        console.log('⚠️ Dispute test:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('⚠️ No shipped orders found for dispute testing');
    }
    
    // Get my disputes
    try {
      const myDisputesResponse = await axios.get(`${BASE_URL}/disputes/my-disputes`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Get my disputes successful, count:', myDisputesResponse.data.data.disputes.length);
    } catch (error) {
      console.log('⚠️ Get my disputes:', error.response?.data?.message || error.message);
    }
    
    // Step 7: Test rating stats
    console.log('\n7. Testing rating stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/users/${testUserId}/rating-stats`);
      console.log('✅ Rating stats retrieved successfully');
      console.log('   Average rating:', statsResponse.data.data.averageRating);
      console.log('   Total reviews:', statsResponse.data.data.totalReviews);
    } catch (error) {
      console.log('⚠️ Rating stats test:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Review and Report API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testReviewReportAPIs();