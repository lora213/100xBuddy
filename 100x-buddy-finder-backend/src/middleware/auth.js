// src/middleware/auth.js

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    console.log("===> Auth middleware running");
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      console.log("Auth header:", authHeader ? "Present" : "Missing");
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
      
      // Extract the token
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
      }
      
      // Verify the token with Supabase
      const { data: sessionData, error } = await req.supabase.auth.getUser(token);
      
      if (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      // Add user data to request
      req.user = sessionData.user;
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
  
  module.exports = { authenticateToken };