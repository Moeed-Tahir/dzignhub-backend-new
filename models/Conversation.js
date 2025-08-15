const mongoose = require('mongoose')
const { Schema } = mongoose;

const conversationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String
    },
    agent: {
        type: String
    }
}, { timestamps: true });



module.exports = mongoose.model("Conversation", conversationSchema);