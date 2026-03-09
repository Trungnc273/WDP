/**
 * Create test user for API testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    // Register a test user
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Test Buyer',
      email: 'buyer@test.com',
      password: 'password123',
      phone: '0123456789'
    });
    
    console.log('✅ Test user created successfully');
    console.log('User ID:', registerResponse.data.data.user._id);
    console.log('Email:', registerResponse.data.data.user.email);
    
  } catch (error) {
    if (error.response?.data?.message?.includes('đã tồn tại')) {
      console.log('✅ Test user already exists');
    } else {
      console.error('❌ Failed to create test user:', error.response?.data || error.message);
    }
  }
}

createTestUser();