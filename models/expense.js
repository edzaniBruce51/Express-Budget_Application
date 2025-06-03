const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
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
  notes: {
    type: String,
    trim: true,
    maxLength: 500
  },
  payment_method: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  receipt_url: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for expense's URL
ExpenseSchema.virtual('url').get(function () {
  return `/budget/expense/${this._id}`;
});

// Virtual for formatted date
ExpenseSchema.virtual('date_formatted').get(function () {
  return this.date.toLocaleDateString();
});

// Virtual for formatted amount
ExpenseSchema.virtual('amount_formatted').get(function () {
  return `$${this.amount.toFixed(2)}`;
});

// Index for efficient queries
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });
ExpenseSchema.index({ user: 1, date: -1, category: 1 });

// Static method to get expenses by date range
ExpenseSchema.statics.getByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('category').sort({ date: -1 });
};

// Static method to get total by category
ExpenseSchema.statics.getTotalByCategory = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Export model
module.exports = mongoose.model('Expense', ExpenseSchema);
