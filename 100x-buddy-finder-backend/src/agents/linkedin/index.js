// src/agents/linkedin/index.js
const axios = require('axios');

/**
 * Agent for analyzing LinkedIn profiles
 * Focus is on recent activity (last 3 months)
 */
class LinkedInAgent {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.version = '1.0.0';
  }
  
  /**
   * Analyze a LinkedIn profile URL
   * @param {string} profileUrl - LinkedIn profile URL
   * @returns {Object} Analysis results
   */
  async analyze(profileUrl) {
    try {
      // Extract username from URL
      const username = profileUrl.split('linkedin.com/in/')[1]?.split('/')[0] || 
                       profileUrl.split('www.linkedin.com/in/')[1]?.split('/')[0];
      
      if (!username) {
        throw new Error('Invalid LinkedIn URL. Expected format: linkedin.com/in/username');
      }
      
      console.log(`Analyzing LinkedIn profile for ${username}`);
      
      // Fetch LinkedIn profile data
      const profileData = await this.fetchLinkedInData(username);
      
      // Analyze using direct API call
      const analysis = await this.analyzeWithGroqDirect(profileData);
      
      return {
        raw: profileData,
        summary: analysis.summary,
        scores: analysis.scores,
        version: this.version
      };
    } catch (error) {
      console.error('LinkedIn analysis error:', error);
      throw new Error(`LinkedIn analysis failed: ${error.message}`);
    }
  }
  
  /**
   * Fetch LinkedIn profile data
   * Note: In a production environment, you would use LinkedIn API or a compliant data provider
   * This is a simplified implementation for demonstration
   */
  async fetchLinkedInData(username) {
    try {
      // In a real implementation, this would call LinkedIn API or a data provider
      // For demonstration, we're simulating the data
      
      // Simulate a delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return simulated data - in production, this would be real data
      return {
        username,
        fullName: this.capitalizeUsername(username),
        headline: 'Software Engineer',
        location: 'San Francisco Bay Area',
        connections: 500,
        // Focus on recent data - last 3 months
        recentActivity: {
          posts: [
            { 
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
              content: 'Excited to share my latest project using React and Node.js!'
            },
            { 
              date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), 
              content: 'Just completed a course on advanced JavaScript patterns.'
            }
          ],
          jobChanges: [],
          certifications: [
            {
              name: 'AWS Certified Developer',
              issuer: 'Amazon Web Services',
              date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Company',
            duration: '2 years',
            description: 'Developed scalable web applications using React and Node.js'
          },
          {
            title: 'Software Developer',
            company: 'Startup Inc',
            duration: '3 years',
            description: 'Built and maintained microservices using Python and Docker'
          }
        ],
        education: [
          {
            school: 'University of Technology',
            degree: 'Bachelor of Science in Computer Science',
            years: '2015-2019'
          }
        ],
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Docker', 'AWS'],
        recommendations: 5
      };
    } catch (error) {
      console.error('LinkedIn data fetch error:', error);
      
      // Return basic data if fetch fails
      return {
        username,
        fullName: this.capitalizeUsername(username),
        headline: 'Software Professional',
        skills: ['Software Development'],
        recentActivity: { posts: [], jobChanges: [], certifications: [] }
      };
    }
  }
  
  /**
   * Capitalize a username for display
   */
  capitalizeUsername(username) {
    return username
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  /**
   * Direct API call to Groq
   */
  async analyzeWithGroqDirect(profileData) {
    try {
      const prompt = `
        Analyze this LinkedIn profile data for a 100x Engineers course participant:
        ${JSON.stringify(profileData, null, 2)}
        
        Focus specifically on activities and changes from the past 3 months.
        
        Evaluate the profile based on:
        1. Recent technical skill indicators (last 3 months)
        2. Recent professional experience changes
        3. Recent network growth and engagement
        4. Latest certifications or learning activities
        
        Return a JSON with:
        1. A brief summary of the profile's recent activities and strengths
        2. Scores (1-5) for the following categories:
           - profile_quality: Overall LinkedIn profile strength
           - technical: {
               languages: Programming language proficiency indication,
               frameworks: Framework knowledge indication,
               complexity: Project complexity indication,
               problem_solving: Problem-solving skill indication
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
              content: "You are an AI assistant that analyzes LinkedIn profiles for technical skill assessment with a focus on recent activity (past 3 months). Return only valid JSON with a summary and scores."
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
        summary: "Failed to generate detailed analysis. Basic profile evaluation completed with focus on recent activity.",
        scores: {
          profile_quality: 3,
          technical: {
            languages: 3,
            frameworks: 3,
            complexity: 2,
            problem_solving: 2
          }
        }
      };
    }
  }
}

const linkedinAgent = new LinkedInAgent();
module.exports = { linkedinAgent };