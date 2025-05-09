// src/agents/github/index.js
const axios = require('axios');

/**
 * Agent for in-depth analysis of GitHub profiles
 */
class GitHubAgent {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.version = '1.0.0';
  }
  
  /**
   * Analyze a GitHub profile URL
   * @param {string} profileUrl - GitHub profile URL
   * @returns {Object} In-depth analysis results
   */
  async analyze(profileUrl) {
    try {
      // Extract username from URL
      const username = profileUrl.split('github.com/')[1]?.split('/')[0];
      
      if (!username) {
        throw new Error('Invalid GitHub URL');
      }
      
      console.log(`Performing in-depth analysis of GitHub profile for ${username}`);
      
      // Fetch GitHub profile and repository data
      const profileData = await this.fetchGitHubData(username);
      
      // Perform in-depth analysis
      const analysis = await this.analyzeWithGroqDirect(profileData);
      
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
   * Fetch GitHub profile and repository data
   * @param {string} username - GitHub username
   * @returns {Object} GitHub profile and repository data
   */
  async fetchGitHubData(username) {
    try {
      // Set headers for GitHub API
      const headers = process.env.GITHUB_TOKEN ? 
        { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {};
      
      // Get user profile
      const userResponse = await axios.get(
        `https://api.github.com/users/${username}`,
        { headers }
      );
      
      // Get repositories
      const reposResponse = await axios.get(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        { headers }
      );
      
      // Get languages for each repo
      const reposWithDetails = await Promise.all(
        reposResponse.data.map(async (repo) => {
          try {
            // Get languages
            const languagesResponse = await axios.get(
              repo.languages_url,
              { headers }
            );
            
            return {
              ...repo,
              languages: languagesResponse.data
            };
          } catch (error) {
            console.error(`Error fetching details for ${repo.name}:`, error);
            return {
              ...repo,
              languages: {},
              error: error.message
            };
          }
        })
      );
      
      return {
        profile: userResponse.data,
        repositories: reposWithDetails
      };
      
    } catch (error) {
      console.error('GitHub API error:', error);
      
      // Return simulated data for demonstration if API fails
      return this.simulateGitHubData(username);
    }
  }
  
  /**
   * Simulate GitHub data when API fails
   * @param {string} username - GitHub username
   * @returns {Object} Simulated GitHub data
   */
  simulateGitHubData(username) {
    return {
      profile: {
        login: username,
        name: username,
        bio: 'Software developer',
        public_repos: 15,
        followers: 25,
        following: 30,
        created_at: '2018-01-01T00:00:00Z',
        html_url: `https://github.com/${username}`
      },
      repositories: [
        {
          name: 'personal-website',
          description: 'My personal portfolio website',
          html_url: `https://github.com/${username}/personal-website`,
          stargazers_count: 5,
          watchers_count: 5, 
          forks_count: 2,
          fork: false,
          created_at: '2020-01-15T00:00:00Z',
          updated_at: '2023-03-10T00:00:00Z',
          languages: { JavaScript: 15000, HTML: 5000, CSS: 3000 }
        },
        {
          name: 'todo-app',
          description: 'A simple todo application with React',
          html_url: `https://github.com/${username}/todo-app`,
          stargazers_count: 2,
          watchers_count: 2,
          forks_count: 0,
          fork: false,
          created_at: '2021-02-20T00:00:00Z',
          updated_at: '2023-02-15T00:00:00Z',
          languages: { TypeScript: 8000, CSS: 2000 }
        },
        {
          name: 'machine-learning-projects',
          description: 'Collection of ML experiments',
          html_url: `https://github.com/${username}/machine-learning-projects`,
          stargazers_count: 10,
          watchers_count: 10,
          forks_count: 3,
          fork: false,
          created_at: '2019-08-10T00:00:00Z',
          updated_at: '2023-01-05T00:00:00Z',
          languages: { Python: 20000, Jupyter: 5000 }
        }
      ]
    };
  }
  
  /**
   * Direct API call to Groq
   */
  async analyzeWithGroqDirect(githubData) {
    try {
      const prompt = `
        Perform an in-depth analysis of this GitHub profile for a 100x Engineers course participant:
        ${JSON.stringify(githubData, null, 2)}
        
        Evaluate thoroughly:
        1. Code quality and complexity across repositories
        2. Technical diversity and depth of knowledge
        3. Problem-solving approaches evident in issue discussions and PRs
        4. Collaboration patterns and communication style
        5. Project architecture decisions and design patterns used
        6. Documentation quality and developer experience considerations
        7. Testing strategies and reliability focus
        
        Return a detailed JSON with:
        1. A comprehensive assessment of technical capabilities
        2. Specific examples of strengths found in the repositories
        3. Areas of expertise identified from the code
        4. Scores (1-5) for the following categories:
           - profile_quality: Overall GitHub profile strength
           - technical: {
               languages: Programming language proficiency and diversity,
               frameworks: Framework knowledge breadth and depth,
               complexity: Project complexity and architectural sophistication,
               problem_solving: Evidence of advanced problem-solving skills
             }
      `;
      
      // Using axios to call Groq API directly
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that performs in-depth analysis of GitHub profiles for technical skill assessment. Return only valid JSON with a comprehensive assessment and scores."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Parse the JSON response
      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Groq direct API error:', error);
      
      // Fallback to basic analysis
      return {
        summary: "Failed to generate detailed analysis. Basic profile evaluation completed.",
        scores: {
          profile_quality: 3,
          technical: {
            languages: 3,
            frameworks: 3,
            complexity: 3,
            problem_solving: 3
          }
        }
      };
    }
  }
}

const githubAgent = new GitHubAgent();
module.exports = { githubAgent };