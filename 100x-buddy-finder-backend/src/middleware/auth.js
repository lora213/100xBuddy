// src/middleware/auth.js

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  console.log("===> Auth middleware running");
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log("No auth header present");
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  
  console.log("Auth header: Present");
  
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await req.supabase.auth.getUser(token);
    
    if (error) {
      console.log("Token verification error:", error);
      
      // Special handling for expired tokens
      if (error.message.includes('expired')) {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'token_expired'
        });
      }
      
      throw error;
    }
    
    if (!user) {
      console.log("No user found for token");
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.log("Token verification error:", error);
    return res.status(403).json({ error: 'Failed to authenticate token' });
  }
};
  
  module.exports = { authenticateToken };