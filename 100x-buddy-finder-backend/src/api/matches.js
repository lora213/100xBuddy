// src/api/matches.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { findMatches } = require('../services/matching');

// Get current user's matches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Getting matches for user ${userId}`);
    
    // Get existing matches from database
    const { data: matches, error } = await req.supabaseAdmin
      .from('matches')
      .select(`
        id,
        compatibility_score,
        match_details,
        status,
        created_at,
        users!user2_id (id, full_name, email)
      `)
      .eq('user1_id', userId)
      .order('compatibility_score', { ascending: false });
    
    if (error) {
      console.error("Get matches error:", error);
      throw error;
    }
    
    // Format matches for the response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      compatibility_score: match.compatibility_score,
      matched_user: match.users,
      status: match.status,
      created_at: match.created_at,
      match_details: match.match_details
    }));
    
    // ADDED: Get outgoing match requests
    const { data: outgoingRequests, error: requestsError } = await req.supabaseAdmin
      .from('match_requests')
      .select(`
        id,
        compatibility_score,
        match_reason,
        status,
        created_at,
        users!receiver_id (id, full_name, email)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      console.error("Get outgoing requests error:", requestsError);
      throw requestsError;
    }
    
    console.log(`Found ${outgoingRequests ? outgoingRequests.length : 0} outgoing match requests`);
    
    // Format outgoing requests as matches
    const formattedRequests = outgoingRequests.map(request => ({
      id: request.id,
      match_id: request.receiver_id,  // Include both ID formats for compatibility
      compatibility_score: request.compatibility_score,
      matched_user: request.users,
      status: request.status,
      created_at: request.created_at,
      match_details: {
        components: {
          technical: { score: 70 },
          social: { score: 80 },
          personal: { score: 75 }
        }
      },
      match_reason: request.match_reason,
      is_match_request: true  // Flag to indicate this is a match request, not a match
    }));
    
    // Combine both lists
    const allMatches = [...formattedMatches, ...formattedRequests];
    
    // Sort by newest first
    allMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`Returning ${allMatches.length} total matches (${formattedMatches.length} from matches, ${formattedRequests.length} from requests)`);
    
    res.json({
      matches: allMatches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find new matches
router.post('/find', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Finding matches for user ${userId}`);
    
    // Use admin client to bypass RLS policies
    const supabaseAdmin = req.supabaseAdmin;
    
    // Get user's rubric scores
    const { data: userScores, error: scoresError } = await req.supabase
      .from('rubric_scores')
      .select('*')
      .eq('user_id', userId);
    
    if (scoresError) {
      console.error("Error fetching user scores:", scoresError);
      throw scoresError;
    }
    
    console.log(`User has ${userScores ? userScores.length : 0} rubric scores`);

    // Check if user has rubric scores
    if (!userScores || userScores.length === 0) {
      return res.json({
        message: 'You need to analyze your profile first to find matches',
        matches: []
      });
    }

    // Use the imported findMatches function but pass the admin client instead
    try {
      console.log("Using supabaseAdmin to bypass RLS...");
      const potentialMatches = await findMatches(userId, supabaseAdmin);
      console.log(`Found ${potentialMatches ? potentialMatches.length : 0} potential matches through matching algorithm`);
      
      if (!potentialMatches || potentialMatches.length === 0) {
        return res.json({
          message: 'No potential matches found',
          matches: []
        });
      }
      
      // Filter out users who already have connections with the current user
      const { data: existingConnections } = await req.supabase
        .from('connections')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      
      const connectedUserIds = existingConnections ? existingConnections.map(conn => 
        conn.user1_id === userId ? conn.user2_id : conn.user1_id
      ) : [];
      console.log(`User has ${connectedUserIds.length} existing connections`);
      
      // Filter out users who have pending or rejected match requests with the current user
      const { data: existingRequests } = await req.supabase
        .from('match_requests')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .in('status', ['pending', 'rejected']);
      
      const requestUserIds = existingRequests ? existingRequests.map(req => 
        req.sender_id === userId ? req.receiver_id : req.sender_id
      ) : [];
      console.log(`User has ${requestUserIds.length} existing match requests`);
      
      // Filter out users who are already connected or have pending/rejected requests
      const filteredMatches = potentialMatches.filter(match => 
        !connectedUserIds.includes(match.match_id) && !requestUserIds.includes(match.match_id)
      );
      
      console.log(`After filtering out existing connections/requests: ${filteredMatches.length} matches remain`);
      
      // No need for threshold filtering during testing
      const matchesToReturn = filteredMatches;
      
      if (matchesToReturn.length === 0) {
        return res.json({
          message: 'No potential matches found after filtering',
          matches: []
        });
      }
      
      console.log(`Returning ${matchesToReturn.length} potential matches to client`);
      
      // Additional info about matched users
      for (const match of matchesToReturn) {
        console.log(`Match: ${match.matched_user.full_name}, Score: ${match.compatibility_score}%`);
      }

      const processedMatches = matchesToReturn.map(match => ({
        ...match,
        id: match.match_id  // Make sure each match has both id and match_id
      }));
      
      return res.json({
        message: `Found ${processedMatches.length} potential matches`,
        matches: processedMatches
      });
      
    } catch (matchingError) {
      console.error('Error in matching algorithm:', matchingError);
      throw matchingError;
    }
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update match status - FIXED
router.put('/:matchId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    const { status } = req.body;

    console.log(`Updating match status: userId=${userId}, matchId=${matchId}, status=${status}`);
    
    if (!matchId || matchId === 'undefined') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: ['pending', 'accepted', 'rejected'] 
      });
    }
    
    // First, check if this is a potential match (not yet in matches table)
    // If it's a potential match, we need to create the match record first
    let matchRecord;
    
    try {
      // Try to find existing match
      const { data: existingMatch, error: matchError } = await req.supabaseAdmin
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle(); 
      
      if (existingMatch) {
        console.log("Found existing match record:", existingMatch.id);
        matchRecord = existingMatch;
      } else {
        // No match found - see if this is actually a user ID (match_id from algorithm)
        console.log("No match found by ID. Checking if this is a potential match with user...");
        
        // Try to get the user we're matching with using admin client to bypass RLS
        const { data: matchedUser, error: userError } = await req.supabaseAdmin
          .from('users')
          .select('id, full_name')
          .eq('id', matchId)
          .single();
          
        if (userError || !matchedUser) {
          console.error("Matched user lookup error:", userError || "User not found");
          return res.status(404).json({ error: 'Matched user not found' });
        }

        console.log(`Found user to match with: ${matchedUser.full_name}`);
        
        // Check if a match already exists between these users
        const { data: existingUserMatch, error: userMatchError } = await req.supabase
          .from('matches')
          .select('*')
          .or(`and(user1_id.eq.${userId},user2_id.eq.${matchId}),and(user1_id.eq.${matchId},user2_id.eq.${userId})`)
          .maybeSingle();
      
        if (existingUserMatch) {
          // Match already exists between these users
          console.log("Found existing match between users:", existingUserMatch.id);
          matchRecord = existingUserMatch;
        } else {
          // Create a new match record
          console.log("Creating new match between users...");
          const { data: newMatch, error: createError } = await req.supabaseAdmin
            .from('matches')
            .insert({
              user1_id: userId,
              user2_id: matchId,
              status: status,
              compatibility_score: 75, // Default score
              created_at: new Date()
            })
            .select()
            .single();
            
          if (createError) {
            console.error("Error creating match:", createError);
            throw createError;
          }
          
          matchRecord = newMatch;
          console.log("Created new match record:", matchRecord);
          
          // Return early since we've already created with the desired status
          return res.json({
            message: `Match created with status ${status}`,
            match: matchRecord
          });
        }
      }
    } catch (error) {
      console.error("Match lookup/creation error:", error);
      throw error;
    }
    
    // Now update the match if needed (if we didn't just create it with the right status)
    if (matchRecord && matchRecord.status !== status) {
      console.log(`Updating match ${matchRecord.id} status to ${status}`);
      const { data, error } = await req.supabaseAdmin
        .from('matches')
        .update({ 
          status,
          updated_at: new Date()
        })
        .eq('id', matchRecord.id)
        .select();
      
      if (error) {
        console.error("Update match status error:", error);
        throw error;
      }
      
      matchRecord = data[0];
    }
    
    res.json({
      message: `Match status updated to ${status}`,
      match: matchRecord
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get match details
router.get('/:matchId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    
    // Get the match with detailed user info
    const { data: match, error } = await req.supabase
      .from('matches')
      .select(`
        id,
        compatibility_score,
        match_details,
        status,
        created_at,
        users!user2_id (
          id, 
          full_name, 
          email,
          learning_style,
          collaboration_preference,
          career_goals,
          mentorship_type
        )
      `)
      .eq('id', matchId)
      .eq('user1_id', userId)
      .single();
    
    if (error) {
      console.error("Get match details error:", error);
      throw error;
    }
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found or you do not have permission' });
    }
    
    res.json({
      match: {
        id: match.id,
        compatibility_score: match.compatibility_score,
        matched_user: match.users,
        status: match.status,
        created_at: match.created_at,
        match_details: match.match_details
      }
    });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;