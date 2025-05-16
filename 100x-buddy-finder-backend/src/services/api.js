import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Function to refresh the token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refresh_token: refreshToken
    });
    
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    return response.data.access_token;
  } catch (error) {
    // If refresh fails, redirect to login
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw error;
  }
};

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

// Handle token expiration
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) or 403 (Forbidden) and has specific token expired message
    // and we haven't tried to refresh the token yet
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      (error.response?.data?.error?.includes('token') || 
       error.response?.data?.error?.includes('expired') ||
       error.response?.data?.code === 'token_expired') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Refresh the token
        const newToken = await refreshToken();
        
        // Update the authorization header
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login (handled in refreshToken function)
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const analyzeGithub = (profileUrl) => {
  return api.post('/analysis/github', { profile_url: profileUrl });
};

export const analyzeLinkedin = (profileUrl) => {
  return api.post('/analysis/linkedin', { profile_url: profileUrl });
};

export const analyzeAllProfiles = () => {
  return api.post('/analysis/analyze-all');
};

export const sendMatchRequest = (receiverId, compatibilityScore, matchReason) => {
  return api.post('/match-requests/send', { receiverId, compatibilityScore, matchReason });
};

// Match requests
export const getOutgoingMatchRequests = () => {
  return api.get('/match-requests/outgoing');
};

export default api;