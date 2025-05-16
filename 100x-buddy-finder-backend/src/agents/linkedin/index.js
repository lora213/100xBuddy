// agents/linkedin/index.js
const { LinkedInScraper } = require('./scraper');
const { OpenAIAnalyzer } = require('./analyzer');
require('dotenv').config();

class LinkedInAgent {
  constructor() {
    this.version = '1.0.0';
    this.scraper = new LinkedInScraper();
    this.analyzer = new OpenAIAnalyzer(process.env.OPENAI_API_KEY);
  }
  
  // Extract username from LinkedIn URL
  extractUsername(url) {
    try {
      // Handle different URL formats
      // linkedin.com/in/username
      // www.linkedin.com/in/username/
      // https://linkedin.com/in/username
      
      // Remove protocol and www if present
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      
      // Split by slashes
      const parts = cleanUrl.split('/');
      
      // Find the part after "in"
      let usernameIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'in') {
          usernameIndex = i + 1;
          break;
        }
      }
      
      if (usernameIndex === -1 || usernameIndex >= parts.length) {
        throw new Error('Invalid LinkedIn URL format');
      }
      
      // Remove trailing slash if present
      return parts[usernameIndex].replace(/\/$/, '');
    } catch (error) {
      throw new Error(`Could not extract username from URL: ${error.message}`);
    }
  }
  
  // Analyze a LinkedIn profile
  async analyze(profileUrl) {
    try {
      console.log(`Analyzing LinkedIn profile: ${profileUrl}`);
      
      // Get username from URL
      const username = this.extractUsername(profileUrl);
      console.log(`Extracted LinkedIn username: ${username}`);
      
      // Scrape profile data
      console.log('Scraping LinkedIn profile...');
      const profileData = await this.scraper.scrapeProfile(username);
      
      // Analyze profile data using OpenAI
      console.log('Analyzing LinkedIn profile data...');
      const analysisResult = await this.analyzer.analyzeProfile(profileData);
      
      // Calculate scores
      const scores = this.calculateScores(profileData, analysisResult);
      
      // Create summary
      const summary = this.createSummary(profileData, analysisResult, scores);
      
      return {
        raw: {
          profile: profileData,
          analysis: analysisResult
        },
        summary,
        scores,
        version: this.version
      };
    } catch (error) {
      console.error('LinkedIn analysis error:', error);
      
      // Return limited data if scraping fails
      return {
        raw: {
          profile_url: profileUrl,
          error: error.message
        },
        summary: 'LinkedIn profile analysis failed. This could be due to privacy settings or rate limiting.',
        scores: {
          profile_quality: 2,
          technical: {
            languages: 2,
            frameworks: 2,
            complexity: 2,
            problem_solving: 2
          }
        },
        version: this.version
      };
    }
  }
  
  // Calculate scores for matching
  calculateScores(profileData, analysisResult) {
    // Profile quality score
    const profileQualityScore = this.calculateProfileQuality(profileData);
    
    // Extract technical scores from analysis
    const technicalScores = analysisResult.technical_assessment || {
      language_proficiency: 3,
      framework_knowledge: 3,
      project_complexity: 2,
      problem_solving: 3
    };
    
    return {
      profile_quality: profileQualityScore,
      technical: {
        languages: technicalScores.language_proficiency,
        frameworks: technicalScores.framework_knowledge,
        complexity: technicalScores.project_complexity,
        problem_solving: technicalScores.problem_solving
      }
    };
  }
  
  // Calculate profile quality score
  calculateProfileQuality(profileData) {
    let score = 1; // Base score
    
    // Has summary/about
    if (profileData.summary && profileData.summary.length > 30) {
      score += 1;
    }
    
    // Has profile image
    if (profileData.profileImage) {
      score += 0.5;
    }
    
    // Has experience
    if (profileData.experience && profileData.experience.length > 0) {
      score += 1;
    }
    
    // Has education
    if (profileData.education && profileData.education.length > 0) {
      score += 0.5;
    }
    
    // Has skills
    if (profileData.skills && profileData.skills.length > 3) {
      score += 1;
    }
    
    // Has recommendations
    if (profileData.recommendations && profileData.recommendations > 0) {
      score += 0.5;
    }
    
    // Has certifications
    if (profileData.certifications && profileData.certifications.length > 0) {
      score += 0.5;
    }
    
    return Math.min(5, Math.round(score));
  }
  
  // Create a summary of the analysis
  createSummary(profileData, analysisResult, scores) {
    // Basic info
    const basicInfo = {
      name: profileData.name,
      headline: profileData.headline,
      location: profileData.location
    };
    
    // Experience summary
    const experience = profileData.experience && profileData.experience.length > 0
      ? profileData.experience.slice(0, 3).map(exp => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration
        }))
      : [];
    
    // Skills summary
    const skills = profileData.skills && profileData.skills.length > 0
      ? profileData.skills.slice(0, 10)
      : [];
    
    // Analysis insights
    const insights = analysisResult.insights || {
      strengths: ['Technical experience', 'Professional background'],
      areas_for_growth: ['Continuous learning'],
      collaboration_potential: 'Moderate to high'
    };
    
    return {
      basic_info: basicInfo,
      experience,
      skills,
      insights,
      scores: {
        profile_quality: scores.profile_quality,
        languages: scores.technical.languages,
        frameworks: scores.technical.frameworks,
        complexity: scores.technical.complexity,
        problem_solving: scores.technical.problem_solving
      }
    };
  }
}

// Export an instance of the agent
const linkedinAgent = new LinkedInAgent();
module.exports = { linkedinAgent };