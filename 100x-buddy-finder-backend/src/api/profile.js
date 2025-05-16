// src/api/profile.js

console.log("Loading profile routes file");
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get current user's profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Retrieving profile for user ID:", userId);
    
    // First check if user exists
    const { data: userCheck, error: checkError } = await req.supabase
      .from('users')
      .select('count')
      .eq('id', userId);
    
    if (checkError) {
      console.error("User check error:", checkError);
      throw checkError;
    }
    
    // If user doesn't exist in users table, create a new record
    if (!userCheck || userCheck.length === 0 || userCheck[0].count === 0) {
      console.log("User not found in database, creating new user record");
      
      const { data: newUser, error: createError } = await req.supabaseAdmin
        .from('users')
        .insert([{ 
          id: userId,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || 'New User'
        }])
        .select();
      
      if (createError) {
        console.error("Create user error:", createError);
        throw createError;
      }
      
      // Get the newly created user
      const userData = newUser[0];
      
      // Return new user with empty social profiles
      return res.json({
        user: userData,
        socialProfiles: []
      });
    }
    
    // User exists, fetch complete profile
    const { data: userData, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);
    
    if (userError) {
      console.error("Get user error:", userError);
      throw userError;
    }
    
    // Get social profiles
    const { data: socialProfiles, error: socialError } = await req.supabase
      .from('social_profiles')
      .select('*')
      .eq('user_id', userId);
    
    if (socialError) {
      console.error("Get social profiles error:", socialError);
      throw socialError;
    }
    
    // Return the data
    res.json({
      user: userData && userData.length > 0 ? userData[0] : { id: userId },
      socialProfiles: socialProfiles || []
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a social profile
router.post('/social', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { platform_type, profile_url, username } = req.body;
      
      if (!platform_type || !profile_url) {
        return res.status(400).json({ error: 'Platform type and profile URL are required' });
      }

      if (!profile_url.startsWith('http://') && !profile_url.startsWith('https://')) {
        profile_url = 'https://' + profile_url;
      }
      
      // Insert social profile
      const { data, error } = await req.supabase
        .from('social_profiles')
        .insert([
          {
            user_id: userId,
            platform_type,
            profile_url,
            username: username || null
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      res.status(201).json({
        message: 'Social profile added successfully',
        profile: data[0]
      });
    } catch (error) {
      console.error('Add social profile error:', error);
      res.status(500).json({ error: error.message });
    }
  });

// Inside your route handler
// This is just a test route to see if the request body is being received correctly
// You can remove this later
router.post('/skills', authenticateToken, (req, res, next) => {
    console.log("===> Skills route hit");
    console.log("Request body:", req.body);
    
    // Then call your existing handler
    next();
  });

// Add a skill
router.post('/skills', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Processing skills for user:", userId);
      
      const { skills } = req.body;
      
      // Basic validation
      if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ error: 'Skills array is required' });
      }
      
      // Add user_id to each skill
      const skillsWithUserId = skills.map(skill => ({
        user_id: userId,
        skill_name: skill.skill_name,
        skill_type: skill.skill_type,
        proficiency_level: parseInt(skill.proficiency_level),
        years_experience: skill.years_experience ? parseFloat(skill.years_experience) : null
      }));
      
      console.log("Preparing to insert skills:", JSON.stringify(skillsWithUserId));
      
      // Delete existing skills first - using admin client to bypass RLS
      console.log("Deleting existing skills");
      const { error: deleteError } = await req.supabaseAdmin  // Note the change to supabaseAdmin
        .from('skills')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
      
      // Insert new skills - using admin client to bypass RLS
      console.log("Inserting new skills");
      const { data, error } = await req.supabaseAdmin  // Note the change to supabaseAdmin
        .from('skills')
        .insert(skillsWithUserId)
        .select();
      
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      
      console.log("Skills inserted successfully:", data.length);
      
      res.json({
        message: 'Skills updated successfully',
        count: data.length,
        skills: data
      });
    } catch (error) {
      console.error('Skills update error:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.details || 'No additional details'
      });
    }
  });

