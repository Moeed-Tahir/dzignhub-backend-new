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

    toolSteps: [{
        type: {
            type: String,
            enum: ['status', 'tool_start', 'tool_result']
        },
        name: String,
        message: String,
        status: String,
        resultMessage: String,
        data: Schema.Types.Mixed, // Flexible for any data
        timestamp: Date
    }],
    thinkingProcess: {
        thinking: String,
        reasoning: String,
        analysis: String,
        plan: String,
        strategy: String,
        creative_process: String,
        design_decisions: String,
        process: String,
        findings: String,
        approach: String,
        evaluation: String,
        quality_check: String
    },
    imageUrl: String,
    isLogo: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['processing', 'thinking', 'complete', 'error', 'awaiting_input'],
        default: 'complete'
    },
    isError: {
        type: Boolean,
        default: false
    },
    shouldTypeText: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });



module.exports = mongoose.model("Message", messageSchema);