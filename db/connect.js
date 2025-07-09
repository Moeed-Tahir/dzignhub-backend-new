const mongoose = require('mongoose');

let isConnected;

const connectDB = async (url) => {
    if (isConnected) {
        console.log("=> Using existing database connection");
        return;
    }

    if (!url) {
        throw new Error("MongoDB connection string is missing.");
    }

    try {
        const db = await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = db.connections[0].readyState;
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
};

module.exports = connectDB;
