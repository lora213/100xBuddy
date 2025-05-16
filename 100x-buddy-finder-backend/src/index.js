// src/index.js
console.log("========== SERVER STARTING ==========");
console.log("Time:", new Date().toISOString());
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./api/auth');
const profileRoutes = require('./api/profile');
const analysisRoutes = require('./api/analysis');
const matchesRoutes = require('./api/matches');
const matchRequestsRouter = require('./api/match-requests');
const notificationsRouter = require('./api/notifications');
const connectionsRouter = require('./api/connections');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Make Supabase client available to route handlers
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAdmin = supabaseAdmin;
  console.log("Supabase client attached to request");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key:", supabaseKey ? "Present" : "Missing");
  console.log("Supabase Service Key:", supabaseServiceKey ? "Present" : "Missing");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.originalUrl);
  console.log("Request body:", req.body);
  console.log("Request headers:", req.headers);
  console.log("Request query:", req.query);
  console.log("Request params:", req.params);
  console.log("Request IP:", req.ip);
  console.log("Request time:", new Date().toISOString());
  console.log("Request user agent:", req.headers['user-agent']);
  console.log("Request authorization header:", req.headers['authorization'] ? "Present" : "Missing");
  next();
});

app.use('/api/auth', authRoutes);
console.log("Registering profile routes...");
app.use('/api/profile', profileRoutes);
console.log("Profile routes registered");
app.use('/api/analysis', analysisRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/match-requests', matchRequestsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/connections', connectionsRouter);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Buddy Finder API is running' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});