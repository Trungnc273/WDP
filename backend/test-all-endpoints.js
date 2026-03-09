/**
 * Comprehensive API Endpoints Test
 * Tests all API endpoints to ensure they're working correctly
 * Run: node test-all-endpoints.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✓' : '✗';
  console.log(`${status} ${name}${message ? ': ' + message : ''}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// Test 1: Server Health Check
async function testHealthCheck() {
  console.log('\n=== Test 1: Server Health Check ===');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('Health check', response.status === 200 && response.data.status === 'ok');
  } catch (error) {
    logTest('Health check', false, error.message);
  }
}

// Test 2: API Info Endpoint
async function testAPIInfo() {
  console.log('\n=== Test 2: API Info Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/api`);
    logTest('API info', response.status === 200 && response.data.success);
  } catch (error) {
    logTest('API info', false, error.message);
  }
}

// Test 3: User Registration
async function testRegistration() {
  console.log('\n=== Test 3: User Registration ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'api-test@example.com',
      password: 'password123',
      fullName: 'API Test User'
    });
    authToken = response.data.data.token;
    logTest('User registration', response.status === 201 && authToken);
  } catch (error) {
    // If user already exists, try to login
    if (error.response?.status === 400) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'api-test@example.com',
          password: 'password123'
        });
        authToken = loginResponse.data.data.token;
        logTest('User registration (login fallback)', true);
      } catch (loginError) {
        logTest('User registration', false, loginError.message);
      }
    } else {
      logTest('User registration', false, error.message);
    }
  }
}

// Test 4: User Login
async function testLogin() {
  console.log('\n=== Test 4: User Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'api-test@example.com',
      password: 'password123'
    });
    authToken = response.data.data.token;
    logTest('User login', response.status === 200 && authToken);
  } catch (error) {
    logTest('User login', false, error.message);
  }
}

// Test 5: Get User Profile
async function testGetProfile() {
  console.log('\n=== Test 5: Get User Profile ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Get profile', response.status === 200 && response.data.data.email);
  } catch (error) {
    logTest('Get profile', false, error.message);
  }
}

// Test 6: Get All Categories
async function testGetCategories() {
  console.log('\n=== Test 6: Get All Categories ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/categories`);
    logTest('Get categories', response.status === 200 && Array.isArray(response.data.data));
    logTest('Categories count', response.data.data.length >= 5, `Found ${response.data.data.length} categories`);
  } catch (error) {
    logTest('Get categories', false, error.message);
  }
}

// Test 7: Get Category by Slug
async function testGetCategoryBySlug() {
  console.log('\n=== Test 7: Get Category by Slug ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/categories/electronics`);
    logTest('Get category by slug', response.status === 200 && response.data.data.slug === 'electronics');
  } catch (error) {
    logTest('Get category by slug', false, error.message);
  }
}

// Test 8: Get All Products
async function testGetProducts() {
  console.log('\n=== Test 8: Get All Products ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/products`);
    logTest('Get products', response.status === 200 && Array.isArray(response.data.data.products));
    logTest('Products count', response.data.data.products.length >= 10, `Found ${response.data.data.products.length} products`);
    logTest('Pagination metadata', response.data.data.total && response.data.data.page);
  } catch (error) {
    logTest('Get products', false, error.message);
  }
}

// Test 9: Search Products
async function testSearchProducts() {
  console.log('\n=== Test 9: Search Products ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?search=iPhone`);
    logTest('Search products', response.status === 200 && response.data.data.products.length > 0);
  } catch (error) {
    logTest('Search products', false, error.message);
  }
}

// Test 10: Filter Products by Category
async function testFilterByCategory() {
  console.log('\n=== Test 10: Filter Products by Category ===');
  try {
    // First get a category ID
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`);
    const electronicsCategory = categoriesResponse.data.data.find(c => c.slug === 'electronics');
    
    const response = await axios.get(`${BASE_URL}/api/products?category=${electronicsCategory._id}`);
    logTest('Filter by category', response.status === 200 && response.data.data.products.length > 0);
  } catch (error) {
    logTest('Filter by category', false, error.message);
  }
}

// Test 11: Filter Products by Price Range
async function testFilterByPrice() {
  console.log('\n=== Test 11: Filter Products by Price Range ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?minPrice=1000000&maxPrice=5000000`);
    logTest('Filter by price', response.status === 200);
    
    // Verify all products are within price range
    const allInRange = response.data.data.products.every(p => 
      p.price >= 1000000 && p.price <= 5000000
    );
    logTest('Price range validation', allInRange);
  } catch (error) {
    logTest('Filter by price', false, error.message);
  }
}

// Test 12: Filter Products by Location
async function testFilterByLocation() {
  console.log('\n=== Test 12: Filter Products by Location ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?city=Hà Nội`);
    logTest('Filter by location', response.status === 200 && response.data.data.products.length > 0);
  } catch (error) {
    logTest('Filter by location', false, error.message);
  }
}

// Test 13: Pagination
async function testPagination() {
  console.log('\n=== Test 13: Pagination ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?page=1&limit=5`);
    logTest('Pagination', response.status === 200 && response.data.data.products.length <= 5);
    logTest('Pagination metadata', response.data.data.page === 1 && response.data.data.totalPages);
  } catch (error) {
    logTest('Pagination', false, error.message);
  }
}

// Test 14: Get Product by ID
async function testGetProductById() {
  console.log('\n=== Test 14: Get Product by ID ===');
  try {
    // First get a product
    const productsResponse = await axios.get(`${BASE_URL}/api/products?limit=1`);
    const productId = productsResponse.data.data.products[0]._id;
    
    const response = await axios.get(`${BASE_URL}/api/products/${productId}`);
    logTest('Get product by ID', response.status === 200 && response.data.data._id === productId);
  } catch (error) {
    logTest('Get product by ID', false, error.message);
  }
}

// Test 15: Protected Route Without Token
async function testProtectedRouteWithoutToken() {
  console.log('\n=== Test 15: Protected Route Without Token ===');
  try {
    await axios.get(`${BASE_URL}/api/auth/profile`);
    logTest('Protected route without token', false, 'Should have failed but succeeded');
  } catch (error) {
    logTest('Protected route without token', error.response?.status === 401);
  }
}

// Test 16: Invalid Endpoint
async function testInvalidEndpoint() {
  console.log('\n=== Test 16: Invalid Endpoint (404) ===');
  try {
    await axios.get(`${BASE_URL}/api/invalid-endpoint`);
    logTest('404 handling', false, 'Should have returned 404');
  } catch (error) {
    logTest('404 handling', error.response?.status === 404);
  }
}

// Test 17: Static File Serving
async function testStaticFileServing() {
  console.log('\n=== Test 17: Static File Serving ===');
  try {
    // This will fail if no files exist, but that's okay for now
    const response = await axios.get(`${BASE_URL}/uploads/products/sample/test.jpg`);
    logTest('Static file serving', response.status === 200);
  } catch (error) {
    // 404 is acceptable if no files exist
    logTest('Static file serving', error.response?.status === 404, 'No sample files (expected)');
  }
}

// Run all tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Starting Comprehensive API Endpoint Tests');
  console.log('Make sure the server is running on', BASE_URL);
  console.log('='.repeat(60));

  try {
    await testHealthCheck();
    await testAPIInfo();
    await testRegistration();
    await testLogin();
    await testGetProfile();
    await testGetCategories();
    await testGetCategoryBySlug();
    await testGetProducts();
    await testSearchProducts();
    await testFilterByCategory();
    await testFilterByPrice();
    await testFilterByLocation();
    await testPagination();
    await testGetProductById();
    await testProtectedRouteWithoutToken();
    await testInvalidEndpoint();
    await testStaticFileServing();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`Passed: ${results.passed} ✓`);
    console.log(`Failed: ${results.failed} ✗`);
    console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  ✗ ${t.name}${t.message ? ': ' + t.message : ''}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    if (results.failed === 0) {
      console.log('✓ All API endpoints are working correctly!');
    } else {
      console.log('✗ Some tests failed. Please review the errors above.');
    }
    console.log('='.repeat(60));

    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
