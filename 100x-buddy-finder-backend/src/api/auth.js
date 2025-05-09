// src/api/auth.js
const express = require('express');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await req.supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      throw authError;
    }
    
    // Create user record in our users table
    if (authData.user) {
      const { error: userError } = await req.supabase
        .from('users')
        .insert([
          { 
            id: authData.user.id,
            email,
            full_name
          }
        ]);
      
      if (userError) {
        throw userError;
      }
    }
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: authData.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { data, error } = await req.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      message: 'Login successful',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;