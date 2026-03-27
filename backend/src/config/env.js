require('dotenv').config();

const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
  chat: {
    // Uu tien khoa rieng cho chat; fallback JWT_SECRET de khong vo moi truong cu.
    encryptionKey: process.env.CHAT_ENCRYPTION_KEY || process.env.JWT_SECRET,
  },
  server: {
    port: process.env.PORT || 5000,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
  },
};

// Kiem tra cac bien moi truong bat buoc
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = config;
