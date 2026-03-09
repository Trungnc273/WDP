const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testConnection() {
  try {
    console.log('Testing API connection to:', API_URL);
    
    // Test if backend is running
    const response = await axios.get(`${API_URL}/api/products`, {
      timeout: 5000
    });
    
    console.log('✓ API connection successful!');
    console.log('Response status:', response.status);
    console.log('Products found:', response.data.data?.total || 0);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Cannot connect to backend. Make sure the backend server is running on port 5000');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('✗ Connection timeout. Backend is not responding');
    } else {
      console.error('✗ API connection failed:', error.message);
    }
    return false;
  }
}

testConnection();
