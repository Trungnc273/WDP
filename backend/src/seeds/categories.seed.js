const mongoose = require('mongoose');
const Category = require('../modules/products/category.model');
const config = require('../config/env');

// Sample categories based on requirements - Updated for daily life
const categories = [
  {
    name: 'Sách',
    slug: 'books',
    description: 'Sách văn học, giáo khoa, kỹ năng, truyện tranh',
    icon: '📚',
    isActive: true
  },
  {
    name: 'Quần áo',
    slug: 'fashion',
    description: 'Thời trang nam, nữ, trẻ em, phụ kiện',
    icon: '👕',
    isActive: true
  },
  {
    name: 'Đồ điện tử',
    slug: 'electronics',
    description: 'Điện thoại, laptop, máy tính bảng, phụ kiện',
    icon: '📱',
    isActive: true
  },
  {
    name: 'Đồ gia dụng',
    slug: 'home',
    description: 'Nội thất, đồ dùng nhà bếp, trang trí',
    icon: '🏠',
    isActive: true
  },
  {
    name: 'Làm đẹp',
    slug: 'beauty',
    description: 'Mỹ phẩm, chăm sóc da, nước hoa',
    icon: '💄',
    isActive: true
  },
  {
    name: 'Thể thao',
    slug: 'sports',
    description: 'Dụng cụ tập luyện, xe đạp, giày thể thao',
    icon: '⚽',
    isActive: true
  },
  {
    name: 'Đồ chơi',
    slug: 'toys',
    description: 'Đồ chơi trẻ em, mô hình, board game',
    icon: '🧸',
    isActive: true
  },
  {
    name: 'Thú cưng',
    slug: 'pets',
    description: 'Thức ăn, phụ kiện, đồ dùng cho thú cưng',
    icon: '🐕',
    isActive: true
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB Connected for seeding categories');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert sample categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✓ Inserted ${insertedCategories.length} categories`);

    // Display inserted categories
    insertedCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    console.log('\n✓ Categories seeding completed successfully');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, categories };
