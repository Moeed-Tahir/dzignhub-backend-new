const mongoose = require('mongoose');
const { Schema } = mongoose;

const tempUserSchema = new Schema({
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
    hashedOtp: {
        type: String,
        required: true,
    },
    otpExpiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Optional: auto-delete after 10 mins
    },
});

module.exports = mongoose.model("TempUser", tempUserSchema);
