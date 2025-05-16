// src/api/connections.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get user's connections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching connections for user: ${userId}`);
    
    // Get connections where the user is either user1 or user2
    // Use supabaseAdmin to avoid RLS issues
    const { data: connections, error } = await req.supabaseAdmin
      .from('connections')
      .select(`
        id,
        user1_id,
        user2_id,
        match_request_id,
        compatibility_score,
        created_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching connections:", error);
        throw error;
    }

    console.log(`Found ${connections?.length || 0} connections`);
    
    // For each connection, get the other user's info
    const processedConnections = await Promise.all(connections.map(async conn => {
        // Determine which user is the buddy (not the current user)
        const buddyUserId = conn.user1_id === userId ? conn.user2_id : conn.user1_id;
        
        // Fetch the buddy's user data
        const { data: userData, error: userError } = await req.supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .eq('id', buddyUserId)
          .single();
        
        if (userError) {
            console.error(`Error fetching user data for user ${buddyUserId}:`, userError);
            // Use a better fallback name
            return {
              ...conn,
              user: {
                id: buddyUserId,
                full_name: `User ${buddyUserId.substring(0, 6)}`, // Changed from "Buddy" to "User"
                email: ''
              }
            };
        }

        // For safety, check if userData exists and has the needed fields
        if (!userData || !userData.full_name) {
            console.warn(`Missing or incomplete user data for ${buddyUserId}`);
            return {
                ...conn,
                user: {
                    id: buddyUserId,
                    full_name: `User ${buddyUserId.substring(0, 6)}`,
                    email: userData?.email || ''
                }
            };
        }

        return {
            ...conn,
            user: userData
        };
    }));
    
    res.json({
        connections: processedConnections || []
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get connection details
router.get('/:connectionId', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const connectionId = req.params.connectionId;
      
      // Get connection
      const { data: connection, error: connError } = await req.supabaseAdmin
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();
      
      if (connError) throw connError;
      
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      
      // Ensure user is part of this connection
      if (connection.user1_id !== userId && connection.user2_id !== userId) {
        return res.status(403).json({ error: 'You do not have access to this connection' });
      }
      
      // Get the other user's details
      const buddyId = connection.user1_id === userId ? connection.user2_id : connection.user1_id;
      
      // Get buddy's full profile with skills and social profiles
      const { data: userData, error: userError } = await req.supabaseAdmin
        .from('users')
        .select(`
          id,
          full_name,
          email,
          learning_style,
          collaboration_preference,
          mentorship_type,
          skills(id, skill_name, skill_type, proficiency_level),
          social_profiles(id, platform_type, profile_url)
        `)
        .eq('id', buddyId)
        .single();
      
      // Create a fallback user object if there's an error
      const buddyUser = userError || !userData ? {
        id: buddyId,
        full_name: `User ${buddyId.substring(0, 6)}`,
        email: ''
      } : userData;
      
      // Get match request for additional details
      let matchDetails = null;
      if (connection.match_request_id) {
        const { data: matchRequest } = await req.supabaseAdmin
          .from('match_requests')
          .select('*')
          .eq('id', connection.match_request_id)
          .single();
        
        if (matchRequest) {
          matchDetails = {
            match_reason: matchRequest.match_reason,
            created_at: matchRequest.created_at
          };
        }
      }
      
      res.json({
        connection: {
          ...connection,
          match_details: matchDetails
        },
        user: buddyUser
      });
    } catch (error) {
      console.error('Get connection details error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
module.exports = router;