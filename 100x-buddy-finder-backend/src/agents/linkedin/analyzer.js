// agents/linkedin/analyzer.js
const OpenAI = require('openai');

class OpenAIAnalyzer {
  constructor(apiKey) {
    this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      });
    
    // Enable mock data for development/testing without API calls
    this.mockDataEnabled = !apiKey;
  }
  
  // Analyze LinkedIn profile using OpenAI
  async analyzeProfile(profileData) {
    try {
      // Use mock data if API key not provided or mock flag is enabled
      if (this.mockDataEnabled) {
        return this.getMockAnalysis(profileData);
      }
      
      console.log('Analyzing profile with OpenAI...');
      
      // Create prompt for OpenAI analysis
      const prompt = this.createAnalysisPrompt(profileData);
      
      // Call OpenAI API
      const response = await this.openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',  // Use this as text-davinci-003 is deprecated
        prompt,
        max_tokens: 1000,
        temperature: 0.5,
      });
      const analysisText = response.choices[0].text.trim();
      
      // Try to parse the analysis as JSON
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Error parsing OpenAI response as JSON:', parseError);
        
        // Fallback to text analysis if JSON parsing fails
        return {
          technical_assessment: {
            language_proficiency: this.extractScore(analysisText, 'language proficiency'),
            framework_knowledge: this.extractScore(analysisText, 'framework knowledge'),
            project_complexity: this.extractScore(analysisText, 'project complexity'),
            problem_solving: this.extractScore(analysisText, 'problem solving')
          },
          insights: {
            strengths: this.extractList(analysisText, 'strengths'),
            areas_for_growth: this.extractList(analysisText, 'areas for growth'),
            collaboration_potential: this.extractPotential(analysisText)
          }
        };
      }
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      
      // Return default analysis if API call fails
      return this.getMockAnalysis(profileData);
    }
  }
  
  // Create prompt for OpenAI analysis
  createAnalysisPrompt(profile) {
    const experienceText = profile.experience
      .map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`)
      .join('\n');
    
    const educationText = profile.education
      .map(edu => `- ${edu.degree} in ${edu.field} from ${edu.school}`)
      .join('\n');
    
    const skillsText = profile.skills.join(', ');
    
    const certificationsText = profile.certifications
      .map(cert => `- ${cert.name} (${cert.issuer})`)
      .join('\n');
    
    return `
      Please analyze the following LinkedIn profile and provide a detailed technical assessment.
      
      Name: ${profile.name}
      Headline: ${profile.headline}
      Summary: ${profile.summary}
      
      Experience:
      ${experienceText}
      
      Education:
      ${educationText}
      
      Skills:
      ${skillsText}
      
      Certifications:
      ${certificationsText}
      
      Recommendations: ${profile.recommendations}
      
      Based on this profile, please provide:
      
      1. Technical assessment (score each on a scale of 1-5):
         - Language proficiency
         - Framework knowledge
         - Project complexity
         - Problem solving
      
      2. Insights:
         - Strengths
         - Areas for growth
         - Collaboration potential
      
      Please format your response as a JSON object with the following structure:
      {
        "technical_assessment": {
          "language_proficiency": 0,
          "framework_knowledge": 0,
          "project_complexity": 0,
          "problem_solving": 0
        },
        "insights": {
          "strengths": ["strength1", "strength2"],
          "areas_for_growth": ["area1", "area2"],
          "collaboration_potential": "description"
        }
      }
    `;
  }
  
  // Helper functions to extract data from text if JSON parsing fails
  extractScore(text, category) {
    const regex = new RegExp(`${category}[^0-9]*([1-5])`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 3;
  }
  
  extractList(text, category) {
    const regex = new RegExp(`${category}[^:]*:(.*?)(?=\\n\\n|$)`, 'is');
    const match = text.match(regex);
    
    if (match) {
      return match[1].split(/[-*]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    return [`Extracted from profile`];
  }
  
  extractPotential(text) {
    const regex = /collaboration potential[^:]*:(.*?)(?=\n\n|$)/is;
    const match = text.match(regex);
    return match ? match[1].trim() : 'Moderate';
  }
  
  // Generate mock analysis for development
  getMockAnalysis(profile) {
    // Simple algorithm to generate consistent but varied scores
    const calculateScore = (profile, type) => {
      const nameHash = this.simpleHash(profile.name);
      
      // Base score is 3
      let score = 3;
      
      if (type === 'language') {
        // Boost score based on technical skills
        const technicalSkillsCount = profile.skills.filter(skill => 
          /javascript|python|java|c\+\+|ruby|go|rust|php|swift|kotlin|typescript|scala|perl|c#|r/i.test(skill)
        ).length;
        
        score += Math.min(2, technicalSkillsCount / 2);
      } else if (type === 'framework') {
        // Boost score based on framework skills
        const frameworkSkillsCount = profile.skills.filter(skill => 
          /react|angular|vue|node|express|django|flask|spring|rails|laravel|symfony|next|gatsby|tensorflow|pytorch/i.test(skill)
        ).length;
        
        score += Math.min(2, frameworkSkillsCount / 2);
      } else if (type === 'complexity') {
        // Boost based on job title and company
        const seniorRoleBonus = profile.experience.some(exp => 
          /senior|lead|principal|architect|manager|director|head/i.test(exp.title)
        ) ? 1 : 0;
        
        const bigTechBonus = profile.experience.some(exp => 
          /google|microsoft|amazon|facebook|apple|netflix|ibm|oracle/i.test(exp.company)
        ) ? 1 : 0;
        
        score += seniorRoleBonus + bigTechBonus;
      } else if (type === 'problem') {
        // Boost based on education and certifications
        const advancedDegreeBonus = profile.education.some(edu => 
          /master|phd|doctorate/i.test(edu.degree)
        ) ? 1 : 0;
        
        const certBonus = Math.min(1, profile.certifications.length / 2);
        
        score += advancedDegreeBonus + certBonus;
      }
      
      // Apply some randomness based on name hash
      score += ((nameHash % 100) / 100) - 0.5;
      
      // Ensure score is between 1 and 5
      return Math.max(1, Math.min(5, Math.round(score)));
    };
    
    const languageScore = calculateScore(profile, 'language');
    const frameworkScore = calculateScore(profile, 'framework');
    const complexityScore = calculateScore(profile, 'complexity');
    const problemScore = calculateScore(profile, 'problem');
    
    // Generate strengths based on high scores
    const strengths = [];
    if (languageScore >= 4) strengths.push('Strong programming language proficiency');
    if (frameworkScore >= 4) strengths.push('Excellent framework knowledge');
    if (complexityScore >= 4) strengths.push('Experience with complex projects');
    if (problemScore >= 4) strengths.push('Advanced problem-solving skills');
    
    // Add generic strengths if needed
    if (strengths.length < 2) {
      const genericStrengths = [
        'Solid technical foundation',
        'Good collaboration skills',
        'Adaptable to new technologies',
        'Self-motivated learner'
      ];
      
      while (strengths.length < 2) {
        const randomIndex = (this.simpleHash(profile.name + strengths.length)) % genericStrengths.length;
        const strength = genericStrengths[randomIndex];
        if (!strengths.includes(strength)) {
          strengths.push(strength);
        }
      }
    }
    
    // Generate areas for growth based on low scores
    const areasForGrowth = [];
    if (languageScore <= 2) areasForGrowth.push('Expand programming language expertise');
    if (frameworkScore <= 2) areasForGrowth.push('Deepen framework knowledge');
    if (complexityScore <= 2) areasForGrowth.push('Take on more complex projects');
    if (problemScore <= 2) areasForGrowth.push('Develop problem-solving skills');
    
    // Add generic areas if needed
    if (areasForGrowth.length < 2) {
      const genericAreas = [
        'Broaden technical skillset',
        'Gain experience with emerging technologies',
        'Develop leadership capabilities',
        'Contribute to open-source projects'
      ];
      
      while (areasForGrowth.length < 2) {
        const randomIndex = (this.simpleHash(profile.name + areasForGrowth.length)) % genericAreas.length;
        const area = genericAreas[randomIndex];
        if (!areasForGrowth.includes(area)) {
          areasForGrowth.push(area);
        }
      }
    }
    
    // Determine collaboration potential
    const averageScore = (languageScore + frameworkScore + complexityScore + problemScore) / 4;
    let collaborationPotential;
    
    if (averageScore >= 4) {
      collaborationPotential = 'High potential for collaboration, could serve as a technical lead or mentor';
    } else if (averageScore >= 3) {
      collaborationPotential = 'Good potential for peer collaboration and knowledge sharing';
    } else {
      collaborationPotential = 'Would benefit from a mentorship relationship with more experienced developers';
    }
    
    return {
      technical_assessment: {
        language_proficiency: languageScore,
        framework_knowledge: frameworkScore,
        project_complexity: complexityScore,
        problem_solving: problemScore
      },
      insights: {
        strengths,
        areas_for_growth: areasForGrowth,
        collaboration_potential: collaborationPotential
      }
    };
  }
  
  // Simple hash function for consistent mock data
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = { OpenAIAnalyzer };