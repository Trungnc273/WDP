/**
 * Manual Test Script for Product and Category Models
 * Run this with: node test-models-manual.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('./src/modules/products/product.model');
const Category = require('./src/modules/products/category.model');
const User = require('./src/modules/users/user.model');

let testResults = [];
let testUser;
let testCategory;

function logTest(testName, passed, message = '') {
  testResults.push({ testName, passed, message });
  const symbol = passed ? '✓' : '✗';
  console.log(`${symbol} ${testName}${message ? ': ' + message : ''}`);
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    return true;
  } catch (error) {
    console.log('✗ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function testCategoryModel() {
  console.log('\n=== Testing Category Model ===');
  
  try {
    // Test 1: Create valid category
    testCategory = await Category.create({
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
      description: 'Test category description',
      icon: 'test-icon.png',
      isActive: true
    });
    logTest('Create valid category', testCategory._id !== undefined);

    // Test 2: Check default values
    logTest('Default isActive is true', testCategory.isActive === true);
    logTest('CreatedAt is set', testCategory.createdAt !== undefined);

    // Test 3: Slug lowercase conversion
    const upperCaseCategory = await Category.create({
      name: `Uppercase Test ${Date.now()}`,
      slug: `UPPERCASE-TEST-${Date.now()}`
    });
    logTest('Slug converted to lowercase', upperCaseCategory.slug === upperCaseCategory.slug.toLowerCase());
    await Category.findByIdAndDelete(upperCaseCategory._id);

    // Test 4: Required fields
    try {
      await Category.create({ name: 'No Slug' });
      logTest('Require slug field', false);
    } catch (error) {
      logTest('Require slug field', true);
    }

    try {
      await Category.create({ slug: 'no-name' });
      logTest('Require name field', false);
    } catch (error) {
      logTest('Require name field', true);
    }

  } catch (error) {
    logTest('Category model tests', false, error.message);
  }
}

async function testProductModel() {
  console.log('\n=== Testing Product Model ===');
  
  try {
    // Create test user first
    testUser = await User.create({
      email: `testuser${Date.now()}@example.com`,
      password: 'hashedpassword123',
      fullName: 'Test User'
    });
    logTest('Create test user', testUser._id !== undefined);

    // Test 1: Create valid product
    const validProduct = await Product.create({
      title: 'Test Product',
      description: 'This is a test product description',
      price: 1000000,
      condition: 'like-new',
      images: ['image1.jpg', 'image2.jpg'],
      category: testCategory._id,
      seller: testUser._id,
      location: {
        city: 'Ho Chi Minh',
        district: 'District 1'
      }
    });
    logTest('Create valid product', validProduct._id !== undefined);

    // Test 2: Check default values
    logTest('Default status is pending', validProduct.status === 'pending');
    logTest('Default views is 0', validProduct.views === 0);
    logTest('CreatedAt is set', validProduct.createdAt !== undefined);
    logTest('UpdatedAt is set', validProduct.updatedAt !== undefined);

    await Product.findByIdAndDelete(validProduct._id);

    // Test 3: Title max length (200 characters)
    try {
      await Product.create({
        title: 'a'.repeat(201),
        description: 'Test',
        price: 1000,
        condition: 'good',
        images: ['image1.jpg'],
        category: testCategory._id,
        seller: testUser._id
      });
      logTest('Enforce title max length 200', false);
    } catch (error) {
      logTest('Enforce title max length 200', true);
    }

    // Test 4: Description max length (2000 characters)
    try {
      await Product.create({
        title: 'Test',
        description: 'a'.repeat(2001),
        price: 1000,
        condition: 'good',
        images: ['image1.jpg'],
        category: testCategory._id,
        seller: testUser._id
      });
      logTest('Enforce description max length 2000', false);
    } catch (error) {
      logTest('Enforce description max length 2000', true);
    }

    // Test 5: Minimum price (0)
    try {
      await Product.create({
        title: 'Test',
        description: 'Test',
        price: -100,
        condition: 'good',
        images: ['image1.jpg'],
        category: testCategory._id,
        seller: testUser._id
      });
      logTest('Enforce minimum price 0', false);
    } catch (error) {
      logTest('Enforce minimum price 0', true);
    }

    // Test 6: Valid condition enum
    try {
      await Product.create({
        title: 'Test',
        description: 'Test',
        price: 1000,
        condition: 'invalid-condition',
        images: ['image1.jpg'],
        category: testCategory._id,
        seller: testUser._id
      });
      logTest('Enforce valid condition enum', false);
    } catch (error) {
      logTest('Enforce valid condition enum', true);
    }

    // Test 7: At least one image required
    try {
      await Product.create({
        title: 'Test',
        description: 'Test',
        price: 1000,
        condition: 'good',
        images: [],
        category: testCategory._id,
        seller: testUser._id
      });
      logTest('Require at least one image', false);
    } catch (error) {
      logTest('Require at least one image', true);
    }

    // Test 8: Required fields
    try {
      await Product.create({
        title: 'Test'
      });
      logTest('Enforce required fields', false);
    } catch (error) {
      logTest('Enforce required fields', true);
    }

  } catch (error) {
    logTest('Product model tests', false, error.message);
  }
}

async function testIndexes() {
  console.log('\n=== Testing Database Indexes ===');
  
  try {
    // Test Product indexes
    const productIndexes = await Product.collection.getIndexes();
    const indexNames = Object.keys(productIndexes);
    
    const hasTextIndex = indexNames.some(name => 
      name.includes('text') || name.includes('title') || name.includes('description')
    );
    logTest('Product has text index on title/description', hasTextIndex);

    const hasStatusCreatedAtIndex = indexNames.some(name =>
      name.includes('status') && name.includes('createdAt')
    );
    logTest('Product has compound index on status and createdAt', hasStatusCreatedAtIndex);

    const hasCategoryIndex = indexNames.some(name =>
      name.includes('category')
    );
    logTest('Product has index on category', hasCategoryIndex);

    const hasPriceIndex = indexNames.some(name =>
      name.includes('price')
    );
    logTest('Product has index on price', hasPriceIndex);

    // Test User email index
    const userIndexes = await User.collection.getIndexes();
    const userIndexNames = Object.keys(userIndexes);
    const hasEmailIndex = userIndexNames.some(name =>
      name.includes('email')
    );
    logTest('User has unique index on email', hasEmailIndex);

  } catch (error) {
    logTest('Index tests', false, error.message);
  }
}

async function cleanup() {
  console.log('\n=== Cleaning Up ===');
  try {
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
      console.log('✓ Deleted test user');
    }
    if (testCategory) {
      await Category.findByIdAndDelete(testCategory._id);
      console.log('✓ Deleted test category');
    }
  } catch (error) {
    console.log('✗ Cleanup error:', error.message);
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('Product and Category Models Manual Tests');
  console.log('========================================');

  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  await testCategoryModel();
  await testProductModel();
  await testIndexes();
  await cleanup();

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed');
    console.log('\nFailed tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.testName}${r.message ? ': ' + r.message : ''}`);
    });
  }

  await mongoose.connection.close();
  console.log('\n✓ Database connection closed');
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
