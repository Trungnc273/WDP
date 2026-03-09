const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Thay YOUR_TOKEN bằng token thật từ localStorage
const TOKEN = 'YOUR_TOKEN_HERE';

async function testMyProducts() {
  try {
    console.log('Testing My Products API...\n');
    
    const response = await axios.get(`${BASE_URL}/api/products/my-products`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('\n✓ Products count:', response.data.data.products?.length || 0);
      console.log('Total:', response.data.data.total);
      console.log('Page:', response.data.data.page);
      console.log('Total Pages:', response.data.data.totalPages);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

console.log('NOTE: Thay YOUR_TOKEN_HERE bằng token thật từ localStorage của browser\n');
console.log('Cách lấy token:');
console.log('1. Mở browser DevTools (F12)');
console.log('2. Vào tab Application > Local Storage');
console.log('3. Copy giá trị của key "token"\n');

testMyProducts();
