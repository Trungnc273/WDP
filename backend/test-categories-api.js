const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCategoriesAPI() {
  try {
    console.log('Testing Categories API...\n');
    
    const response = await axios.get(`${BASE_URL}/api/categories`);
    
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && Array.isArray(response.data.data)) {
      console.log('\n✓ Categories count:', response.data.data.length);
      console.log('\nCategories list:');
      response.data.data.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat.slug}) - ID: ${cat._id}`);
      });
    } else {
      console.log('\n✗ No categories data found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCategoriesAPI();
