const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 1,
    maxLength: 50
  },
  description: {
    type: String,
    trim: true,
    maxLength: 200
  },
  color: {
    type: String,
    default: '#007bff',
    match: /^#[0-9A-F]{6}$/i
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for category's URL
CategorySchema.virtual('url').get(function () {
  return `/budget/category/${this._id}`;
});

// Index for efficient queries
CategorySchema.index({ user: 1, name: 1 });

// Export model
module.exports = mongoose.model('Category', CategorySchema);
