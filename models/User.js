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
  avatar: {
    type: String,
  },
  name: {
    type: String,
  },
  location: {
    type: String,
  },
  bio: {
    type: String,
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


  notificationSettings: {
    newNotifications: {
      type: Boolean,
      default: true
    },
    softwareUpdatesNewsletter: {
      type: Boolean,
      default: true
    },
    newMessagesFromBots: {
      type: Boolean,
      default: true
    }
  },


  // Onboarding Information
  onboarding: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 0
    },
    
    // Let's Start Tab Data
    userType: [{
      type: String,
      enum: [
        'founder-entrepreneur',
        'creative-designer', 
        'marketer-agency',
        'coach-consultant',
        'small-business-brand-owner',
        'other'
      ]
    }],
    creationGoals: [{
      type: String,
      enum: [
        'exploring-creative-direction',
        'website-ui-digital-product',
        'brand-identity',
        'business-strategy',
        'content-posts-ads-blogs'
      ]
    }],
    
    // Design Your Direction Tab Data
    brandWords: [{
      type: String,
      maxlength: 50 // limit individual word length
    }],
    brandTone: [{
      type: String
    }],
    customBrandTones: [{
      type: String,
      maxlength: 30
    }],
    designStyle: [{
      type: String,
      enum: [
        'editorial',
        'clean-neutrals',
        'high-contrast',
        'color-rich-expressive',
        'earth-toned',
        'dark-sleek'
      ]
    }]
  },
}, { timestamps: true });



module.exports = mongoose.model("User", users);