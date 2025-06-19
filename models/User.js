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
    type: String
  },
  password: {
    type: String
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
  provider: {type: String},
}, { timestamps: true });



module.exports = mongoose.model("User", users);