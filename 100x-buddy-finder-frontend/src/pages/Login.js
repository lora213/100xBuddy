// src/pages/Login.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, joinWaitlist } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await login(email, password);
      
      // Save auth token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!waitlistEmail) {
      setError('Email is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await joinWaitlist(waitlistEmail);
      
      setWaitlistSuccess(true);
      setWaitlistEmail('');
    } catch (err) {
      console.error('Waitlist error:', err);
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Buddy Finder</h1>
          <p className="text-gray-600 mt-2">Sign in to find your buddy</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {waitlistSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Thank you for joining our waitlist! We'll notify you when we launch.
          </div>
        )}
        
        {!showWaitlist ? (
          // Login Form
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Sign up</Link>
              </p>
              <p className="text-gray-600 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowWaitlist(true)}
                  className="text-indigo-600 hover:underline"
                >
                  Join our waitlist
                </button>
              </p>
            </div>
          </form>
        ) : (
          // Waitlist Form
          <form onSubmit={handleJoinWaitlist}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Our Waitlist</h2>
              <p className="text-gray-600 mb-4">
                Be the first to know when we launch! Enter your email below to join our waitlist.
              </p>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="you@example.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </button>
            
            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => setShowWaitlist(false)}
                className="text-indigo-600 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}