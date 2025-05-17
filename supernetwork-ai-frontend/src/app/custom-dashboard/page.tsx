'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomAuth } from '@/lib/custom-auth';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CustomDashboard() {
  const { user, token, isLoading, logout } = useCustomAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setProfile(response.data.user);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }

    if (user && token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-700 mb-4">You must be logged in to view this page.</p>
          <Link
            href="/custom-login"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Extract user name or email to display
  const displayName = user.name || user.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">SuperNetworkAI Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {displayName}!
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Here&apos;s your SuperNetworkAI overview.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Profile Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {!profile || !profile.ikigai ? (
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                        Incomplete
                      </span>
                      <Link 
                        href="/profile/ikigai"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Complete your Ikigai profile
                      </Link>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Complete
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-lg font-medium text-gray-900 truncate">
                    Your Profile
                  </dt>
                  <dd className="flex items-center text-sm text-gray-500">
                    Manage your profile information
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link 
                  href="/profile"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View Profile <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Test API Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-lg font-medium text-gray-900 truncate">
                    Test API
                  </dt>
                  <dd className="flex items-center text-sm text-gray-500">
                    Test your API connections
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link 
                  href="/test-api"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Go to API Test <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Ikigai Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-lg font-medium text-gray-900 truncate">
                    Ikigai Profile
                  </dt>
                  <dd className="flex items-center text-sm text-gray-500">
                    Set up your Ikigai profile
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link 
                  href="/profile/ikigai"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {!profile || !profile.ikigai ? 'Set up your Ikigai' : 'View your Ikigai'} <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Raw Token Info (for debugging) */}
        <div className="mt-8 bg-gray-50 p-4 rounded border border-gray-200">
          <h3 className="text-md font-medium text-gray-700 mb-2">Auth Debug Info</h3>
          <div className="text-xs font-mono overflow-auto max-h-32 bg-gray-100 p-2 rounded">
            <p>User ID: {user?.id}</p>
            <p>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}