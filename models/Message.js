const mongoose = require('mongoose')
const { Schema } = mongoose;

const messageSchema = new Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'agent'],
        required: true
    },
    text: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });



module.exports = mongoose.model("Message", messageSchema);