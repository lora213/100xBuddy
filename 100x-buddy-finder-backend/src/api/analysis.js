// src/api/analysis.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { githubAgent } = require('../agents/github');
const { linkedinAgent } = require('../agents/linkedin');
//const { twitterAgent } = require('../agents/twitter');


// Request analysis of a GitHub profile
router.post('/github', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile_url } = req.body;

    if (!profile_url) {
      return res.status(400).json({ error: 'GitHub profile URL is required' });
    }

    // Analyze the GitHub profile
    const analysisResult = await githubAgent.analyze(profile_url);

    // Log the analysis result
    console.log('GitHub Analysis Result:', analysisResult);

    // Store the analysis result
    const { data: reportData, error: reportError } = await req.supabase
      .from('analysis_reports')
      .insert([
        {
          user_id: userId,
          platform: 'github',
          raw_analysis: analysisResult.raw,
          summary: analysisResult.summary,
          score_breakdown: analysisResult.scores,
          agent_version: analysisResult.version
        }
      ])
      .select();

    if (reportError) {
      throw reportError;
    }

    // Log rubric scores before storing
    console.log('Storing Rubric Scores:', analysisResult.scores);

    // Store basic scores in rubric_scores table
    const { data: scoreData, error: scoreError } = await req.supabase
      .from('rubric_scores')
      .insert([
        {
          user_id: userId,
          category: 'social_blueprint',
          subcategory: 'github_profile',
          score: analysisResult.scores.profile_quality,
          metadata: { source: 'github' }
        }
      ])
      .select();

    if (scoreError) {
      throw scoreError;
    }

    res.json({
      message: 'GitHub profile analyzed successfully',
      summary: analysisResult.summary,
      scores: analysisResult.scores
    });
  } catch (error) {
    console.error('GitHub analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze LinkedIn profile
router.post('/linkedin', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile_url } = req.body;
    
    if (!profile_url) {
      return res.status(400).json({ error: 'LinkedIn profile URL is required' });
    }
    
    console.log(`Starting LinkedIn analysis for user ${userId}`);
    
    // Check if profile exists
    const { data: profiles, error: profileError } = await req.supabase
      .from('social_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('platform_type', 'linkedin');
    
    if (profileError) {
      console.error("Error checking profiles:", profileError);
      throw profileError;
    }
    
    // Use the provided URL or get it from the profile
    const linkedinUrl = profile_url || (profiles.length > 0 ? profiles[0].profile_url : null);
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'No LinkedIn profile URL provided or found' });
    }
    
    // Analyze the LinkedIn profile
    const analysisResult = await linkedinAgent.analyze(linkedinUrl);
    
    console.log("Analysis completed:", analysisResult.summary);
    
    // Store the analysis report
    const { data: reportData, error: reportError } = await req.supabaseAdmin
      .from('analysis_reports')
      .insert([{
        user_id: userId,
        platform: 'linkedin',
        raw_analysis: analysisResult.raw,
        summary: analysisResult.summary,
        score_breakdown: analysisResult.scores,
        agent_version: analysisResult.version
      }])
      .select();
    
    if (reportError) {
      console.error("Error storing analysis report:", reportError);
      throw reportError;
    }
    
    // Store social blueprint score
    const { error: scoreError } = await req.supabaseAdmin
      .from('rubric_scores')
      .upsert([{
        user_id: userId,
        category: 'social_blueprint',
        subcategory: 'linkedin_profile',
        score: analysisResult.scores.profile_quality,
        metadata: { source: 'linkedin_agent' }
      }]);
    
    if (scoreError) {
      console.error("Error storing rubric scores:", scoreError);
    }
    
    // Update the last_analyzed timestamp on the profile
    if (profiles.length > 0) {
      await req.supabaseAdmin
        .from('social_profiles')
        .update({ last_analyzed: new Date() })
        .eq('id', profiles[0].id);
    }
    
    res.json({
      message: 'LinkedIn profile analyzed successfully',
      summary: analysisResult.summary,
      scores: analysisResult.scores
    });
  } catch (error) {
    console.error('LinkedIn analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze all social profiles
router.post('/analyze-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's social profiles
    const { data: profiles, error: profilesError } = await req.supabase
      .from('social_profiles')
      .select('*')
      .eq('user_id', userId);
    
    if (profilesError) throw profilesError;
    
    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ error: 'No social profiles found to analyze' });
    }
    
    const results = [];
    
    // Process each profile based on its type
    for (const profile of profiles) {
      try {
        let analysisResult;
        
        switch (profile.platform_type) {
          case 'github':
            // Deep analysis for GitHub
            analysisResult = await githubAgent.analyze(profile.profile_url);
            break;
          case 'linkedin':
            // Last 3 months focus for LinkedIn
            analysisResult = await linkedinAgent.analyze(profile.profile_url);
            break;
          case 'twitter':
            analysisResult = await twitterAgent.analyze(profile.profile_url);
            break;
          default:
            console.log(`Skipping unsupported platform: ${profile.platform_type}`);
            continue;
        }
        
        // Store results and update profile
        await storeAnalysisResults(userId, profile, analysisResult, req.supabaseAdmin);
        results.push({ platform: profile.platform_type, success: true });
      } catch (error) {
        console.error(`Error analyzing ${profile.platform_type}:`, error);
        results.push({ platform: profile.platform_type, success: false, error: error.message });
      }
    }
    
    res.json({
      message: 'Analysis completed',
      results
    });
  } catch (error) {
    console.error('Analyze all profiles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to store analysis results
const storeAnalysisResults = async (userId, profile, analysisResult, supabaseAdmin) => {
  console.log(`Storing rubric scores for ${profile.platform_type} profile:`, analysisResult.scores);

  // Store the analysis report
  await supabaseAdmin
    .from('analysis_reports')
    .insert([{
      user_id: userId,
      platform: profile.platform_type,
      raw_analysis: analysisResult.raw,
      summary: analysisResult.summary,
      score_breakdown: analysisResult.scores,
      summary_text: analysisResult.summary.summary_text || '',
      alignment_score: analysisResult.summary.alignment_score || 0,
      agent_version: analysisResult.version
    }]);
    
  // Update profile last_analyzed timestamp
  await supabaseAdmin
    .from('social_profiles')
    .update({ last_analyzed: new Date() })
    .eq('id', profile.id);
    
  // Store social blueprint score
  await supabaseAdmin
    .from('rubric_scores')
    .upsert([{
      user_id: userId,
      category: 'social_blueprint',
      subcategory: `${profile.platform_type}_profile`,
      score: analysisResult.scores.profile_quality,
      metadata: { source: `${profile.platform_type}_agent` }
    }]);
    
  // Store technical scores if available
  if (analysisResult.scores.technical) {
    const { languages, frameworks, complexity, problem_solving } = analysisResult.scores.technical;
    
    const technicalScores = [
      {
        user_id: userId,
        category: 'technical_skills',
        subcategory: 'programming_languages',
        score: languages,
        metadata: { source: profile.platform_type }
      },
      {
        user_id: userId,
        category: 'technical_skills',
        subcategory: 'frameworks_libraries',
        score: frameworks,
        metadata: { source: profile.platform_type }
      },
      {
        user_id: userId,
        category: 'technical_skills',
        subcategory: 'project_complexity',
        score: complexity,
        metadata: { source: profile.platform_type }
      },
      {
        user_id: userId,
        category: 'technical_skills',
        subcategory: 'problem_solving',
        score: problem_solving,
        metadata: { source: profile.platform_type }
      }
    ];
    
    await supabaseAdmin
      .from('rubric_scores')
      .upsert(technicalScores);
  }
}

// Simple Twitter agent placeholder - we'll implement it later
const twitterAgent = {
  analyze: async (profileUrl) => {
    // Return a default analysis
    return {
      raw: { url: profileUrl },
      summary: "Twitter profile analysis is not fully implemented yet.",
      scores: {
        profile_quality: 3,
        technical: {
          languages: 3,
          frameworks: 3,
          complexity: 2,
          problem_solving: 2
        }
      },
      version: "0.1.0"
    };
  }
};

// Added an endpoint to fetch analysis reports based on user ID.
router.get('/analysis-reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch analysis reports for the user
    const { data: reports, error } = await req.supabase
      .from('analysis_reports')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching analysis reports:', error);
      throw error;
    }

    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch analysis reports:', error);
    res.status(500).json({ error: 'Failed to fetch analysis reports' });
  }
});

