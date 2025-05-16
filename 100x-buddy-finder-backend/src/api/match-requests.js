// src/api/match-requests.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Send a match request
router.post('/send', authenticateToken, async (req, res) => {
    try {
      const senderId = req.user.id;
      const { receiverId, compatibilityScore, matchReason } = req.body;
      
      console.log("Received match request with receiverId:", receiverId);
      
      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }
      
      // Use the admin client to bypass RLS policies
      const { data: receiver, error: receiverError } = await req.supabaseAdmin
        .from('users')
        .select('id, full_name')
        .eq('id', receiverId)
        .single();
      
      if (receiverError) {
        console.error("Error finding receiver:", receiverError);
        return res.status(500).json({ error: 'Database error when finding receiver' });
      }
      
      if (!receiver) {
        console.error("Receiver not found for ID:", receiverId);
        return res.status(404).json({ error: 'Receiver not found' });
      }
      
      console.log("Found receiver:", receiver.full_name);
      
      // Check if a request already exists
      const { data: existingRequest, error: requestError } = await req.supabaseAdmin
        .from('match_requests')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .maybeSingle();
      
      if (requestError) throw requestError;
      
      if (existingRequest) {
        // If there's a pending request from the receiver to the sender, auto-accept it
        if (existingRequest.sender_id === receiverId && existingRequest.status === 'pending') {
          // Accept the request and create a connection
          return await acceptExistingRequest(existingRequest.id, senderId, receiverId, existingRequest.compatibility_score, req.supabaseAdmin, res);
        }
        
        // If there's any other existing request, return an error
        return res.status(400).json({ 
          error: 'A match request already exists between these users',
          requestStatus: existingRequest.status,
          isIncoming: existingRequest.receiver_id === senderId
        });
      }
      
      // Create a new match request
      const { data: newRequest, error: createError } = await req.supabaseAdmin
        .from('match_requests')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          compatibility_score: compatibilityScore || 50,
          match_reason: matchReason || 'This user wants to connect with you',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      
      // NEW CODE: Also create a match entry for immediate visibility in Your Matches tab
      const { data: newMatch, error: matchError } = await req.supabaseAdmin
        .from('matches')
        .insert([{
          user1_id: senderId,
          user2_id: receiverId,
          compatibility_score: compatibilityScore || 50,
          status: 'pending',
          match_details: {
            request_id: newRequest.id,
            match_reason: matchReason || 'This user wants to connect with you',
            components: {
              technical: { score: 70 },
              social: { score: 80 },
              personal: { score: 75 }
            }
          },
          created_at: new Date()
        }])
        .select()
        .single();
      
      if (matchError) {
        console.error("Error creating match entry:", matchError);
        // Don't fail if match creation fails, just log it
      } else {
        console.log("Created match entry:", newMatch.id);
      }
      
      // Create a notification for the receiver
      const { data: senderData } = await req.supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', senderId)
        .single();
      
      await req.supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: receiverId,
          type: 'match_request',
          title: 'New Match Request',
          message: `${senderData.full_name} wants to connect with you!`,
          related_id: newRequest.id
        }]);
      
      res.status(201).json({
        message: 'Match request sent successfully',
        request: newRequest,
        match: newMatch
      });
    } catch (error) {
      console.error('Send match request error:', error);
      res.status(500).json({ error: error.message });
    }
});

// Accept a match request
router.post('/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;
    
    // Find the request
    const { data: request, error: requestError } = await req.supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId) // Only the receiver can accept
      .eq('status', 'pending')
      .single();
    
    if (requestError || !request) {
      return res.status(404).json({ error: 'Match request not found or cannot be accepted' });
    }
    
    // Accept the request
    return await acceptExistingRequest(requestId, userId, request.sender_id, request.compatibility_score, req.supabaseAdmin, res);
  } catch (error) {
    console.error('Accept match request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject a match request
router.post('/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;
    
    // Find the request
    const { data: request, error: requestError } = await req.supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId) // Only the receiver can reject
      .eq('status', 'pending')
      .single();
    
    if (requestError || !request) {
      return res.status(404).json({ error: 'Match request not found or cannot be rejected' });
    }
    
    // Update the request status
    const { data: updatedRequest, error: updateError } = await req.supabaseAdmin
      .from('match_requests')
      .update({ status: 'rejected', updated_at: new Date() })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Create a notification for the sender
    const { data: receiverData } = await req.supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    await req.supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: request.sender_id,
        type: 'match_rejected',
        title: 'Match Request Rejected',
        message: `${receiverData.full_name} has declined your connection request.`,
        related_id: requestId
      }]);
    
    res.json({
      message: 'Match request rejected',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Reject match request error:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/incoming', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // First, log any potentially problematic requests for debugging
      const { data: allRequests } = await req.supabaseAdmin
        .from('match_requests')
        .select(`
          id, 
          sender_id,
          status, 
          compatibility_score,
          created_at
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');
      
      console.log('All incoming requests:', allRequests);
      
      // Get the senders' user info separately to identify missing users
      if (allRequests && allRequests.length > 0) {
        const senderIds = allRequests.map(req => req.sender_id);
        const { data: senders } = await req.supabaseAdmin
          .from('users')
          .select('id')
          .in('id', senderIds);
        
        const existingSenderIds = new Set(senders.map(sender => sender.id));
        
        // Log any requests with missing senders
        allRequests.forEach(request => {
          if (!existingSenderIds.has(request.sender_id)) {
            console.error(`Request ${request.id} has invalid sender_id: ${request.sender_id}`);
          }
        });
      }
      
      // Now get the actual requests with user data
      const { data: requests, error } = await req.supabaseAdmin
        .from('match_requests')
        .select(`
          id, 
          sender_id,
          status, 
          compatibility_score, 
          match_reason, 
          created_at,
          users:sender_id (id, full_name, email)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process the requests to ensure they all have valid user data
      const processedRequests = requests.map(request => {
        // If users is null, fetch the sender_id directly from the request
        if (!request.users) {
          console.log(`Request ${request.id} is missing user data for sender ${request.sender_id}`);
          return {
            ...request,
            users: {
              id: request.sender_id,
              full_name: "User " + request.sender_id.substring(0, 8),
              email: ""
            }
          };
        }
        return request;
      });
      
      res.json({
        requests: processedRequests || []
      });
    } catch (error) {
      console.error('Get incoming requests error:', error);
      res.status(500).json({ error: error.message });
    }
  });

