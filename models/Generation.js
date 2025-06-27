const mongoose = require('mongoose')
const { Schema } = mongoose;

const generation = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
   },
  prompt: {
    type: String
  },
  type: {
    type: String,
    enum: ['image', 'video'],
  },
  size:{
    type: String
  },
  url: {
    type: String,
  }
}, { timestamps: true });



module.exports = mongoose.model("Generation", generation);