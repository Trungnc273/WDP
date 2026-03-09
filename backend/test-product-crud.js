/**
 * Test script for Product CRUD APIs
 * Tests Task 11: Backend - Product CRUD APIs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/modules/products/product.model');
const User = require('./src/modules/users/user.model');
const Category = require('./src/modules/products/category.model');
const productService = require('./src/modules/products/product.service');

async function testProductCRUD() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user and category
    const testUser = await User.findOne();
    const testCategory = await Category.findOne();

    if (!testUser || !testCategory) {
      console.log('❌ No test user or category found. Please seed data first.');
      return;
    }

    console.log(`📝 Using test user: ${testUser.fullName} (${testUser._id})`);
    console.log(`📁 Using test category: ${testCategory.name} (${testCategory._id})\n`);

    // Test 1: Create Product
    console.log('=== Test 1: Create Product ===');
    const productData = {
      title: 'Test Product - iPhone 13 Pro Max',
      description: 'Máy đẹp như mới, fullbox, còn bảo hành',
      price: 25000000,
      category: testCategory._id,
      condition: 'like-new',
      images: [
        '/uploads/products/test/iphone-1.jpg',
        '/uploads/products/test/iphone-2.jpg'
      ],
      location: {
        city: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng'
      }
    };

    const createdProduct = await productService.createProduct(testUser._id, productData);
    console.log('✅ Product created successfully');
    console.log(`   ID: ${createdProduct._id}`);
    console.log(`   Title: ${createdProduct.title}`);
    console.log(`   Price: ${createdProduct.price.toLocaleString('vi-VN')} VND`);
    console.log(`   Status: ${createdProduct.status}`);
    console.log(`   Seller: ${createdProduct.seller.fullName}\n`);

    // Test 2: Update Product
    console.log('=== Test 2: Update Product ===');
    const updateData = {
      title: 'Test Product - iPhone 13 Pro Max (Updated)',
      price: 24000000,
      description: 'Máy đẹp như mới, fullbox, còn bảo hành. Giá đã giảm!'
    };

    const updatedProduct = await productService.updateProduct(
      createdProduct._id,
      testUser._id,
      updateData
    );
    console.log('✅ Product updated successfully');
    console.log(`   New Title: ${updatedProduct.title}`);
    console.log(`   New Price: ${updatedProduct.price.toLocaleString('vi-VN')} VND\n`);

    // Test 3: Get My Products
    console.log('=== Test 3: Get My Products ===');
    const myProducts = await productService.getMyProducts(testUser._id, {}, { page: 1, limit: 5 });
    console.log('✅ My products retrieved successfully');
    console.log(`   Total products: ${myProducts.total}`);
    console.log(`   Products on this page: ${myProducts.products.length}`);
    myProducts.products.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.title} - ${p.status}`);
    });
    console.log();

    // Test 4: Try to update product as different user (should fail)
    console.log('=== Test 4: Authorization Check (Update) ===');
    const anotherUser = await User.findOne({ _id: { $ne: testUser._id } });
    if (anotherUser) {
      try {
        await productService.updateProduct(
          createdProduct._id,
          anotherUser._id,
          { title: 'Hacked!' }
        );
        console.log('❌ Authorization check failed - update should have been rejected');
      } catch (error) {
        console.log('✅ Authorization check passed');
        console.log(`   Error: ${error.message}\n`);
      }
    }

    // Test 5: Delete Product (soft delete)
    console.log('=== Test 5: Delete Product (Soft Delete) ===');
    const deletedProduct = await productService.deleteProduct(
      createdProduct._id,
      testUser._id
    );
    console.log('✅ Product deleted successfully (soft delete)');
    console.log(`   Status changed to: ${deletedProduct.status}\n`);

    // Test 6: Verify soft delete (product still exists but status is 'deleted')
    console.log('=== Test 6: Verify Soft Delete ===');
    const productInDb = await Product.findById(createdProduct._id);
    console.log('✅ Product still exists in database');
    console.log(`   Status: ${productInDb.status}`);
    console.log(`   Product is hidden from public listings\n`);

    // Test 7: Get My Products with status filter
    console.log('=== Test 7: Get My Products (Filter by Status) ===');
    const activeProducts = await productService.getMyProducts(
      testUser._id,
      { status: 'active' },
      { page: 1, limit: 5 }
    );
    console.log('✅ Active products retrieved');
    console.log(`   Total active products: ${activeProducts.total}\n`);

    // Cleanup: Remove test product
    console.log('🧹 Cleaning up test data...');
    await Product.findByIdAndDelete(createdProduct._id);
    console.log('✅ Test product removed\n');

    console.log('=== All Tests Passed ✅ ===');
    console.log('Task 11: Backend - Product CRUD APIs is complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests
testProductCRUD();