// Get user's outgoing match requests
router.get('/outgoing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: requests, error } = await req.supabaseAdmin
      .from('match_requests')
      .select(`
        id, 
        status, 
        compatibility_score, 
        match_reason, 
        created_at,
        users:receiver_id (id, full_name, email)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      requests: requests || []
    });
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to accept a request and create a connection
async function acceptExistingRequest(requestId, userId, otherUserId, compatibilityScore, supabase, res) {
    try {
      console.log(`Accepting request ${requestId} between ${userId} and ${otherUserId}`);
      
      // Update the request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('match_requests')
        .update({ status: 'accepted', updated_at: new Date() })
        .eq('id', requestId)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating request status:", updateError);
        throw updateError;
      }
      
      console.log("Request status updated to accepted");
      
      // Create a connection record
      const { data: connection, error: connectionError } = await supabaseAdmin
        .from('connections')
        .insert([{
          user1_id: userId,
          user2_id: otherUserId,
          match_request_id: requestId,
          compatibility_score: compatibilityScore || 50,
          created_at: new Date()
        }])
        .select()
        .single();
      
      if (connectionError) {
        console.error("Error creating connection:", connectionError);
        throw connectionError;
      }
      
      console.log(`Connection created with ID ${connection.id}`);
      
      // Get user names for notifications
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', [userId, otherUserId]);
      
      if (userError) {
        console.error("Error fetching user data:", userError);
        // Don't fail if we can't get user names, just use placeholders
        // But still log the error
      }
      
      // Create a safe user map with fallbacks
      const userMap = {};
      if (userData) {
        userData.forEach(user => {
          userMap[user.id] = user.full_name;
        });
      }
      
      // Use fallbacks if names aren't found
      const user1Name = userMap[userId] || "your match";
      const user2Name = userMap[otherUserId] || "their match";
      
      console.log(`Creating notifications for users ${userId} and ${otherUserId}`);
      
      // Create notifications for both users
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type: 'match_confirmed',
            title: 'New Connection!',
            message: `You are now connected with ${user2Name}!`,
            related_id: connection.id,
            created_at: new Date()
          },
          {
            user_id: otherUserId,
            type: 'match_confirmed',
            title: 'New Connection!',
            message: `You are now connected with ${user1Name}!`,
            related_id: connection.id,
            created_at: new Date()
          }
        ]);
      
      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
        // Don't fail if notification creation fails, just log the error
      } else {
        console.log("Notifications created successfully");
      }
      
      // IMPORTANT: Also create or update a match entry to ensure it appears in the matches list
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
        .maybeSingle();
      
      if (existingMatch) {
        // Update existing match
        await supabase
          .from('matches')
          .update({
            status: 'accepted',
            updated_at: new Date(),
            match_details: {
              connection_id: connection.id,
              accepted_at: new Date()
            }
          })
          .eq('id', existingMatch.id);
        
        console.log(`Updated existing match ${existingMatch.id} to accepted`);
      } else {
        // Create new match
        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert([{
            user1_id: userId,
            user2_id: otherUserId,
            compatibility_score: compatibilityScore || 50,
            status: 'accepted',
            match_details: {
              connection_id: connection.id,
              request_id: requestId,
              accepted_at: new Date(),
              components: {
                technical: { score: 70 },
                social: { score: 80 },
                personal: { score: 75 }
              }
            },
            created_at: new Date()
          }])
          .select()
          .single();
        
        if (matchError) {
          console.error("Error creating match:", matchError);
          // Don't fail if match creation fails
        } else {
          console.log(`Created new match with ID ${newMatch.id}`);
        }
      }
      
      return res.json({
        message: 'Match request accepted and connection created',
        request: updatedRequest,
        connection: connection
      });
    } catch (error) {
      console.error("Error in acceptExistingRequest:", error);
      // If we get here, something went wrong that wasn't caught by more specific error handlers
      return res.status(500).json({ error: error.message || "Error accepting match request" });
    }
  }

module.exports = router;