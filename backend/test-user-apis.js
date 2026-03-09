/**
 * Test User Profile and KYC APIs
 * Tests the newly implemented user endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
let authToken = '';
let testUserId = '';

async function testUserAPIs() {
  console.log('🧪 Testing User Profile and KYC APIs...\n');
  
  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'buyer@test.com',
      password: 'password123'
    });
    
    authToken = loginResponse.data.data.token;
    testUserId = loginResponse.data.data.user.id;
    console.log('✅ Login successful');
    console.log('   User ID:', testUserId);
    
    // Step 2: Get current user profile
    console.log('\n2. Getting current user profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Get profile successful');
      console.log('   User:', profileResponse.data.data.fullName);
      console.log('   Email:', profileResponse.data.data.email);
      console.log('   KYC Status:', profileResponse.data.data.kycStatus);
    } catch (error) {
      console.log('⚠️ Get profile:', error.response?.data?.message || error.message);
    }
    
    // Step 3: Update profile
    console.log('\n3. Updating profile...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/users/profile`, {
        fullName: 'Test User Updated',
        phone: '0123456789',
        address: '123 Test Street, Test City'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Update profile successful');
    } catch (error) {
      console.log('⚠️ Update profile:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Upload avatar
    console.log('\n4. Uploading avatar...');
    try {
      const avatarResponse = await axios.post(`${BASE_URL}/users/avatar`, {
        avatarUrl: 'https://example.com/avatar.jpg'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Upload avatar successful');
    } catch (error) {
      console.log('⚠️ Upload avatar:', error.response?.data?.message || error.message);
    }
    
    // Step 5: Get public profile
    console.log('\n5. Getting public profile...');
    try {
      const publicProfileResponse = await axios.get(`${BASE_URL}/users/${testUserId}/public`);
      console.log('✅ Get public profile successful');
      console.log('   Rating:', publicProfileResponse.data.data.rating);
      console.log('   Total Reviews:', publicProfileResponse.data.data.totalReviews);
    } catch (error) {
      console.log('⚠️ Get public profile:', error.response?.data?.message || error.message);
    }
    
    // Step 6: Get user stats
    console.log('\n6. Getting user stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/users/${testUserId}/stats`);
      console.log('✅ Get user stats successful');
      console.log('   Rating:', statsResponse.data.data.rating);
      console.log('   Member since:', new Date(statsResponse.data.data.memberSince).toLocaleDateString());
    } catch (error) {
      console.log('⚠️ Get user stats:', error.response?.data?.message || error.message);
    }
    
    // Step 7: Get KYC status
    console.log('\n7. Getting KYC status...');
    try {
      const kycStatusResponse = await axios.get(`${BASE_URL}/users/kyc/status`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Get KYC status successful');
      console.log('   Status:', kycStatusResponse.data.data.status);
    } catch (error) {
      console.log('⚠️ Get KYC status:', error.response?.data?.message || error.message);
    }
    
    // Step 8: Submit KYC (will likely fail due to missing images, but tests the endpoint)
    console.log('\n8. Testing KYC submission...');
    try {
      const kycResponse = await axios.post(`${BASE_URL}/users/kyc`, {
        idCardFront: 'https://example.com/id-front.jpg',
        idCardBack: 'https://example.com/id-back.jpg',
        selfie: 'https://example.com/selfie.jpg'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ KYC submission successful');
    } catch (error) {
      console.log('⚠️ KYC submission:', error.response?.data?.message || error.message);
    }
    
    // Step 9: Test change password (with wrong current password)
    console.log('\n9. Testing change password...');
    try {
      const changePasswordResponse = await axios.post(`${BASE_URL}/users/change-password`, {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Change password successful');
    } catch (error) {
      console.log('⚠️ Change password (expected error):', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 User API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testUserAPIs();