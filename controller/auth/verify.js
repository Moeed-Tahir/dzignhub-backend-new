const User = require("../../models/User");
const Session = require("../../models/Session");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")

const verify = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }
    

    // Verify JWT token - this will throw an error if token is invalid or expired
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Check if session exists in database (active session check)
    const session = await Session.findOne({ token });
    if (!session) {
      return res.status(401).json({ 
        type: "error", 
        message: "Session expired or invalid" 
      });
    }
    
    // Find user by userId from token (more secure than email)
    const user = await User.findById(verification.userId, { 
      password: 0, 
      createdAt: 0, 
      updatedAt: 0, 
      __v: 0 
    });

    if (!user) {
      return res.status(404).json({ type: "error", message: "User not found" });
    }

    res.status(200).json({ 
      type: "success", 
      message: "Token verified successfully", 
      user: user 
    });

  } catch (error) {
    console.log(error);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      // Remove expired session from database
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await Session.findOneAndDelete({ token });
      }
      return res.status(401).json({ 
        type: "error", 
        message: "Token has expired" 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        type: "error", 
        message: "Invalid token" 
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        type: "error", 
        message: "Token not active yet" 
      });
    }
    
    res.status(500).json({ type: "error", message: "Something went wrong" });
  }
});

module.exports = verify; // Fixed: export 'verify' not 'login'