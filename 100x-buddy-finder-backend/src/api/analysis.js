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
async function storeAnalysisResults(userId, profile, analysisResult, supabaseAdmin) {
  // Store the analysis report
  await supabaseAdmin
    .from('analysis_reports')
    .insert([{
      user_id: userId,
      platform: profile.platform_type,
      raw_analysis: analysisResult.raw,
      summary: analysisResult.summary,
      score_breakdown: analysisResult.scores,
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

module.exports = router;