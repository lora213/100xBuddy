// src/api/matches.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { findMatches } = require('../services/matching');

// Get current user's matches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get existing matches from database
    const { data: matches, error } = await req.supabase
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
    
    res.json({
      matches: formattedMatches
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
    
    // Use the matching service to find potential matches
    const potentialMatches = await findMatches(userId, req.supabase);
    
    if (potentialMatches.length === 0) {
      return res.json({
        message: 'No potential matches found',
        matches: []
      });
    }
    
    console.log(`Found ${potentialMatches.length} potential matches`);
    
    // Store new matches in the database
    const matchesToInsert = potentialMatches.map(match => ({
      user1_id: userId,
      user2_id: match.match_id,
      compatibility_score: match.compatibility_score,
      match_details: match.match_details,
      status: 'pending'
    }));
    
    // Use upsert to avoid duplicates
    const { data: insertedMatches, error: insertError } = await req.supabaseAdmin
      .from('matches')
      .upsert(matchesToInsert, {
        onConflict: 'user1_id,user2_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (insertError) {
      console.error("Insert matches error:", insertError);
      throw insertError;
    }
    
    res.json({
      message: `Found ${potentialMatches.length} potential matches`,
      matches: potentialMatches
    });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update match status
router.put('/:matchId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: ['pending', 'accepted', 'rejected'] 
      });
    }
    
    // Ensure the match belongs to this user
    const { data: match, error: matchError } = await req.supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('user1_id', userId)
      .single();
    
    if (matchError) {
      console.error("Match validation error:", matchError);
      throw matchError;
    }
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found or you do not have permission' });
    }
    
    // Update the match status
    const { data, error } = await req.supabaseAdmin
      .from('matches')
      .update({ 
        status,
        updated_at: new Date()
      })
      .eq('id', matchId)
      .select();
    
    if (error) {
      console.error("Update match status error:", error);
      throw error;
    }
    
    res.json({
      message: `Match status updated to ${status}`,
      match: data[0]
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