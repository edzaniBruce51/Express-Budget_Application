const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 80
  },
  password_hash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Virtual for user's URL
UserSchema.virtual('url').get(function () {
  return `/budget/user/${this._id}`;
});

// Method to check password
UserSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Static method to hash password
UserSchema.statics.hashPassword = async function(password) {
  return await bcrypt.hash(password, 12);
};

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  // Only hash if it's not already hashed (for new users)
  if (!this.password_hash.startsWith('$2a$') && !this.password_hash.startsWith('$2b$')) {
    this.password_hash = await bcrypt.hash(this.password_hash, 12);
  }
  next();
});

// Export model
module.exports = mongoose.model('User', UserSchema);
