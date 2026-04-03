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
  specificAddress: {
    type: String,
    trim: true
  },
  location: {
    city: String,
    district: String,
    ward: String,
    provinceCode: Number,
    districtCode: Number,
    wardCode: Number
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
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedUntil: {
    type: Date
  },
  suspendedReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  violationCount: {
    type: Number,
    default: 0
  },
  modBadReviewCount: {
    type: Number,
    default: 0
  },
  notifications: [{
    title: {
      type: String,
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['report_update', 'dispute_update', 'system'],
      default: 'report_update'
    },
    relatedReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
