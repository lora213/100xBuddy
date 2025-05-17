'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function TestApiPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const testLogin = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    
    try {
      // Direct API call to test login
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setResponse(response.data);
      console.log('Login response:', response.data);
      
      // Extract and store the access token from Supabase response
      if (response.data.session && response.data.session.access_token) {
        localStorage.setItem('access_token', response.data.session.access_token);
        console.log('Access token stored in localStorage');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Get the full error details
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError({
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
        });
      } else if (err.request) {
        // The request was made but no response was received
        setError({
          message: 'No response received',
          request: err.request
        });
      } else {
        // Something happened in setting up the request
        setError({
          message: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const testProfile = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError({ message: 'No access token found. Please login first.' });
        setLoading(false);
        return;
      }
      
      // Direct API call to test profile fetch
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResponse(response.data);
      console.log('Profile response:', response.data);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      
      // Get the full error details
      if (err.response) {
        setError({
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
        });
      } else if (err.request) {
        setError({
          message: 'No response received',
          request: err.request
        });
      } else {
        setError({
          message: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Login</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </button>
            
            <button
              onClick={testProfile}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Profile Fetch'}
            </button>
          </div>
        </div>
        
        {response && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
        
        {error && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Error</h2>
            <pre className="bg-red-50 text-red-900 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
