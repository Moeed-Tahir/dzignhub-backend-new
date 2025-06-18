const mongoose = require('mongoose')



const connectDB = (url) => {
    console.log('Connecting to MongoDB...')
    console.log("MongoDB URL: ", url)
    return mongoose.connect(url)
}

module.exports = connectDB