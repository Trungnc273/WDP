const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  location: {
    city: String,
    district: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'sold', 'rejected', 'expired', 'hidden', 'deleted'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // VIP/Featured promotion
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  // Moderation
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now, moderator feature later
  },
  rejectionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Validation: At least one image required
ProductSchema.path('images').validate(function(value) {
  return value && value.length >= 1;
}, 'At least one image is required');

// Update updatedAt on save
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Text index for search functionality (Req 14)
ProductSchema.index({ title: 'text', description: 'text' });

// Compound index on status and createdAt (Req 14)
ProductSchema.index({ status: 1, createdAt: -1 });

// Index on category field (Req 14)
ProductSchema.index({ category: 1 });

// Index on price field (Req 14)
ProductSchema.index({ price: 1 });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
