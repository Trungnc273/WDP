const mongoose = require('mongoose');
const config = require('./src/config/env');
const Product = require('./src/modules/products/product.model');
const Message = require('./src/modules/chat/message.model');
const { encryptChatContent } = require('./src/common/utils/chat-crypto.util');

// Dong bo category chinh + categories phu thanh 1 mang khong trung lap.
function normalizeCategoryList(primaryCategory, categories) {
  if (!primaryCategory) return null;

  const merged = [];
  const seen = new Set();

  const register = (value) => {
    if (!value) return;
    const id = value.toString();
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(value);
  };

  register(primaryCategory);
  if (Array.isArray(categories)) {
    categories.forEach(register);
  }

  return merged;
}

async function syncProductCategories() {
  // Chi xu ly cac san pham da co category chinh.
  const products = await Product.find({ category: { $exists: true, $ne: null } })
    .select('_id category categories')
    .lean();

  const operations = [];

  for (const product of products) {
    const normalized = normalizeCategoryList(product.category, product.categories);
    if (!normalized) continue;

    const current = Array.isArray(product.categories)
      ? product.categories.map((item) => item.toString())
      : [];
    const next = normalized.map((item) => item.toString());

    const isSameLength = current.length === next.length;
    const isSameOrder = isSameLength && current.every((value, idx) => value === next[idx]);

    if (!isSameOrder) {
      // Ghi lai danh sach categories da chuan hoa.
      operations.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { categories: normalized } }
        }
      });
    }
  }

  if (!operations.length) {
    return { matched: products.length, modified: 0 };
  }

  const result = await Product.bulkWrite(operations, { ordered: false });
  return {
    matched: products.length,
    modified: result.modifiedCount || 0
  };
}

async function syncChatEncryption() {
  // Ma hoa cac tin nhan plaintext con ton tai trong DB.
  const messages = await Message.find({
    content: { $exists: true, $type: 'string', $not: /^enc:v1:/ }
  })
    .select('_id content')
    .lean();

  const operations = [];

  for (const message of messages) {
    const raw = String(message.content || '');
    if (raw.startsWith('enc:v1:')) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: message._id },
        update: { $set: { content: encryptChatContent(raw) } }
      }
    });
  }

  if (!operations.length) {
    return { matched: 0, modified: 0 };
  }

  const result = await Message.bulkWrite(operations, { ordered: false });
  return {
    matched: messages.length,
    modified: result.modifiedCount || 0
  };
}

async function run() {
  // Chay dong thoi 2 nhiem vu de giam thoi gian downtime.
  await mongoose.connect(config.mongodb.uri);

  try {
    const [productSync, chatSync] = await Promise.all([
      syncProductCategories(),
      syncChatEncryption()
    ]);

    console.log('=== Migration summary ===');
    console.log('Product categories:', productSync);
    console.log('Chat encryption:', chatSync);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
