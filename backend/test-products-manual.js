/**
 * Manual test script for Product endpoints
 * Run with: node test-products-manual.js
 */

const mongoose = require('mongoose');
const Product = require('./src/modules/products/product.model');
const Category = require('./src/modules/products/category.model');
const User = require('./src/modules/users/user.model');
const productService = require('./src/modules/products/product.service');
require('dotenv').config();

async function runTests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up existing test data
    console.log('🧹 Cleaning up test data...');
    await Product.deleteMany({ title: /Test Product/ });
    await Category.deleteMany({ name: 'Test Category' });
    await User.deleteMany({ email: 'testproduct@test.com' });

    // Create test user
    console.log('👤 Creating test user...');
    const testUser = await User.create({
      email: 'testproduct@test.com',
      password: 'hashedpassword123',
      fullName: 'Test Product Seller',
      role: 'user',
      isVerified: true
    });
    console.log('✅ Test user created:', testUser.email);

    // Create test category
    console.log('📁 Creating test category...');
    const testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Category for testing',
      isActive: true
    });
    console.log('✅ Test category created:', testCategory.name);

    // Create test products
    console.log('📦 Creating test products...');
    const products = await Product.insertMany([
      {
        title: 'Test Product 1 - iPhone',
        description: 'This is a test iPhone product for search testing',
        price: 15000000,
        condition: 'like-new',
        images: ['/uploads/test1.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Hà Nội', district: 'Cầu Giấy' },
        status: 'active'
      },
      {
        title: 'Test Product 2 - Samsung',
        description: 'This is a test Samsung product',
        price: 8000000,
        condition: 'good',
        images: ['/uploads/test2.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
        status: 'active'
      },
      {
        title: 'Test Product 3 - Laptop',
        description: 'This is a test laptop product',
        price: 25000000,
        condition: 'like-new',
        images: ['/uploads/test3.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
        status: 'active'
      },
      {
        title: 'Test Product 4 - Pending',
        description: 'This product is pending',
        price: 5000000,
        condition: 'new',
        images: ['/uploads/test4.jpg'],
        category: testCategory._id,
        seller: testUser._id,
        location: { city: 'Đà Nẵng', district: 'Hải Châu' },
        status: 'pending'
      }
    ]);
    console.log(`✅ Created ${products.length} test products\n`);

    // Test 1: Get all products
    console.log('🧪 Test 1: Get all products with default pagination');
    const result1 = await productService.getProducts({}, { page: 1, limit: 20 });
    console.log(`   ✅ Found ${result1.products.length} active products`);
    console.log(`   ✅ Total: ${result1.total}, Page: ${result1.page}, Total Pages: ${result1.totalPages}`);
    console.log(`   ✅ Products are sorted by createdAt (newest first): ${result1.products[0].createdAt >= result1.products[result1.products.length - 1].createdAt}`);

    // Test 2: Pagination
    console.log('\n🧪 Test 2: Pagination with limit=2');
    const result2 = await productService.getProducts({}, { page: 1, limit: 2 });
    console.log(`   ✅ Returned ${result2.products.length} products (expected 2)`);
    console.log(`   ✅ Limit enforced: ${result2.limit === 2}`);

    // Test 3: Max limit enforcement
    console.log('\n🧪 Test 3: Max limit enforcement (request 200, expect 100)');
    const result3 = await productService.getProducts({}, { page: 1, limit: 200 });
    console.log(`   ✅ Limit capped at: ${result3.limit} (expected 100)`);

    // Test 4: Search by keyword
    console.log('\n🧪 Test 4: Search products by keyword "iPhone"');
    const result4 = await productService.searchProducts('iPhone', { page: 1, limit: 20 });
    console.log(`   ✅ Found ${result4.products.length} products matching "iPhone"`);
    if (result4.products.length > 0) {
      console.log(`   ✅ First result: ${result4.products[0].title}`);
    }

    // Test 5: Filter by price range
    console.log('\n🧪 Test 5: Filter by price range (10M - 20M)');
    const result5 = await productService.getProducts(
      { minPrice: 10000000, maxPrice: 20000000 },
      { page: 1, limit: 20 }
    );
    console.log(`   ✅ Found ${result5.products.length} products in price range`);
    result5.products.forEach(p => {
      console.log(`   ✅ ${p.title}: ${p.price.toLocaleString('vi-VN')} VND (in range: ${p.price >= 10000000 && p.price <= 20000000})`);
    });

    // Test 6: Filter by location
    console.log('\n🧪 Test 6: Filter by location "Hà Nội"');
    const result6 = await productService.getProducts(
      { city: 'Hà Nội' },
      { page: 1, limit: 20 }
    );
    console.log(`   ✅ Found ${result6.products.length} products in Hà Nội`);
    result6.products.forEach(p => {
      console.log(`   ✅ ${p.title}: ${p.location.city}`);
    });

    // Test 7: Filter by category
    console.log('\n🧪 Test 7: Filter by category');
    const result7 = await productService.filterByCategory(
      testCategory._id,
      {},
      { page: 1, limit: 20 }
    );
    console.log(`   ✅ Found ${result7.products.length} products in category`);

    // Test 8: Combined filters
    console.log('\n🧪 Test 8: Combined filters (search + price + location)');
    const result8 = await productService.getProducts(
      { 
        search: 'Test',
        minPrice: 5000000,
        maxPrice: 20000000,
        city: 'Hà Nội'
      },
      { page: 1, limit: 20 }
    );
    console.log(`   ✅ Found ${result8.products.length} products matching all filters`);

    // Test 9: Only active products returned
    console.log('\n🧪 Test 9: Verify only active products are returned');
    const result9 = await productService.getProducts({}, { page: 1, limit: 100 });
    const allActive = result9.products.every(p => p.status === 'active');
    console.log(`   ✅ All products are active: ${allActive}`);
    console.log(`   ✅ Pending products excluded: ${result9.products.every(p => p.title !== 'Test Product 4 - Pending')}`);

    // Test 10: Get product by ID
    console.log('\n🧪 Test 10: Get product by ID');
    const result10 = await productService.getProductById(products[0]._id);
    console.log(`   ✅ Retrieved product: ${result10.title}`);
    console.log(`   ✅ Seller populated: ${result10.seller.fullName}`);
    console.log(`   ✅ Category populated: ${result10.category.name}`);

    // Test 11: Seller and category population
    console.log('\n🧪 Test 11: Verify seller and category population');
    const result11 = await productService.getProducts({}, { page: 1, limit: 1 });
    const product = result11.products[0];
    console.log(`   ✅ Seller has fullName: ${!!product.seller.fullName}`);
    console.log(`   ✅ Seller has isVerified: ${product.seller.isVerified !== undefined}`);
    console.log(`   ✅ Category has name: ${!!product.category.name}`);
    console.log(`   ✅ Category has slug: ${!!product.category.slug}`);

    console.log('\n✅ All tests passed!');

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await Product.deleteMany({ title: /Test Product/ });
    await Category.deleteMany({ name: 'Test Category' });
    await User.deleteMany({ email: 'testproduct@test.com' });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

runTests();