// Helper function to generate technical skills scores
async function generateTechnicalScores(userId, skills, supabase) {
    try {
      // Calculate aggregated scores by skill type
      const skillTypes = {};
      
      skills.forEach(skill => {
        if (!skillTypes[skill.skill_type]) {
          skillTypes[skill.skill_type] = {
            total: 0,
            count: 0
          };
        }
        
        skillTypes[skill.skill_type].total += parseInt(skill.proficiency_level) || 0;
        skillTypes[skill.skill_type].count += 1;
      });
      
      // Map skill types to rubric subcategories
      const subcategoryMap = {
        'language': 'programming_languages',
        'framework': 'frameworks_libraries',
        'tool': 'project_complexity',
        'soft': 'problem_solving'
      };
      
      // Delete existing technical skill scores
      const { error: deleteError } = await supabase
        .from('rubric_scores')
        .delete()
        .eq('user_id', userId)
        .eq('category', 'technical_skills');
      
      if (deleteError) throw deleteError;
      
      // Create score entries to insert
      const scoresToInsert = [];
      
      for (const [type, data] of Object.entries(skillTypes)) {
        const subcategory = subcategoryMap[type] || type;
        const averageScore = data.count > 0 ? Math.round(data.total / data.count) : 0;
        
        scoresToInsert.push({
          user_id: userId,
          category: 'technical_skills',
          subcategory,
          score: averageScore,
          metadata: { source: 'skills', count: data.count }
        });
      }
      
      // Insert new scores
      if (scoresToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('rubric_scores')
          .insert(scoresToInsert);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Generate technical scores error:', error);
      // Don't throw the error, just log it
    }
}

// Add a single skill
router.post('/skill', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { skill_name, skill_type, proficiency_level, years_experience } = req.body;
      
      if (!skill_name || !skill_type || !proficiency_level) {
        return res.status(400).json({ error: 'Skill name, type, and proficiency level are required' });
      }
      
      // Insert skill
      const { data, error } = await req.supabase
        .from('skills')
        .insert([
          {
            user_id: userId,
            skill_name,
            skill_type,
            proficiency_level: parseInt(proficiency_level),
            years_experience: years_experience ? parseFloat(years_experience) : null
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Also update technical skills scores
      const skills = await req.supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId);
        
      if (skills.data) {
        await generateTechnicalScores(userId, skills.data, req.supabase);
      }
      
      res.status(201).json({
        message: 'Skill added successfully',
        skill: data[0]
      });
    } catch (error) {
      console.error('Add skill error:', error);
      res.status(500).json({ error: error.message });
    }
  });


// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        learning_style, 
        collaboration_preference, 
        career_goals, 
        mentorship_type 
      } = req.body;
      
      // Validate data
      if (collaboration_preference && (collaboration_preference < 1 || collaboration_preference > 5)) {
        return res.status(400).json({ error: 'Collaboration preference must be between 1 and 5' });
      }
      
      const updateData = {
        updated_at: new Date()
      };
      
      // Only update fields that are provided
      if (learning_style) updateData.learning_style = learning_style;
      if (collaboration_preference) updateData.collaboration_preference = parseInt(collaboration_preference);
      if (career_goals) updateData.career_goals = career_goals;
      if (mentorship_type) updateData.mentorship_type = mentorship_type;
      
      console.log(`Updating preferences for user ${userId}`);
      
      const { data, error } = await req.supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error("Update preferences error:", error);
        throw error;
      }
      
      res.json({
        message: 'Preferences updated successfully',
        user: data[0]
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Helper function to generate personal attribute scores
  async function generatePersonalScores(userId, preferences, supabase) {
    try {
      // Delete existing personal attribute scores
      const { error: deleteError } = await supabase
        .from('rubric_scores')
        .delete()
        .eq('user_id', userId)
        .eq('category', 'personal_attributes');
      
      if (deleteError) throw deleteError;
      
      // Create score entries
      const scoresToInsert = [];
      
      if (preferences.learning_style) {
        scoresToInsert.push({
          user_id: userId,
          category: 'personal_attributes',
          subcategory: 'learning_style',
          score: 3, // Default score
          metadata: { value: preferences.learning_style }
        });
      }
      
      if (preferences.collaboration_preference) {
        scoresToInsert.push({
          user_id: userId,
          category: 'personal_attributes',
          subcategory: 'collaboration_preference',
          score: parseInt(preferences.collaboration_preference),
          metadata: { }
        });
      }
      
      if (preferences.mentorship_type) {
        scoresToInsert.push({
          user_id: userId,
          category: 'personal_attributes',
          subcategory: 'mentorship_type',
          score: 3, // Default score
          metadata: { value: preferences.mentorship_type }
        });
      }
      
      // Insert scores
      if (scoresToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('rubric_scores')
          .insert(scoresToInsert);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Generate personal scores error:', error);
      // Just log the error
    }
  }

// Add social profile
router.post('/social-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform_type, profile_url } = req.body;
    
    if (!platform_type || !profile_url) {
      return res.status(400).json({ error: 'Platform type and profile URL are required' });
    }
    
    // Format URL if needed
    let formattedUrl = profile_url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Insert the profile
    const { data, error } = await req.supabaseAdmin
      .from('social_profiles')
      .upsert([{
        user_id: userId,
        platform_type: platform_type.toLowerCase(),
        profile_url: formattedUrl
      }])
      .select();
    
    if (error) {
      console.error("Add social profile error:", error);
      throw error;
    }
    
    // Fetch all profiles to return updated list
    const { data: allProfiles, error: fetchError } = await req.supabase
      .from('social_profiles')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error("Fetch profiles error:", fetchError);
      throw fetchError;
    }
    
    res.status(201).json({
      message: `${platform_type} profile added successfully`,
      profile: data && data.length > 0 ? data[0] : null,
      socialProfiles: allProfiles || []
    });
  } catch (error) {
    console.error('Add social profile error:', error);
    res.status(500).json({ error: error.message });
  }
});
  
