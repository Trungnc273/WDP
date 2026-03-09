const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  avatar: {
    type: String, // URL to avatar image
    default: '/images/placeholders/avatar-placeholder.svg'
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedUntil: {
    type: Date
  },
  violationCount: {
    type: Number,
    default: 0
  },
  // KYC (Know Your Customer) verification
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  kycDocuments: {
    idCardFront: String,
    idCardBack: String,
    selfie: String
  },
  kycSubmittedAt: {
    type: Date
  },
  kycApprovedAt: {
    type: Date
  },
  kycRejectedAt: {
    type: Date
  },
  kycRejectionReason: {
    type: String
  },
  // Seller rating
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
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

// Update the updatedAt timestamp before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create unique index on email
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
