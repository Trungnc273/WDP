const { seedCategories } = require('./src/seeds/categories.seed');
const { seedProducts } = require('./src/seeds/products.seed');

async function seedAll() {
  console.log('Starting database seeding...\n');
  
  try {
    // Seed categories first
    console.log('=== Seeding Categories ===');
    await seedCategories();
    
    // Wait a bit before seeding products
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Seed products
    console.log('\n=== Seeding Products ===');
    await seedProducts();
    
    console.log('\n✓ All seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedAll();
