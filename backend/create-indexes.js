/**
 * Script to create database indexes
 * Run this with: node create-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/modules/products/product.model');
const Category = require('./src/modules/products/category.model');
const User = require('./src/modules/users/user.model');

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Creating indexes...\n');

    // Create Product indexes
    console.log('Creating Product indexes...');
    await Product.createIndexes();
    console.log('✓ Product indexes created');

    // Create Category indexes
    console.log('Creating Category indexes...');
    await Category.createIndexes();
    console.log('✓ Category indexes created');

    // Create User indexes
    console.log('Creating User indexes...');
    await User.createIndexes();
    console.log('✓ User indexes created');

    console.log('\n=== Verifying Indexes ===\n');

    // Verify Product indexes
    const productIndexes = await Product.collection.getIndexes();
    console.log('Product indexes:');
    Object.keys(productIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(productIndexes[indexName].key));
    });

    // Verify Category indexes
    const categoryIndexes = await Category.collection.getIndexes();
    console.log('\nCategory indexes:');
    Object.keys(categoryIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(categoryIndexes[indexName].key));
    });

    // Verify User indexes
    const userIndexes = await User.collection.getIndexes();
    console.log('\nUser indexes:');
    Object.keys(userIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(userIndexes[indexName].key));
    });

    console.log('\n✓ All indexes created successfully!');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