router.get('/social-profiles', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const { data, error } = await req.supabase
        .from('social_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Get social profiles error:", error);
        throw error;
      }
      
      res.json({
        socialProfiles: data || []
      });
    } catch (error) {
      console.error('Get social profiles error:', error);
      res.status(500).json({ error: error.message });
    }
});
  
  // Delete social profile
router.delete('/social-profile/:id', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const profileId = req.params.id;
      
      // Verify the profile belongs to the user
      const { data: profile, error: checkError } = await req.supabase
        .from('social_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Check profile error:", checkError);
        throw checkError;
      }
      
      if (!profile) {
        return res.status(404).json({ error: 'Social profile not found or access denied' });
      }
      
      // Delete the profile
      const { error } = await req.supabaseAdmin
        .from('social_profiles')
        .delete()
        .eq('id', profileId);
      
      if (error) {
        console.error("Delete profile error:", error);
        throw error;
      }
      
      res.json({
        message: `${profile.platform_type} profile deleted successfully`
      });
    } catch (error) {
      console.error('Delete social profile error:', error);
      res.status(500).json({ error: error.message });
    }
});

// Get user skills
router.get('/skills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user's skills
    const { data, error } = await req.supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Get skills error:", error);
      throw error;
    }
    
    res.json({
      skills: data || []
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: error.message });
  }
});

// A unified endpoint for updating the complete profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      full_name,
      learning_style, 
      collaboration_preference, 
      career_goals, 
      mentorship_type 
    } = req.body;
    
    // Basic validation
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    // Update user record
    const updateData = {
      full_name,
      updated_at: new Date()
    };
    
    // Add optional fields if provided
    if (learning_style) updateData.learning_style = learning_style;
    if (collaboration_preference) updateData.collaboration_preference = 
      typeof collaboration_preference === 'string' ? 
        parseInt(collaboration_preference) : collaboration_preference;
    if (career_goals) updateData.career_goals = career_goals;
    if (mentorship_type) updateData.mentorship_type = mentorship_type;
    
    // Update the user record
    const { data, error } = await req.supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error("Update profile error:", error);
      throw error;
    }
    
    // Generate personal scores from the updated preferences
    if (learning_style || collaboration_preference || mentorship_type) {
      await generatePersonalScores(userId, updateData, req.supabaseAdmin);
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: data[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', (req, res) => {
    console.log("Test route hit!");
    res.json({ message: 'Test route working' });
  });  

module.exports = router;