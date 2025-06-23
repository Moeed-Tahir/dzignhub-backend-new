require('express-async-errors');
const express = require('express');
const cors = require('cors');
const connectDb = require('./db/connect');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/error-handler');
const notFound = require('./middleware/not-found');
const authRoutes = require('./routes/auth');
const generationRoutes = require('./routes/generation');

require('dotenv').config();

const app = express();

// Configure CORS options to allow all origins
const corsOptions = {
  origin: "*",
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(authRoutes);
app.use(generationRoutes);

app.get('/', (req, res) => {
    console.log("Hello world");
    return res.status(200).json({ success: true });
});


const port = process.env.PORT || 8080;

// In the start function:
const start = async () => {
    try {
      const mongoURI = process.env.MONGO_URI;
      
      console.log('Connecting to MongoDB...')
      await connectDb(mongoURI);
      console.log('MongoDB connection successful')
      
      app.listen(port, () => { 
        console.log(`Server is running on port ${port}`); 
      });
    } catch (err) {
      console.error('Failed to start server:', err.message)
      process.exit(1)
    }
  };

// Export the app for Vercel
module.exports = app; 

// Optional: Start the server locally if needed
if (require.main === module) {
    start();
}