router.get('/profile-summaries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const platform = req.query.platform; // Optional filter by platform
    
    let query = req.supabase
      .from('analysis_reports')
      .select('id, platform, summary_text, alignment_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Filter by platform if specified
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    // Get the latest report for each platform
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by platform and get the most recent for each
    const latestReports = {};
    data.forEach(report => {
      if (!latestReports[report.platform] || 
          new Date(report.created_at) > new Date(latestReports[report.platform].created_at)) {
        latestReports[report.platform] = report;
      }
    });
    
    res.json({
      summaries: Object.values(latestReports)
    });
  } catch (error) {
    console.error('Error fetching profile summaries:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/scores', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch rubric scores for the user
    const { data: scores, error } = await req.supabase
      .from('rubric_scores')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching analysis scores:', error);
      throw error;
    }
    
    // Group scores by category and subcategory
    const groupedScores = scores.reduce((acc, score) => {
      if (!acc[score.category]) {
        acc[score.category] = {};
      }
      
      acc[score.category][score.subcategory] = {
        score: score.score,
        metadata: score.metadata
      };
      
      return acc;
    }, {});
    
    res.json({
      scores: groupedScores
    });
  } catch (error) {
    console.error('Failed to fetch analysis scores:', error);
    res.status(500).json({ error: 'Failed to fetch analysis scores' });
  }
});

