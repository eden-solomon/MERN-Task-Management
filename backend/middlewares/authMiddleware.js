const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes (requires JWT)
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]; // Extract token

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request object (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};

// Middleware for admin-only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied, admin only" });
  }
};

module.exports = { protect, adminOnly };
