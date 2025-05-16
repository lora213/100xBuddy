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

export const joinWaitlist = (email) => {
  return api.post('/auth/waitlist', { email });
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

export const analyzeGithub = (profileUrl) => {
  return api.post('/analysis/github', { profile_url: profileUrl });
};

export const analyzeLinkedin = (profileUrl) => {
  return api.post('/analysis/linkedin', { profile_url: profileUrl });
};

export const analyzeAllProfiles = () => {
  return api.post('/analysis/analyze-all');
};

export const getProfileSummaries = (platform = null) => {
  const url = platform 
    ? `/analysis/profile-summaries?platform=${platform}`
    : '/analysis/profile-summaries';
  return api.get(url);
};

export const updateProfile = (profileData) => {
  return api.put('/profile', profileData);
};

export const getProfileAlignmentScores = () => {
  return api.get('/analysis/profile-alignment-scores');
};

export const getBuddyMatchScore = () => {
  return api.get('/analysis/buddy-match-score');
};

export const saveCompleteProfile = (profileData) => {
  return api.post('/profile/complete', profileData);
};

export const deleteSocialProfile = (profileId) => {
  return api.delete(`/profile/social-profile/${profileId}`);
};


export const getAnalysisScores = () => {
  return api.get('/analysis/scores');
};

export const getAnalysisReports = () => {
  return api.get('/analysis/analysis-reports');
};

// Match requests
export const sendMatchRequest = (receiverId, compatibilityScore, matchReason) => {
  return api.post('/match-requests/send', { receiverId, compatibilityScore, matchReason });
};

export const acceptMatchRequest = (requestId) => {
  return api.post(`/match-requests/${requestId}/accept`);
};

export const rejectMatchRequest = (requestId) => {
  return api.post(`/match-requests/${requestId}/reject`);
};

export const getIncomingMatchRequests = () => {
  return api.get('/match-requests/incoming');
};

export const getOutgoingMatchRequests = () => {
  return api.get('/match-requests/outgoing');
};


// Notifications
export const getNotifications = (page = 1, limit = 20, unread = false) => {
  return api.get(`/notifications?page=${page}&limit=${limit}&unread=${unread}`);
};

export const markNotificationAsRead = (notificationId) => {
  return api.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.put('/notifications/read-all');
};

// Connections
export const getConnections = () => {
  return api.get('/connections');
};

export const getConnectionDetails = (connectionId) => {
  return api.get(`/connections/${connectionId}`);
};


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an invalid/expired token and we haven't tried to refresh yet
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Use Supabase's refresh token functionality
        const { data } = await api.post('/auth/refresh');
        
        // Store the new token
        localStorage.setItem('token', data.token);
        
        // Update the Authorization header
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;