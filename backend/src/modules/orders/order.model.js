const mongoose = require('mongoose');

function generateOrderCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OD';
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Order Schema
 * Represents a formal order created after seller accepts purchase request
 * Includes escrow payment tracking and order lifecycle
 */
const orderSchema = new mongoose.Schema({
  // Public order code shown to users
  orderCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    default: generateOrderCode
  },

  // Reference to purchase request that created this order
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRequest',
    required: false
  },
  
  // Buyer information
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Seller information
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Product information
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Pricing
  agreedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  platformFee: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.agreedAmount * 0.05; // 5% platform fee
    }
  },
  
  totalToPay: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.agreedAmount + this.platformFee;
    }
  },
  
  // Order status
  status: {
    type: String,
    enum: ['awaiting_seller_confirmation', 'awaiting_payment', 'paid', 'shipped', 'completed', 'cancelled', 'disputed'],
    default: 'awaiting_seller_confirmation'
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  
  // Seller confirmation
  confirmedBySeller: {
    type: Boolean,
    default: false
  },
  
  confirmedBySellerAt: {
    type: Date
  },
  
  // Timestamps for order lifecycle
  paidAt: {
    type: Date
  },
  
  shippedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  cancelledAt: {
    type: Date
  },
  
  // Cancellation reason
  cancellationReason: {
    type: String
  },
  
  // Shipping information
  trackingNumber: {
    type: String
  },
  
  shippingProvider: {
    type: String
  },
  
  estimatedDelivery: {
    type: Date
  },

  shippingRecipientName: {
    type: String,
    trim: true
  },

  shippingPhone: {
    type: String,
    trim: true
  },

  shippingAddress: {
    type: String,
    trim: true
  },
  
  // Escrow hold reference
  escrowHoldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EscrowHold'
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, shippedAt: 1 }); // For auto-release cron job

orderSchema.pre('validate', async function(next) {
  if (this.orderCode) {
    return next();
  }

  for (let i = 0; i < 5; i += 1) {
    const candidate = generateOrderCode();
    const existed = await this.constructor.exists({ orderCode: candidate });
    if (!existed) {
      this.orderCode = candidate;
      return next();
    }
  }

  return next(new Error('Không thể tạo mã đơn hàng duy nhất, vui lòng thử lại'));
});

// Virtual for checking if order can be paid
orderSchema.virtual('canBePaid').get(function() {
  return this.status === 'awaiting_payment' && this.paymentStatus === 'unpaid';
});

// Virtual for checking if order can be shipped
orderSchema.virtual('canBeShipped').get(function() {
  return this.status === 'paid' && this.paymentStatus === 'paid';
});

// Virtual for checking if order can be completed
orderSchema.virtual('canBeCompleted').get(function() {
  return this.status === 'shipped';
});

// Virtual for checking if order is eligible for auto-release
orderSchema.virtual('isEligibleForAutoRelease').get(function() {
  if (this.status !== 'shipped' || !this.shippedAt) {
    return false;
  }
  const daysSinceShipped = (Date.now() - this.shippedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceShipped >= 10;
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
