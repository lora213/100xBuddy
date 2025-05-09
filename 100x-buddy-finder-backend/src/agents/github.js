// src/agents/github.js
const axios = require('axios');

/**
 * Simple agent for analyzing GitHub profiles
 * This is a minimal version without the LLM for testing purposes
 */
class GitHubAgent {
  constructor() {
    this.version = '0.1.0';
  }
  
  /**
   * Analyze a GitHub profile URL
   * @param {string} profileUrl - GitHub profile URL
   * @returns {Object} Analysis results
   */
  async analyze(profileUrl) {
    try {
      // Extract username from URL
      const username = profileUrl.split('github.com/')[1]?.split('/')[0];
      
      if (!username) {
        throw new Error('Invalid GitHub URL');
      }
      
      // Fetch basic GitHub data
      const profileData = await this.fetchGitHubData(username);
      
      // Create a basic analysis
      const analysis = this.createBasicAnalysis(profileData);
      
      return {
        raw: profileData,
        summary: analysis.summary,
        scores: analysis.scores,
        version: this.version
      };
    } catch (error) {
      console.error('GitHub analysis error:', error);
      throw new Error(`GitHub analysis failed: ${error.message}`);
    }
  }
  
  /**
   * Fetch GitHub profile data
   * @param {string} username - GitHub username
   * @returns {Object} GitHub profile data
   */
  async fetchGitHubData(username) {
    try {
      // Basic request to GitHub API
      const response = await axios.get(`https://api.github.com/users/${username}`);
      return response.data;
    } catch (error) {
      console.error('GitHub API error:', error);
      
      // Return mock data for testing
      return {
        login: username,
        public_repos: 5,
        followers: 10,
        following: 15,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Mock GitHub profile for testing'
      };
    }
  }
  
  /**
   * Create a basic analysis without using LLM
   * @param {Object} profileData - GitHub profile data
   * @returns {Object} Analysis results
   */
  createBasicAnalysis(profileData) {
    // Very basic scoring algorithm
    const repoScore = Math.min(5, Math.ceil(profileData.public_repos / 5));
    const followersScore = Math.min(5, Math.ceil(profileData.followers / 10));
    const activityScore = 3; // Default mid-range score
    
    return {
      summary: `GitHub profile with ${profileData.public_repos} public repositories and ${profileData.followers} followers.`,
      scores: {
        profile_quality: Math.round((repoScore + followersScore + activityScore) / 3),
        technical: {
          languages: 3, // Default scores for testing
          frameworks: 3,
          complexity: 3,
          problem_solving: 3
        }
      }
    };
  }
}

const githubAgent = new GitHubAgent();
module.exports = { githubAgent };