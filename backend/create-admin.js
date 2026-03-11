const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/users/user.model');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@reflow.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123456', 10);

    // Create admin user
    const admin = new User({
      email: 'admin@reflow.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      phone: '0123456789',
      role: 'admin',
      isVerified: true,
      kycStatus: 'approved'
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log('Email: admin@reflow.com');
    console.log('Password: admin123456');
    console.log('Please change the password after first login');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();