router.get('/profile-alignment-scores', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the latest analysis report for each platform
    const { data, error } = await req.supabase
      .from('analysis_reports')
      .select('id, platform, alignment_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group by platform and get the most recent for each
    const latestScores = {};
    data.forEach(report => {
      if (!latestScores[report.platform] || 
          new Date(report.created_at) > new Date(latestScores[report.platform].created_at)) {
        latestScores[report.platform] = report;
      }
    });
    
    // Extract just the scores
    const alignmentScores = Object.values(latestScores).map(report => ({
      platform: report.platform,
      score: report.alignment_score || 50 // Default to 50 if missing
    }));
    
    res.json({
      alignmentScores
    });
  } catch (error) {
    console.error('Error fetching profile alignment scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also add an endpoint to get the overall buddy match score
router.get('/buddy-match-score', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the latest alignment scores
    const { data: scores, error: scoresError } = await req.supabase
      .from('analysis_reports')
      .select('platform, alignment_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (scoresError) throw scoresError;
    
    // Group by platform
    const latestScores = {};
    scores.forEach(report => {
      if (!latestScores[report.platform] || 
          new Date(report.created_at) > new Date(latestScores[report.platform].created_at)) {
        latestScores[report.platform] = report.alignment_score || 50;
      }
  });
  // Calculate average score
  const scoreValues = Object.values(latestScores);
  const avgScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
    : 0;
  
  // Get user profile completeness
  const { data: user, error: userError } = await req.supabase
    .from('users')
    .select('full_name, learning_style, collaboration_preference, mentorship_type')
    .eq('id', userId)
    .single();
  
  if (userError) throw userError;
  
  // Calculate profile completeness score (25% for each field)
  const profileFields = [
    !!user.full_name,
    !!user.learning_style,
    !!user.collaboration_preference,
    !!user.mentorship_type
  ];
  
  const profileCompleteness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );
  
  // Get social profile count
  const { count: profileCount, error: profileError } = await req.supabase
    .from('social_profiles')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  if (profileError) throw profileError;
  
  // Calculate social profiles score (max 100% for 3+ profiles)
  const socialProfilesScore = Math.min(100, Math.round((profileCount / 3) * 100));
  
  // Calculate overall buddy match score (weighted average)
  const buddyMatchScore = Math.round(
    (avgScore * 0.5) + // 50% weight to analysis scores
    (profileCompleteness * 0.3) + // 30% weight to profile completeness
    (socialProfilesScore * 0.2) // 20% weight to number of social profiles
  );
  
  res.json({
    buddyMatchScore,
    componentScores: {
      analysisScore: avgScore,
      profileCompleteness,
      socialProfilesScore
    }
  });
} catch (error) {
  console.error('Error calculating buddy match score:', error);
  res.status(500).json({ error: error.message });
}
});

module.exports = router;