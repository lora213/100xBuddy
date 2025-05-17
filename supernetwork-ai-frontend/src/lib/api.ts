'use client';

import axios, { AxiosInstance } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// API URLs based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Creates and configures an Axios instance for API requests
 */
const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for adding auth token
  api.interceptors.request.use(
    async (config) => {
      if (typeof window !== 'undefined') {
        const session = await getSession();
        const token = session?.token || localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for handling auth errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
          if (data.session && data.session.access_token) {
            localStorage.setItem('access_token', data.session.access_token);
            if (data.session.refresh_token) {
              localStorage.setItem('refresh_token', data.session.refresh_token);
            }
            originalRequest.headers['Authorization'] = `Bearer ${data.session.access_token}`;
            api.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`;
            return api(originalRequest);
          } else {
            throw new Error('Invalid refresh token response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          signOut({ callbackUrl: '/custom-login' });
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const apiInstance = createApiClient();

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) => apiInstance.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    apiInstance.post('/auth/register', { email, password, full_name }),
  joinWaitlist: (email: string) => apiInstance.post('/auth/waitlist', { email }),
};

// Profile endpoints
export const profileApi = {
  getProfile: () => apiInstance.get('/profile'),
  updatePreferences: (preferences: any) => apiInstance.put('/profile/preferences', preferences),
  addSocialProfile: (profile: { platform_type: string, profile_url: string }) =>
    apiInstance.post('/profile/social-profile', profile),
  getSocialProfiles: () => apiInstance.get('/profile/social-profiles'),
  addSkills: (skills: any[]) => apiInstance.post('/profile/skills', { skills }),
  updateProfile: (profileData: any) => apiInstance.put('/profile', profileData),
  saveCompleteProfile: (profileData: any) => apiInstance.post('/profile/complete', profileData),
  deleteSocialProfile: (profileId: string) => apiInstance.delete(`/profile/social-profile/${profileId}`),
};

// Matches endpoints
export const matchesApi = {
  findMatches: () => apiInstance.post('/matches/find'),
  getMatches: () => apiInstance.get('/matches'),
  updateMatchStatus: (matchId: string, status: string) =>
    apiInstance.put(`/matches/${matchId}/status`, { status }),
  sendMatchRequest: (receiverId: string, compatibilityScore: number, matchReason: string) =>
    apiInstance.post('/match-requests/send', { receiverId, compatibilityScore, matchReason }),
  acceptMatchRequest: (requestId: string) => apiInstance.post(`/match-requests/${requestId}/accept`),
  rejectMatchRequest: (requestId: string) => apiInstance.post(`/match-requests/${requestId}/reject`),
  getIncomingMatchRequests: () => apiInstance.get('/match-requests/incoming'),
  getOutgoingMatchRequests: () => apiInstance.get('/match-requests/outgoing'),
};

// Analysis endpoints
export const analysisApi = {
  analyzeGithub: (profileUrl: string) => apiInstance.post('/analysis/github', { profile_url: profileUrl }),
  analyzeLinkedin: (profileUrl: string) => apiInstance.post('/analysis/linkedin', { profile_url: profileUrl }),
  analyzeAllProfiles: () => apiInstance.post('/analysis/analyze-all'),
  getProfileSummaries: (platform: string | null = null) => {
    const url = platform ? `/analysis/profile-summaries?platform=${platform}` : '/analysis/profile-summaries';
    return apiInstance.get(url);
  },
  getProfileAlignmentScores: () => apiInstance.get('/analysis/profile-alignment-scores'),
  getBuddyMatchScore: () => apiInstance.get('/analysis/buddy-match-score'),
  getAnalysisScores: () => apiInstance.get('/analysis/scores'),
  getAnalysisReports: () => apiInstance.get('/analysis/analysis-reports'),
};

// Notifications endpoints
export const notificationsApi = {
  getNotifications: (page = 1, limit = 20, unread = false) =>
    apiInstance.get(`/notifications?page=${page}&limit=${limit}&unread=${unread}`),
  markNotificationAsRead: (notificationId: string) =>
    apiInstance.put(`/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => apiInstance.put('/notifications/read-all'),
};

// Connections endpoints
export const connectionsApi = {
  getConnections: () => apiInstance.get('/connections'),
  getConnectionDetails: (connectionId: string) => apiInstance.get(`/connections/${connectionId}`),
};

// AI Integration - Placeholder for Step 3
export const aiApi = {
  generateMatchExplanation: async (user1: any, user2: any, matchType: string) => {
    return {
      explanation: `Based on your profiles, you both seem to have complementary skills and interests that would make a great ${matchType} relationship.`
    };
  },
  processNaturalLanguageQuery: async (query: string, userContext: any) => {
    return {
      matchType: "any",
      skills: [],
      experience: "any",
      availability: "any",
      purpose: query
    };
  }
};

// Create a wrapper for handling server-side API calls (no browser APIs)
export const createServerApi = (token?: string) => {
  const serverApi = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  });
  return serverApi;
};

// Working Style endpoints
export const workingStyleApi = {
  // Save or create working style data
  saveWorkingStyle: (data: any, token?: string) => {
    return apiInstance.post('/profile/working-style', data, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
  },
  
  // Get working style data
  getWorkingStyle: () => {
    return apiInstance.get('/profile/working-style');
  },
  
  // Update working style data
  updateWorkingStyle: (data: any, token?: string) => {
    return apiInstance.put('/profile/working-style', data, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
  }
};

// Export the saveWorkingStyle function directly for backward compatibility
export const saveWorkingStyle = workingStyleApi.saveWorkingStyle;

// Export the instance for direct use
export default apiInstance;