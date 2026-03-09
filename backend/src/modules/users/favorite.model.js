const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure user can't favorite same product twice
FavoriteSchema.index({ user: 1, product: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', FavoriteSchema);

module.exports = Favorite;
