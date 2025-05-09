// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, getSocialProfiles, getMatches } from '../services/api';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        
        // Get user profile
        const profileRes = await getProfile();
        setProfile(profileRes.data.user);
        
        // Get social profiles
        const socialRes = await getSocialProfiles();
        setSocialProfiles(socialRes.data.social_profiles || []);
        
        // Get matches
        try {
          const matchesRes = await getMatches();
          setMatches(matchesRes.data.matches || []);
        } catch (matchError) {
          console.log('No matches yet or error fetching matches');
        }
        
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">
        Welcome, {profile?.full_name || 'User'}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Completion Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">Complete Your Profile</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Add your information to find the perfect coding buddy.
            </p>
            
            <ul className="space-y-2">
              {!profile?.learning_style && (
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Add your learning style</span>
                </li>
              )}
              
              {socialProfiles.length === 0 && (
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Connect your social profiles</span>
                </li>
              )}
              
              {!profile?.collaboration_preference && (
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Set collaboration preferences</span>
                </li>
              )}
            </ul>
            
            <Link 
              to="/profile" 
              className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            >
              Update Profile
            </Link>
          </div>
        </div>
        
        {/* Social Profiles Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">Social Profiles</h2>
          
          {socialProfiles.length > 0 ? (
            <div>
              <ul className="space-y-3">
                {socialProfiles.map(profile => (
                  <li key={profile.id} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{profile.platform_type}</span>
                    {profile.last_analyzed ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Analyzed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Not Analyzed
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">
              No social profiles connected yet.
            </p>
          )}
          
          <div className="mt-4">
            <Link 
              to="/profile" 
              className="inline-block text-indigo-600 hover:underline"
            >
              Manage Social Profiles
            </Link>
          </div>
        </div>
        
        {/* Matches Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">Your Matches</h2>
          
          {matches.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matches.slice(0, 2).map(match => (
                  <div key={match.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg">{match.matched_user.full_name}</h3>
                      <span className="bg-indigo-100 text-indigo-800 text-sm py-1 px-2 rounded-full">
                        {match.compatibility_score}% Match
                      </span>
                    </div>
                    <Link 
                      to="/matches" 
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/matches" 
                className="inline-block text-indigo-600 hover:underline"
              >
                View All Matches
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No matches found yet. Complete your profile and analyze your social profiles to find matches.
              </p>
              <Link 
                to="/profile" 
                className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                Complete Your Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}