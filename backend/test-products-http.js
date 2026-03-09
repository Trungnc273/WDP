/**
 * HTTP endpoint test for Product API
 * This tests the actual HTTP endpoints
 * Run with: node test-products-http.js
 */

const mongoose = require('mongoose');
const Product = require('./src/modules/products/product.model');
const Category = require('./src/modules/products/category.model');
const User = require('./src/modules/users/user.model');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const productRoutes = require('./src/modules/products/product.route');
const { errorHandler, notFoundHandler } = require('./src/common/middlewares/error.middleware');

async function setupTestServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}

async function makeRequest(app, method, path) {
  return new Promise((resolve, reject) => {
    const req = require('http').request(
      {
        hostname: 'localhost',
        port: 5001,
        path: path,
        method: method
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  let server;
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    console.log('🧹 Setting up test data...');
    await Product.deleteMany({ title: /HTTP Test Product/ });
    await Category.deleteMany({ name: 'HTTP Test Category' });
    await User.deleteMany({ email: 'httptest@test.com' });

    const testUser = await User.create({
      email: 'httptest@test.com',
      password: 'hashedpassword123',
      fullName: 'HTTP Test User',
      role: 'user',
      isVerified: true
    });

    const testCategory = await Category.create({
      name: 'HTTP Test Category',
      slug: 'http-test-category',
      description: 'Category for HTTP testing',
      isActive: true
    });

    const products = await Product.insertMany([
      {
        title: 'HTTP Test Product 1',
        description: 'First test product',
        price: 10000000,
        condition: 'like-new',
        images: ['/uploads/http1.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Hà Nội', district: 'Cầu Giấy' },
        status: 'active'
      },
      {
        title: 'HTTP Test Product 2',
        description: 'Second test product',
        price: 20000000,
        condition: 'good',
        images: ['/uploads/http2.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
        status: 'active'
      }
    ]);
    console.log('✅ Test data created\n');

    // Start server
    console.log('🚀 Starting test server...');
    const app = await setupTestServer();
    server = app.listen(5001, () => {
      console.log('✅ Test server running on port 5001\n');
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: GET /api/products
    console.log('🧪 Test 1: GET /api/products');
    const response1 = await makeRequest(app, 'GET', '/api/products');
    console.log(`   Status: ${response1.status}`);
    console.log(`   Success: ${response1.data.success}`);
    console.log(`   Products count: ${response1.data.data.products.length}`);
    console.log(`   ✅ ${response1.status === 200 ? 'PASSED' : 'FAILED'}`);

    // Test 2: GET /api/products with pagination
    console.log('\n🧪 Test 2: GET /api/products?page=1&limit=1');
    const response2 = await makeRequest(app, 'GET', '/api/products?page=1&limit=1');
    console.log(`   Status: ${response2.status}`);
    console.log(`   Products count: ${response2.data.data.products.length}`);
    console.log(`   ✅ ${response2.status === 200 && response2.data.data.products.length === 1 ? 'PASSED' : 'FAILED'}`);

    // Test 3: GET /api/products with price filter
    console.log('\n🧪 Test 3: GET /api/products?minPrice=15000000');
    const response3 = await makeRequest(app, 'GET', '/api/products?minPrice=15000000');
    console.log(`   Status: ${response3.status}`);
    console.log(`   Products count: ${response3.data.data.products.length}`);
    console.log(`   ✅ ${response3.status === 200 ? 'PASSED' : 'FAILED'}`);

    // Test 4: GET /api/products/:id
    console.log('\n🧪 Test 4: GET /api/products/:id');
    const response4 = await makeRequest(app, 'GET', `/api/products/${products[0]._id}`);
    console.log(`   Status: ${response4.status}`);
    console.log(`   Product title: ${response4.data.data.title}`);
    console.log(`   ✅ ${response4.status === 200 ? 'PASSED' : 'FAILED'}`);

    // Test 5: GET /api/products/search
    console.log('\n🧪 Test 5: GET /api/products/search?q=HTTP');
    const response5 = await makeRequest(app, 'GET', '/api/products/search?q=HTTP');
    console.log(`   Status: ${response5.status}`);
    console.log(`   Products count: ${response5.data.data.products.length}`);
    console.log(`   ✅ ${response5.status === 200 ? 'PASSED' : 'FAILED'}`);

    console.log('\n✅ All HTTP tests completed!');

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Product.deleteMany({ title: /HTTP Test Product/ });
    await Category.deleteMany({ name: 'HTTP Test Category' });
    await User.deleteMany({ email: 'httptest@test.com' });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    if (server) {
      server.close();
      console.log('🛑 Server stopped');
    }
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

runTests();
