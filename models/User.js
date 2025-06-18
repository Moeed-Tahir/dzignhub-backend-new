const mongoose = require('mongoose')
const { Schema } = mongoose;

const users = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
   },
  phoneNumber: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetOtp: {
    type: String,
  },
  
  resetOtpExpires: {
    type: Date,
  },
  
  resetSessionToken: {
    type: String,
  },
  resetSessionExpires: {
    type: Date,
  },
}, { timestamps: true });



module.exports = mongoose.model("User", users);