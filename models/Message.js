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
    searchResults: {
        keywords: String,
        results: [{
            title: String,
            link: String,
            source: String,
            snippet: String
        }]
    },
    inspirationImages: [{
        title: String,
        url: String,
        source: String,
        thumbnail: String
    }],
}, { timestamps: true });



module.exports = mongoose.model("Message", messageSchema);