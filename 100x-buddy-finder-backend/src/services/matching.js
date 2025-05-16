// src/services/matching.js
/**
 * Calculate compatibility between two users
 * @param {Object} user1Scores - First user's rubric scores
 * @param {Object} user2Scores - Second user's rubric scores
 * @returns {Object} Compatibility score and details
 */
const calculateCompatibility = (user1Scores, user2Scores) => {
    // Initialize component scores
    const components = {
      technical: calculateTechnicalCompatibility(user1Scores, user2Scores),
      social: calculateSocialCompatibility(user1Scores, user2Scores),
      personal: calculatePersonalCompatibility(user1Scores, user2Scores)
    };
    
    // Calculate weighted overall score
    const weightedScore = (
      components.technical.score * 0.4 +  // 40% weight
      components.social.score * 0.4 +     // 40% weight
      components.personal.score * 0.2     // 20% weight
    );
    
    return {
      overall: Math.round(weightedScore),
      components
    };
  };
  
  /**
   * Calculate technical compatibility
   */
  const calculateTechnicalCompatibility = (user1Scores, user2Scores) => {
    // Extract technical scores
    const user1Tech = filterScoresByCategory(user1Scores, 'technical_skills');
    const user2Tech = filterScoresByCategory(user2Scores, 'technical_skills');
    
    if (user1Tech.length === 0 || user2Tech.length === 0) {
      return { score: 50, reason: 'Insufficient technical data' };
    }
    
    // Map skills by subcategory
    const user1TechMap = createScoreMap(user1Tech);
    const user2TechMap = createScoreMap(user2Tech);
    
    // Find all subcategories
    const subcategories = new Set([
      ...Object.keys(user1TechMap),
      ...Object.keys(user2TechMap)
    ]);
    
    // Calculate similarity and complementarity
    let similarityScore = 0;
    let complementarityScore = 0;
    let matchedSubcategories = 0;
    const details = {};
    
    subcategories.forEach(subcategory => {
      const score1 = user1TechMap[subcategory] || 0;
      const score2 = user2TechMap[subcategory] || 0;
      
      if (score1 > 0 && score2 > 0) {
        // Both users have scores for this subcategory
        const diff = Math.abs(score1 - score2);
        const similarity = 1 - (diff / 5); // Convert to 0-1 scale
        const complementarity = (score1 + score2) / 10; // Convert to 0-1 scale
        
        similarityScore += similarity * 100;
        complementarityScore += complementarity * 100;
        matchedSubcategories++;
        
        details[subcategory] = {
          user1_score: score1,
          user2_score: score2,
          similarity: Math.round(similarity * 100),
          complementarity: Math.round(complementarity * 100)
        };
      }
    });
    
    // Calculate final technical score
    if (matchedSubcategories === 0) {
      return { score: 40, reason: 'No overlapping technical skills' };
    }
    
    const avgSimilarity = similarityScore / matchedSubcategories;
    const avgComplementarity = complementarityScore / matchedSubcategories;
    
    // Weight complementarity slightly higher (60%) than similarity (40%)
    const finalScore = (avgSimilarity * 0.4) + (avgComplementarity * 0.6);
    
    return {
      score: Math.round(finalScore),
      similarity: Math.round(avgSimilarity),
      complementarity: Math.round(avgComplementarity),
      details
    };
  };
  
  /**
   * Calculate social compatibility
   */
  const calculateSocialCompatibility = (user1Scores, user2Scores) => {
    // Extract social scores
    const user1Social = filterScoresByCategory(user1Scores, 'social_blueprint');
    const user2Social = filterScoresByCategory(user2Scores, 'social_blueprint');
    
    if (user1Social.length === 0 || user2Social.length === 0) {
      return { score: 50, reason: 'Insufficient social data' };
    }
    
    // Map platforms
    const user1SocialMap = createScoreMap(user1Social);
    const user2SocialMap = createScoreMap(user2Social);
    
    // Find all platforms
    const platforms = new Set([
      ...Object.keys(user1SocialMap),
      ...Object.keys(user2SocialMap)
    ]);
    
    // Calculate platform similarity
    let platformSimilarity = 0;
    let matchedPlatforms = 0;
    const details = {};
    
    platforms.forEach(platform => {
      const score1 = user1SocialMap[platform] || 0;
      const score2 = user2SocialMap[platform] || 0;
      
      if (score1 > 0 && score2 > 0) {
        // Both users have this platform
        const diff = Math.abs(score1 - score2);
        const similarity = 1 - (diff / 5); // Convert to 0-1 scale
        
        platformSimilarity += similarity * 100;
        matchedPlatforms++;
        
        details[platform] = {
          user1_score: score1,
          user2_score: score2,
          similarity: Math.round(similarity * 100)
        };
      }
    });
    
    // Calculate final social score
    if (matchedPlatforms === 0) {
      return { score: 30, reason: 'No overlapping social platforms' };
    }
    
    const avgPlatformSimilarity = platformSimilarity / matchedPlatforms;
    
    return {
      score: Math.round(avgPlatformSimilarity),
      matchedPlatforms,
      platforms: Array.from(platforms),
      details
    };
  };
  
  /**
   * Calculate personal compatibility
   */
  const calculatePersonalCompatibility = (user1Scores, user2Scores) => {
    // Extract personal scores
    const user1Personal = filterScoresByCategory(user1Scores, 'personal_attributes');
    const user2Personal = filterScoresByCategory(user2Scores, 'personal_attributes');
    
    if (user1Personal.length === 0 || user2Personal.length === 0) {
      return { score: 50, reason: 'Insufficient personal data' };
    }
    
    // Map attributes
    const user1PersonalMap = createScoreMap(user1Personal);
    const user2PersonalMap = createScoreMap(user2Personal);
    
    // Calculate specific attribute compatibility
    const details = {};
    let totalScore = 0;
    let attributeCount = 0;
    
    // For learning style, same is better
    if (user1PersonalMap.learning_style && user2PersonalMap.learning_style) {
      const user1Style = user1Personal.find(s => s.subcategory === 'learning_style')?.metadata?.value;
      const user2Style = user2Personal.find(s => s.subcategory === 'learning_style')?.metadata?.value;
      
      let styleScore = 50; // Default
      if (user1Style && user2Style) {
        styleScore = user1Style === user2Style ? 100 : 60;
      }
      
      details.learning_style = {
        user1_value: user1Style,
        user2_value: user2Style,
        score: styleScore,
        reason: styleScore === 100 ? 'Same learning style' : 'Different learning styles'
      };
      
      totalScore += styleScore;
      attributeCount++;
    }
    
    // For collaboration preference, similar is better
    if (user1PersonalMap.collaboration_preference && user2PersonalMap.collaboration_preference) {
      const score1 = user1PersonalMap.collaboration_preference;
      const score2 = user2PersonalMap.collaboration_preference;
      const diff = Math.abs(score1 - score2);
      const similarity = 1 - (diff / 5); // Convert to 0-1 scale
      const collaborationScore = similarity * 100;
      
      details.collaboration_preference = {
        user1_score: score1,
        user2_score: score2,
        score: Math.round(collaborationScore),
        reason: diff <= 1 ? 'Similar collaboration preferences' : 'Different collaboration preferences'
      };
      
      totalScore += collaborationScore;
      attributeCount++;
    }
    
    // For mentorship type, complementary is better
    if (user1PersonalMap.mentorship_type && user2PersonalMap.mentorship_type) {
      const user1Type = user1Personal.find(s => s.subcategory === 'mentorship_type')?.metadata?.value;
      const user2Type = user2Personal.find(s => s.subcategory === 'mentorship_type')?.metadata?.value;
      
      let mentorshipScore = 50; // Default
      
      if (user1Type && user2Type) {
        if (
          (user1Type === 'seeking' && user2Type === 'offering') ||
          (user1Type === 'offering' && user2Type === 'seeking')
        ) {
          mentorshipScore = 100; // Complementary
        } else if (
          (user1Type === 'peer' && user2Type === 'peer')
        ) {
          mentorshipScore = 90; // Both want peer relationship
        } else if (
          user1Type === 'mixed' || user2Type === 'mixed'
        ) {
          mentorshipScore = 70; // One is flexible
        } else {
          mentorshipScore = 50; // Not optimal
        }
      }
      
      details.mentorship_type = {
        user1_value: user1Type,
        user2_value: user2Type,
        score: mentorshipScore,
        reason: mentorshipScore >= 90 ? 'Complementary mentorship styles' : 
                mentorshipScore >= 70 ? 'Compatible mentorship styles' : 
                'Different mentorship preferences'
      };
      
      totalScore += mentorshipScore;
      attributeCount++;
    }
    
    // Calculate final personal score
    if (attributeCount === 0) {
      return { score: 50, reason: 'No personal data to compare' };
    }
    
    const finalScore = totalScore / attributeCount;
    
    return {
      score: Math.round(finalScore),
      details
    };
  };
  
  /**
   * Filter scores by category
   */
  const filterScoresByCategory = (scores, category) => {
    return scores.filter(score => score.category === category);
  };
  
  /**
   * Create a map of scores by subcategory
   */
  const createScoreMap = (scores) => {
    const map = {};
    scores.forEach(score => {
      map[score.subcategory] = score.score;
    });
    return map;
  };
  
  /**
   * Find potential matches for a user
   * @param {string} userId - The user to find matches for
   * @param {Object} supabase - Supabase client
   * @returns {Array} Potential buddy matches with compatibility scores
   */
  const findMatches = async (userId, supabase) => {
    try {
      // Get user's rubric scores
      const { data: userScores, error: scoresError } = await supabase
        .from('rubric_scores')
        .select('*')
        .eq('user_id', userId);
      
      if (scoresError) throw scoresError;
      console.log(`User ${userId} has ${userScores.length} rubric scores`);
      
      // Use supabase admin client to get ALL users
      const { data: allUsersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, learning_style, collaboration_preference, mentorship_type');
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }
      
      // Manually filter out the current user
      const allUsers = allUsersData.filter(user => user.id !== userId);
      
      console.log(`Found ${allUsersData.length} total users, ${allUsers.length} potential matches (excluding self)`);
      
      // Calculate compatibility with each user
      const matches = [];
      
      for (const potentialMatch of allUsers) {
        try {
          // Get potential match's rubric scores
          const { data: matchScores, error: matchScoresError } = await supabase
            .from('rubric_scores')
            .select('*')
            .eq('user_id', potentialMatch.id);
          
          if (matchScoresError) {
            console.error(`Error getting scores for user ${potentialMatch.id}:`, matchScoresError);
            continue;
          }
          
          if (!matchScores || matchScores.length === 0) {
            // Skip users with no scores
            console.log(`User ${potentialMatch.id} (${potentialMatch.full_name}) has no rubric scores, skipping`);
            continue;
          }
          
          console.log(`Calculating compatibility with user ${potentialMatch.id} (${potentialMatch.full_name}) who has ${matchScores.length} rubric scores`);
          
          // Calculate compatibility
          const compatibility = calculateCompatibility(userScores, matchScores);
          console.log(`Compatibility score with ${potentialMatch.full_name}: ${compatibility.overall}%`);
          
          // IMPORTANT: Create match object with expected fields for frontend
          matches.push({
            id: potentialMatch.id,
            user_id: userId,
            match_id: potentialMatch.id,
            matched_user: {
              id: potentialMatch.id,
              full_name: potentialMatch.full_name,
              email: potentialMatch.email,
              learning_style: potentialMatch.learning_style,
              collaboration_preference: potentialMatch.collaboration_preference,
              mentorship_type: potentialMatch.mentorship_type
            },
            compatibility_score: compatibility.overall,
            match_details: compatibility,
            match_reason: generateMatchReason(compatibility),
            status: 'pending' // Add default status for frontend compatibility
          });
        } catch (error) {
          console.error(`Error calculating compatibility with user ${potentialMatch.id}:`, error);
        }
      }
      
      // Sort by compatibility score (highest first)
      matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
      console.log(`Found ${matches.length} potential matches after compatibility calculations`);
      
      // Return top 10 matches
      return matches.slice(0, 10);
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  };
  
  // Helper function to generate a match reason based on compatibility scores
  function generateMatchReason(compatibility) {
    const { overall, components } = compatibility;
    
    if (!components) {
      return overall >= 80 ? "You have excellent overall compatibility." :
             overall >= 60 ? "You have good overall compatibility." :
             overall >= 40 ? "You have moderate compatibility." :
             "This could be an interesting connection to explore.";
    }
    
    if (overall >= 80) {
      return "You have excellent overall compatibility with this user.";
    } else if (overall >= 60) {
      return "You have good overall compatibility with this user.";
    } else if (overall >= 40) {
      if (components.technical && components.technical.score >= 70) {
        return "You have strong technical compatibility with this user.";
      } else if (components.social && components.social.score >= 70) {
        return "You have strong social compatibility with this user.";
      } else if (components.personal && components.personal.score >= 70) {
        return "Your personal attributes align well with this user.";
      }
      return "You have moderate compatibility with this user.";
    } else {
      return "This could be an interesting connection to explore.";
    }
  }
  
  // Make sure this function exists - assuming it's already implemented
  // If not, you'll need to implement the calculateCompatibility function
  
  module.exports = {
    calculateCompatibility, // Make sure this is defined
    findMatches
  };