/**
 * Verification script for seeded data
 * Run: node verify-seed-data.js
 */

const mongoose = require('mongoose');
const Category = require('./src/modules/products/category.model');
const Product = require('./src/modules/products/product.model');
const User = require('./src/modules/users/user.model');
const config = require('./src/config/env');

async function verifyData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB Connected for verification\n');

    // Verify categories
    const categories = await Category.find({});
    console.log(`=== Categories (${categories.length}) ===`);
    categories.forEach(cat => {
      console.log(`✓ ${cat.name} (${cat.slug}) - Active: ${cat.isActive}`);
    });

    // Verify products
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name slug')
      .populate('seller', 'fullName email');
    
    console.log(`\n=== Active Products (${products.length}) ===`);
    
    // Group by category
    const productsByCategory = {};
    products.forEach(product => {
      const catName = product.category.name;
      if (!productsByCategory[catName]) {
        productsByCategory[catName] = [];
      }
      productsByCategory[catName].push(product);
    });

    // Display products by category
    Object.keys(productsByCategory).forEach(catName => {
      console.log(`\n${catName}:`);
      productsByCategory[catName].forEach(p => {
        console.log(`  ✓ ${p.title}`);
        console.log(`    Price: ${p.price.toLocaleString('vi-VN')} VNĐ`);
        console.log(`    Condition: ${p.condition}`);
        console.log(`    Location: ${p.location.city}, ${p.location.district}`);
        console.log(`    Seller: ${p.seller.fullName} (${p.seller.email})`);
        console.log(`    Views: ${p.views}`);
      });
    });

    // Verify seller user
    const seller = await User.findOne({ email: 'seller@example.com' });
    console.log(`\n=== Seller User ===`);
    if (seller) {
      console.log(`✓ Email: ${seller.email}`);
      console.log(`✓ Full Name: ${seller.fullName}`);
      console.log(`✓ Role: ${seller.role}`);
      console.log(`✓ Verified: ${seller.isVerified}`);
    } else {
      console.log('✗ Seller user not found');
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`✓ Categories: ${categories.length}`);
    console.log(`✓ Active Products: ${products.length}`);
    console.log(`✓ Seller User: ${seller ? 'Found' : 'Not Found'}`);
    console.log('\n✓ Data verification completed successfully');

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error verifying data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

verifyData();
