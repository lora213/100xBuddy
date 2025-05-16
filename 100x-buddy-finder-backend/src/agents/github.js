// agents/github.js
const axios = require('axios');
require('dotenv').config();

class GitHubAgent {
  constructor() {
    this.version = '1.0.0';
    this.apiUrl = 'https://api.github.com';
    
    // Initialize axios with headers for GitHub API
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }
  
  // Extract username from GitHub URL
  getUsernameFromUrl(url) {
    try {
      // Handle different URL formats
      // github.com/username
      // github.com/username/repo
      // https://github.com/username
      
      // Remove protocol and www if present
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      
      // Split by slashes
      const parts = cleanUrl.split('/');
      
      // Find the part after github.com
      let usernameIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'github.com') {
          usernameIndex = i + 1;
          break;
        }
      }
      
      if (usernameIndex === -1 || usernameIndex >= parts.length) {
        throw new Error('Invalid GitHub URL format');
      }
      
      return parts[usernameIndex];
    } catch (error) {
      throw new Error(`Could not extract username from URL: ${error.message}`);
    }
  }
  
  // Analyze a GitHub profile
  async analyze(profileUrl) {
    try {
      console.log(`Analyzing GitHub profile: ${profileUrl}`);
      
      const username = this.getUsernameFromUrl(profileUrl);
      console.log(`Extracted username: ${username}`);
      
      // Get user data
      const { data: user } = await this.api.get(`/users/${username}`);
      
      // Get repositories
      const { data: repos } = await this.api.get(`/users/${username}/repos?sort=updated&per_page=100`);
      console.log(`Found ${repos.length} repositories`);
      
      // Analyze repositories
      const repoAnalysis = this.analyzeRepositories(repos);
      
      // Create skills map
      const skillsMap = this.createSkillsMap(repos, repoAnalysis);
      
      // Calculate scores
      const scores = this.calculateScores(user, repos, repoAnalysis, skillsMap);
      
      // Prepare summary
      const summary = this.createSummary(user, repos, repoAnalysis, skillsMap, scores);
      
      return {
        raw: {
          user,
          repositories: repos.map(repo => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            topics: repo.topics,
          })),
          analysis: repoAnalysis,
          skills: skillsMap,
        },
        summary,
        scores,
        version: this.version,
      };
    } catch (error) {
      console.error('GitHub analysis error:', error);
      throw new Error(`GitHub analysis failed: ${error.message}`);
    }
  }
  
  // Analyze repositories
  analyzeRepositories(repos) {
    // Skip forks and focus on original repos
    const originalRepos = repos.filter(repo => !repo.fork);
    
    // Get language stats
    const languages = {};
    originalRepos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });
    
    // Get top language
    let topLanguage = null;
    let topCount = 0;
    Object.entries(languages).forEach(([lang, count]) => {
      if (count > topCount) {
        topLanguage = lang;
        topCount = count;
      }
    });
    
    // Calculate repo complexity scores
    const repoScores = originalRepos.map(repo => {
      // Base score
      let score = 1;
      
      // Add points for stars and forks
      score += Math.min(3, Math.log10(repo.stargazers_count + 1));
      score += Math.min(2, Math.log10(repo.forks_count + 1));
      
      // Add points for description
      if (repo.description && repo.description.length > 30) {
        score += 0.5;
      }
      
      // Add points for topics
      if (repo.topics && repo.topics.length > 0) {
        score += Math.min(1, repo.topics.length / 5);
      }
      
      return {
        name: repo.name,
        score: Math.min(5, score),
        language: repo.language,
        complexity_factors: {
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          has_description: !!repo.description,
          topic_count: repo.topics ? repo.topics.length : 0,
        },
      };
    });
    
    // Sort by score
    repoScores.sort((a, b) => b.score - a.score);
    
    return {
      top_language: topLanguage,
      language_counts: languages,
      repository_count: originalRepos.length,
      repo_scores: repoScores,
      avg_complexity: repoScores.length > 0 
        ? repoScores.reduce((sum, repo) => sum + repo.score, 0) / repoScores.length 
        : 0,
    };
  }
  
  // Create skills map from repos
  createSkillsMap(repos, analysis) {
    const skills = {
      languages: {},
      frameworks: {},
      tools: {},
    };
    
    // Common frameworks and tools
    const frameworkKeywords = [
      'react', 'angular', 'vue', 'next', 'nuxt', 'express', 'django', 'flask',
      'spring', 'rails', 'laravel', 'symfony', 'gatsby', 'bootstrap', 'tailwind',
      'tensorflow', 'pytorch', 'redux', 'graphql', 'apollo', 'svelte', 'jquery'
    ];
    
    const toolKeywords = [
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'webpack',
      'babel', 'jest', 'mocha', 'cypress', 'selenium', 'github-actions', 'travis',
      'jenkins', 'circleci', 'mongodb', 'mysql', 'postgresql', 'redis', 'firebase'
    ];
    
    // Add language skills from repo languages
    Object.entries(analysis.language_counts).forEach(([lang, count]) => {
      skills.languages[lang] = {
        name: lang,
        count: count,
        skill_level: Math.min(5, 1 + Math.log10(count + 1)),
      };
    });
    
    // Analyze repos for frameworks and tools
    repos.forEach(repo => {
      const lowercaseDesc = repo.description ? repo.description.toLowerCase() : '';
      const lowercaseName = repo.name.toLowerCase();
      const topics = repo.topics || [];
      
      // Check name, description, and topics for frameworks
      frameworkKeywords.forEach(keyword => {
        if (
          lowercaseName.includes(keyword) || 
          lowercaseDesc.includes(keyword) ||
          topics.some(topic => topic.toLowerCase().includes(keyword))
        ) {
          const name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          if (!skills.frameworks[name]) {
            skills.frameworks[name] = {
              name,
              count: 0,
              skill_level: 0,
            };
          }
          skills.frameworks[name].count += 1;
          skills.frameworks[name].skill_level = Math.min(
            5, 
            1 + Math.log10(skills.frameworks[name].count + 1)
          );
        }
      });
      
      // Check for tools
      toolKeywords.forEach(keyword => {
        if (
          lowercaseName.includes(keyword) || 
          lowercaseDesc.includes(keyword) ||
          topics.some(topic => topic.toLowerCase().includes(keyword))
        ) {
          const name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          if (!skills.tools[name]) {
            skills.tools[name] = {
              name,
              count: 0,
              skill_level: 0,
            };
          }
          skills.tools[name].count += 1;
          skills.tools[name].skill_level = Math.min(
            5, 
            1 + Math.log10(skills.tools[name].count + 1)
          );
        }
      });
    });
    
    return skills;
  }
  
  // Calculate scores for matching
  calculateScores(user, repos, analysis, skillsMap) {
    // Profile quality score
    const profileQualityScore = this.calculateProfileQuality(user);
    
    // Technical scores
    const languageScore = this.calculateLanguageScore(analysis, skillsMap);
    const frameworkScore = this.calculateFrameworkScore(skillsMap);
    const complexityScore = Math.min(5, Math.round(analysis.avg_complexity));
    const problemSolvingScore = this.calculateProblemSolvingScore(repos, analysis);
    
    return {
      profile_quality: profileQualityScore,
      technical: {
        languages: languageScore,
        frameworks: frameworkScore,
        complexity: complexityScore,
        problem_solving: problemSolvingScore,
      },
    };
  }
  
  // Calculate profile quality score
  calculateProfileQuality(user) {
    let score = 1; // Base score
    
    // Has bio
    if (user.bio) {
      score += 1;
    }
    
    // Has avatar
    if (user.avatar_url && !user.avatar_url.includes('gravatar')) {
      score += 0.5;
    }
    
    // Has name
    if (user.name) {
      score += 0.5;
    }
    
    // Has location
    if (user.location) {
      score += 0.5;
    }
    
    // Account age (max 1 point for accounts older than 2 years)
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const ageInYears = (now - createdAt) / (1000 * 60 * 60 * 24 * 365);
    score += Math.min(1, ageInYears / 2);
    
    // Activity (max 1 point for more than 100 contributions)
    score += Math.min(1, user.public_repos / 10);
    
    return Math.min(5, Math.round(score));
  }
  
  // Calculate language score
  calculateLanguageScore(analysis, skillsMap) {
    const languageSkills = Object.values(skillsMap.languages);
    
    if (languageSkills.length === 0) {
      return 1; // Minimum score
    }
    
    // Calculate weighted average based on usage count
    const totalCount = languageSkills.reduce((sum, skill) => sum + skill.count, 0);
    
    const weightedSum = languageSkills.reduce(
      (sum, skill) => sum + (skill.skill_level * skill.count),
      0
    );
    
    return Math.min(5, Math.round(weightedSum / totalCount));
  }
  
  // Calculate framework score
  calculateFrameworkScore(skillsMap) {
    const frameworkSkills = Object.values(skillsMap.frameworks);
    const toolSkills = Object.values(skillsMap.tools);
    
    // Combine frameworks and tools
    const allSkills = [...frameworkSkills, ...toolSkills];
    
    if (allSkills.length === 0) {
      return 2; // Base score if no frameworks detected
    }
    
    // Calculate average skill level
    const totalSkillLevel = allSkills.reduce((sum, skill) => sum + skill.skill_level, 0);
    const avgSkillLevel = totalSkillLevel / allSkills.length;
    
    // Adjust based on number of frameworks/tools
    const diversityBonus = Math.min(1, allSkills.length / 5);
    
    return Math.min(5, Math.round(avgSkillLevel + diversityBonus));
  }
  
  // Calculate problem solving score
  calculateProblemSolvingScore(repos, analysis) {
    if (repos.length === 0) {
      return 1; // Minimum score
    }
    
    // Consider factors like:
    // 1. Diversity of languages
    const languageCount = Object.keys(analysis.language_counts).length;
    const languageDiversity = Math.min(1, languageCount / 3);
    
    // 2. Repository quality
    const topRepos = analysis.repo_scores.slice(0, 3);
    const avgTopRepoScore = topRepos.length > 0
      ? topRepos.reduce((sum, repo) => sum + repo.score, 0) / topRepos.length
      : 0;
    
    // 3. Activity level
    // Calculate how many repos were active in the last year
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    const activeRepos = repos.filter(repo => {
      const updatedAt = new Date(repo.updated_at);
      return updatedAt > oneYearAgo;
    });
    
    const activityScore = Math.min(1, activeRepos.length / 5);
    
    // 4. Base score plus factors
    const baseScore = 2;
    const finalScore = baseScore + languageDiversity + (avgTopRepoScore / 5) + activityScore;
    
    return Math.min(5, Math.round(finalScore));
  }
  
  // Create a summary of the analysis
  createSummary(user, repos, analysis, skillsMap, scores) {
    // Format languages section
    const topLanguages = Object.entries(analysis.language_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => ({ name: lang, count }));
    
    // Format frameworks section
    const frameworks = Object.values(skillsMap.frameworks)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Format tools section
    const tools = Object.values(skillsMap.tools)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate stats
    const totalRepos = repos.length;
    const originalRepos = repos.filter(repo => !repo.fork).length;
    const starsCount = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const forksCount = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    // Get account age
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const ageInYears = ((now - createdAt) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

      // Add a summary text generation
    const summaryText = `${user.name}'s GitHub profile shows strong expertise in ${topLanguages[0]?.name || 'programming'} 
      with ${originalRepos} original repositories. They demonstrate ${
    scores.technical.complexity >= 4 ? 'advanced' : 
    scores.technical.complexity >= 3 ? 'intermediate' : 'basic'
    } project complexity and ${
    scores.technical.problem_solving >= 4 ? 'excellent' : 
    scores.technical.problem_solving >= 3 ? 'good' : 'developing'
    } problem-solving skills. Their profile is ${
    scores.profile_quality >= 4 ? 'very comprehensive' : 
    scores.profile_quality >= 3 ? 'well-maintained' : 'still developing'
    }.`;

    // Calculate alignment score based on comprehensive profile metrics
    const alignmentScore = Math.round(
    (scores.technical.languages * 0.25) + 
    (scores.technical.frameworks * 0.25) + 
    (scores.technical.complexity * 0.25) + 
    (scores.technical.problem_solving * 0.25)
    ) * 20; // Convert 1-5 scale to 1-100
    
    return {
      user: {
        username: user.login,
        name: user.name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        account_age: `${ageInYears} years`,
      },
      stats: {
        total_repositories: totalRepos,
        original_repositories: originalRepos,
        stars: starsCount,
        forks: forksCount,
      },
      skills: {
        top_languages: topLanguages,
        frameworks,
        tools,
      },
      scores: {
        profile_quality: scores.profile_quality,
        languages: scores.technical.languages,
        frameworks: scores.technical.frameworks,
        complexity: scores.technical.complexity,
        problem_solving: scores.technical.problem_solving,
      },
      featured_repositories: analysis.repo_scores
        .slice(0, 3)
        .map(repo => ({ name: repo.name, score: repo.score })),
      summary_text: summaryText,
      alignment_score: alignmentScore
    };
  }
}

// Export an instance of the agent
const githubAgent = new GitHubAgent();
module.exports = { githubAgent };