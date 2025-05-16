// src/api/auth.js
const express = require('express');
const router = express.Router();

router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Use Supabase to refresh the access token
    const { data, error } = await req.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      throw error;
    }
    
    // Return the new tokens
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies['refresh_token'] || req.body.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }
    
    // Use Supabase to refresh the token
    const { data, error } = await req.supabase.auth.refreshSession({ refresh_token: refreshToken });
    
    if (error) {
      throw error;
    }
    
    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

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
    
    // Set refresh token in HTTP-only cookie for better security
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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

router.post('/waitlist', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if email is already in waitlist
    const { data: existingUser, error: checkError } = await req.supabaseAdmin
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means not found, which is expected
      console.error('Error checking waitlist:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      return res.status(200).json({ 
        message: 'Email is already on the waitlist' 
      });
    }
    
    // Add email to waitlist
    const { data, error } = await req.supabaseAdmin
      .from('waitlist')
      .insert([
        { 
          email, 
          created_at: new Date().toISOString() 
        }
      ]);
    
    if (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
    
    // Send confirmation email (optional)
    // This is where you'd integrate with your email service
    // Like SendGrid, Mailchimp, etc.
    
    res.status(200).json({ 
      message: 'Successfully joined waitlist' 
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ 
      error: 'An error occurred while joining the waitlist' 
    });
  }
});

module.exports = router;