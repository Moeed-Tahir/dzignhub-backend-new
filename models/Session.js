const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    device: String
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    country: String,
    city: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });



module.exports = mongoose.model('Session', sessionSchema);