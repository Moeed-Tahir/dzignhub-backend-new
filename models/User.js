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
  isVerified: {
    type: Boolean
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });



module.exports = mongoose.model("User", users);