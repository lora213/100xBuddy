'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Define the shape of our user object based on Supabase structure
interface User {
  id: string;
  email: string;
  full_name?: string;
  [key: string]: any; // Allow for any additional fields
}

// Define a session object structure (Supabase style)
interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  register: async () => false,
});

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Provider component
export const CustomAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      
      if (storedToken) {
        try {
          // Fetch the user profile with the token
          const response = await axios.get(`${API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          
          if (response.data && response.data.user) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            // Invalid response, clear token
            localStorage.removeItem('access_token');
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('access_token');
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      // Handle Supabase auth response structure
      if (response.data && response.data.session && response.data.session.access_token) {
        const { session } = response.data;
        
        // Store the access token in localStorage
        localStorage.setItem('access_token', session.access_token);
        
        // Also store refresh token if needed
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token);
        }
        
        setToken(session.access_token);
        setUser(session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setToken(null);
    router.push('/custom-login');
  };

  // Register function
  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        full_name: fullName,
      });

      // Auto-login after registration
      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to the auth context
export const useCustomAuth = () => useContext(AuthContext);

