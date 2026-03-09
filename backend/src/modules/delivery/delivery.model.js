const mongoose = require('mongoose');

/**
 * Delivery Schema
 * Represents shipping/delivery information for an order
 */
const deliverySchema = new mongoose.Schema({
  // Order this delivery is for
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  
  // Shipping provider
  provider: {
    type: String,
    required: true,
    trim: true,
    enum: ['ghn', 'ghtk', 'viettel_post', 'vnpost', 'j&t', 'ninja_van', 'other']
  },
  
  // Tracking number
  trackingNumber: {
    type: String,
    trim: true
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'pending'
  },
  
  // Estimated delivery date
  estimatedDelivery: {
    type: Date
  },
  
  // Actual delivery date
  actualDelivery: {
    type: Date
  },
  
  // Shipping address
  shippingAddress: {
    recipientName: String,
    phone: String,
    address: String,
    city: String,
    district: String,
    ward: String
  },
  
  // Shipping notes
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Delivery updates/tracking history
  trackingHistory: [{
    status: String,
    location: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Failure reason (if delivery failed)
  failureReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes for efficient queries
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ trackingNumber: 1 });

// Virtual for checking if delivery is completed
deliverySchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered';
});

// Virtual for checking if delivery is in progress
deliverySchema.virtual('isInProgress').get(function() {
  return ['picked_up', 'in_transit', 'out_for_delivery'].includes(this.status);
});

// Method to add tracking update
deliverySchema.methods.addTrackingUpdate = function(status, location, description) {
  this.trackingHistory.push({
    status,
    location,
    description,
    timestamp: new Date()
  });
  
  // Update main status
  this.status = status;
  
  // Set actual delivery date if delivered
  if (status === 'delivered') {
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
