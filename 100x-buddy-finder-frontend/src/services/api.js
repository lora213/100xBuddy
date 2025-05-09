// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (email, password, full_name) => {
  return api.post('/auth/register', { email, password, full_name });
};

// Profile endpoints
export const getProfile = () => {
  return api.get('/profile');
};

export const updatePreferences = (preferences) => {
  return api.put('/profile/preferences', preferences);
};

export const addSocialProfile = (profile) => {
  return api.post('/profile/social-profile', profile);
};

export const getSocialProfiles = () => {
  return api.get('/profile/social-profiles');
};

export const addSkills = (skills) => {
  return api.post('/profile/skills', { skills });
};

// Matches endpoints
export const findMatches = () => {
  return api.post('/matches/find');
};

export const getMatches = () => {
  return api.get('/matches');
};

export const updateMatchStatus = (matchId, status) => {
  return api.put(`/matches/${matchId}/status`, { status });
};

// In src/services/api.js (add these if they don't exist)
export const analyzeGithub = (profileUrl) => {
  return api.post('/analysis/github', { profile_url: profileUrl });
};

export const analyzeLinkedin = (profileUrl) => {
  return api.post('/analysis/linkedin', { profile_url: profileUrl });
};

export const analyzeAllProfiles = () => {
  return api.post('/analysis/analyze-all');
};

export default api;