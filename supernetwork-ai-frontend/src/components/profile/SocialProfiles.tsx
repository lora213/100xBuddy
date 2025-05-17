// src/components/profile/SocialProfiles.tsx
'use client';

import { useState, useEffect } from 'react';
import { profileApi, analysisApi } from '@/lib/api';
import { useCustomAuth } from '@/lib/custom-auth';

interface SocialProfile {
  id: string;
  platform_type: string;
  profile_url: string;
  analyzed: boolean;
  lastAnalyzed?: string;
}

export default function SocialProfiles() {
  const { user, token } = useCustomAuth();
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [newProfile, setNewProfile] = useState({ platform_type: 'github', profile_url: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load existing profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user || !token) return;
      
      try {
        const response = await profileApi.getSocialProfiles();
        setProfiles(response.data?.profiles || []);
      } catch (error) {
        console.error('Error loading social profiles:', error);
        setError('Failed to load your social profiles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [user, token]);
  
  // Add new profile
  const addProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProfile.profile_url.trim()) {
      setError('Please enter a valid profile URL');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await profileApi.addSocialProfile(newProfile);
      // Add new profile to the list
      setProfiles([...profiles, response.data.profile]);
      // Reset form
      setNewProfile({ platform_type: 'github', profile_url: '' });
      setSuccess(`${newProfile.platform_type.charAt(0).toUpperCase() + newProfile.platform_type.slice(1)} profile added successfully!`);
    } catch (error) {
      console.error('Error adding profile:', error);
      setError('Failed to add profile. Please check the URL and try again.');
    }
  };
  
  // Delete a profile
  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to remove this profile?')) return;
    
    try {
      await profileApi.deleteSocialProfile(profileId);
      setProfiles(profiles.filter(p => p.id !== profileId));
      setSuccess('Profile removed successfully');
    } catch (error) {
      console.error('Error removing profile:', error);
      setError('Failed to remove profile');
    }
  };
  
  // Analyze a specific profile
  const analyzeProfile = async (profile: SocialProfile) => {
    setAnalyzing(true);
    setError('');
    setSuccess('');
    
    try {
      if (profile.platform_type === 'github') {
        await analysisApi.analyzeGithub(profile.profile_url);
      } else if (profile.platform_type === 'linkedin') {
        await analysisApi.analyzeLinkedin(profile.profile_url);
      }
      
      // Update the analyzed status
      setProfiles(profiles.map(p => 
        p.id === profile.id 
          ? { ...p, analyzed: true, lastAnalyzed: new Date().toISOString() } 
          : p
      ));
      
      setSuccess(`${profile.platform_type.charAt(0).toUpperCase() + profile.platform_type.slice(1)} profile analyzed successfully!`);
    } catch (error) {
      console.error('Error analyzing profile:', error);
      setError('Failed to analyze profile. Please try again later.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Analyze all profiles
  const analyzeAll = async () => {
    if (profiles.length === 0) {
      setError('Add social profiles first to analyze them');
      return;
    }
    
    setAnalyzing(true);
    setError('');
    setSuccess('');
    
    try {
      await analysisApi.analyzeAllProfiles();
      
      // Update all profiles as analyzed
      setProfiles(profiles.map(p => ({ 
        ...p, 
        analyzed: true, 
        lastAnalyzed: new Date().toISOString() 
      })));
      
      setSuccess('All profiles analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing profiles:', error);
      setError('Failed to analyze profiles. Please try again later.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your social profiles...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Social Profiles
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Connect your professional profiles to improve your match quality.
        </p>
      </div>
      
      {error && (
        <div className="mx-4 mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mx-4 mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200">
        {/* List of connected profiles */}
        {profiles.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <li key={profile.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {profile.platform_type === 'github' ? (
                      <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                    ) : profile.platform_type === 'linkedin' ? (
                      <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                      </svg>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {profile.platform_type.charAt(0).toUpperCase() + profile.platform_type.slice(1)}
                      </p>
                      <p className="text-sm text-gray-500">
                        <a href={profile.profile_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {profile.profile_url}
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => analyzeProfile(profile)}
                      disabled={analyzing}
                      className="inline-flex items-center px-3 py-1 border border-indigo-300 text-sm leading-5 font-medium rounded-md text-indigo-700 bg-white hover:text-indigo-500 focus:outline-none focus:border-indigo-300 focus:shadow-outline-indigo active:text-indigo-800 active:bg-indigo-50 transition ease-in-out duration-150"
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-gray-300 focus:shadow-outline-gray active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {profile.analyzed && profile.lastAnalyzed && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Analyzed {new Date(profile.lastAnalyzed).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-10 sm:px-6 text-center">
            <p className="text-gray-500">You haven&apos;t connected any social profiles yet.</p>
          </div>
        )}
        
        {/* Add profile form */}
        <div className="px-4 py-5 bg-gray-50 sm:px-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Profile</h4>
          <form onSubmit={addProfile} className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-1/4">
              <select
                value={newProfile.platform_type}
                onChange={(e) => setNewProfile({ ...newProfile, platform_type: e.target.value })}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="portfolio">Portfolio/Website</option>
              </select>
            </div>
            <div className="flex-grow">
              <input
                type="url"
                value={newProfile.profile_url}
                onChange={(e) => setNewProfile({ ...newProfile, profile_url: e.target.value })}
                placeholder={`Enter your ${newProfile.platform_type} profile URL`}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Profile
            </button>
          </form>
        </div>
        
        {/* Analyze all profiles */}
        {profiles.length > 0 && (
          <div className="px-4 py-4 bg-gray-50 sm:px-6 border-t border-gray-200">
            <button
              onClick={analyzeAll}
              disabled={analyzing || profiles.length === 0}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing All Profiles...' : 'Analyze All Profiles'}
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              This will analyze all your connected profiles to improve match quality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}