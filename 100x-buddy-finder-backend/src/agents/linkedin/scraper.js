// agents/linkedin/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

class LinkedInScraper {
  constructor() {
    // Initialize axios with user-agent to avoid blocking
    this.api = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    // Using a mock service since direct LinkedIn scraping is against TOS
    this.mockDataEnabled = true;
  }
  
  // Scrape LinkedIn profile
  async scrapeProfile(username) {
    try {
      console.log(`Scraping LinkedIn profile for username: ${username}`);
      
      // Use mock data for development (direct scraping is against LinkedIn's TOS)
      if (this.mockDataEnabled) {
        return this.getMockProfileData(username);
      }
      
      // In a real implementation, you would use puppeteer or a similar service
      // This is a simplified example to show the structure
      const url = `https://www.linkedin.com/in/${username}/`;
      
      const response = await this.api.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract profile data
      const profileData = {
        name: $('.pv-top-card--list .text-heading-xlarge').text().trim(),
        headline: $('.pv-top-card--list .text-body-medium').text().trim(),
        location: $('.pv-top-card--list .text-body-small').text().trim(),
        summary: $('.pv-about-section .pv-about__summary-text').text().trim(),
        profileImage: $('.pv-top-card__photo img').attr('src'),
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        recommendations: 0
      };
      
      // Extract experience
      $('.experience-section .pv-entity__position-group').each((i, el) => {
        const title = $(el).find('.pv-entity__summary-info h3').text().trim();
        const company = $(el).find('.pv-entity__secondary-title').text().trim();
        const duration = $(el).find('.pv-entity__date-range span:nth-child(2)').text().trim();
        
        profileData.experience.push({ title, company, duration });
      });
      
      // Extract education
      $('.education-section .pv-education-entity').each((i, el) => {
        const school = $(el).find('.pv-entity__school-name').text().trim();
        const degree = $(el).find('.pv-entity__degree-name').text().trim();
        const field = $(el).find('.pv-entity__fos').text().trim();
        
        profileData.education.push({ school, degree, field });
      });
      
      // Extract skills
      $('.pv-skill-categories-section .pv-skill-category-entity__name-text').each((i, el) => {
        profileData.skills.push($(el).text().trim());
      });
      
      // Extract certifications
      $('.pv-accomplishments-section .pv-certification-entity').each((i, el) => {
        const name = $(el).find('.pv-certification-name').text().trim();
        const issuer = $(el).find('.pv-certification-entity__subtitle').text().trim();
        
        profileData.certifications.push({ name, issuer });
      });
      
      // Count recommendations
      profileData.recommendations = $('.recommendations-section .artdeco-tab-panel').length;
      
      return profileData;
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      throw new Error(`LinkedIn scraping failed: ${error.message}`);
    }
  }
  
  // Generate mock profile data for development
  getMockProfileData(username) {
    // Create a deterministic but varied profile based on username
    const hash = this.simpleHash(username);
    
    const jobTitles = [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
      'Backend Engineer', 'DevOps Engineer', 'Data Scientist',
      'Product Manager', 'UX Designer', 'Machine Learning Engineer'
    ];
    
    const companies = [
      'Google', 'Microsoft', 'Amazon', 'Facebook', 'Apple',
      'Netflix', 'IBM', 'Oracle', 'Intel', 'Airbnb'
    ];
    
    const schools = [
      'Stanford University', 'MIT', 'Carnegie Mellon University',
      'University of California Berkeley', 'Harvard University',
      'Georgia Tech', 'Cornell University', 'University of Washington'
    ];
    
    const degrees = [
      'Bachelor of Science', 'Master of Science', 'PhD',
      'Bachelor of Arts', 'Master of Engineering'
    ];
    
    const fields = [
      'Computer Science', 'Software Engineering', 'Data Science',
      'Information Technology', 'Electrical Engineering',
      'Mathematics', 'Human-Computer Interaction'
    ];
    
    const skills = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
      'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'SQL', 'MongoDB',
      'Machine Learning', 'TensorFlow', 'Data Analysis', 'Git',
      'CI/CD', 'React Native', 'TypeScript', 'Django', 'Flask'
    ];
    
    const certifications = [
      'AWS Certified Solutions Architect', 'Google Cloud Professional',
      'Microsoft Certified: Azure Solutions', 'Certified Scrum Master',
      'TensorFlow Developer Certificate', 'MongoDB Certified Developer',
      'Oracle Certified Professional', 'Cisco Certified Network Associate'
    ];
    
    // Select data based on hash
    const jobCount = 1 + (hash % 4);
    const skillCount = 5 + (hash % 10);
    const certCount = hash % 3;
    
    // Generate experience
    const experience = [];
    for (let i = 0; i < jobCount; i++) {
      const title = jobTitles[(hash + i * 3) % jobTitles.length];
      const company = companies[(hash + i * 7) % companies.length];
      const years = 1 + ((hash + i) % 5);
      const duration = `${years} year${years > 1 ? 's' : ''}`;
      
      experience.push({ title, company, duration });
    }
    
    // Generate education
    const education = [];
    const schoolIndex = hash % schools.length;
    const degreeIndex = (hash + 3) % degrees.length;
    const fieldIndex = (hash + 5) % fields.length;
    
    education.push({
      school: schools[schoolIndex],
      degree: degrees[degreeIndex],
      field: fields[fieldIndex]
    });
    
    // Generate skills
    const selectedSkills = [];
    for (let i = 0; i < skillCount; i++) {
      const index = (hash + i * 11) % skills.length;
      if (!selectedSkills.includes(skills[index])) {
        selectedSkills.push(skills[index]);
      }
    }
    
    // Generate certifications
    const selectedCerts = [];
    for (let i = 0; i < certCount; i++) {
      const index = (hash + i * 13) % certifications.length;
      selectedCerts.push({
        name: certifications[index],
        issuer: companies[(hash + i * 17) % companies.length]
      });
    }
    
    return {
      name: this.capitalizeWords(`${username.replace(/[^a-zA-Z]/g, ' ')}`),
      headline: `${jobTitles[hash % jobTitles.length]} at ${companies[(hash + 2) % companies.length]}`,
      location: 'San Francisco Bay Area',
      summary: `Experienced ${jobTitles[hash % jobTitles.length]} with a passion for building innovative solutions. Skilled in ${selectedSkills.slice(0, 3).join(', ')}, and more.`,
      profileImage: `https://ui-avatars.com/api/?name=${username}&background=random`,
      experience,
      education,
      skills: selectedSkills,
      certifications: selectedCerts,
      recommendations: hash % 5
    };
  }
  
  // Simple hash function for generating deterministic but varied data
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  // Helper to capitalize words
  capitalizeWords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
}

module.exports = { LinkedInScraper };