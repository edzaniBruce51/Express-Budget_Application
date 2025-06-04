const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BudgetSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for budget's URL.
BudgetSchema.virtual('url').get(function () {
  return `/budget/budget/${this._id}`;
});

// Virtual for budget progress (requires expenses to be calculated)
BudgetSchema.virtual('progress').get(function () {
  // This will be calculated in the controller with aggregation
  return 0;
});

// Virtual for remaining amount
BudgetSchema.virtual('remaining').get(function () {
  // This will be calculated in the controller with aggregation
  return this.amount;
});

// Virtual for days remaining
BudgetSchema.virtual('days_remaining').get(function () {
  const today = new Date();
  const endDate = new Date(this.end_date);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Index for efficient queries
BudgetSchema.index({ user: 1, is_active: 1 });
BudgetSchema.index({ user: 1, category: 1 });

// Export model
module.exports = mongoose.model('Budget', BudgetSchema);
