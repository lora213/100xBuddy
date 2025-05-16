// pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, getSocialProfiles, getMatches, getAnalysisScores, getBuddyMatchScore } from '../services/api';
import ProfileMatchIndicator from '../components/ProfileMatchIndicator';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [scores, setScores] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buddyMatchScore, setBuddyMatchScore] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch profile data
      const profileRes = await getProfile();
      if (profileRes.data.user) {
        setUser(profileRes.data.user);
      }

      // Fetch social profiles
      const socialRes = await getSocialProfiles();
      if (socialRes.data.socialProfiles) {
        setSocialProfiles(socialRes.data.socialProfiles);
      }

      // Try to fetch analysis scores
      try {
        const scoresRes = await getAnalysisScores();
        if (scoresRes.data.scores) {
          setScores(scoresRes.data.scores);
        }
      } catch (scoresErr) {
        console.error('Error fetching scores:', scoresErr);
        // Don't set main error for this
      }

      // Fetch buddy match score
      try {
        const buddyScoreRes = await getBuddyMatchScore();
        if (buddyScoreRes.data) {
          setBuddyMatchScore(buddyScoreRes.data);
        }
      } catch (buddyScoreErr) {
        console.error('Error fetching buddy match score:', buddyScoreErr);

      }

      // Try to fetch matches
      try {
        const matchesRes = await getMatches();
        if (matchesRes.data.matches) {
          setMatches(matchesRes.data.matches);
        }
      } catch (matchesErr) {
        console.error('Error fetching matches:', matchesErr);
        // Don't set main error for this
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.full_name || 'User'}!</h1>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Complete Your Profile</h2>
            <Link
              to="/profile"
              className="bg-indigo-600 text-white py-1 px-3 rounded text-sm hover:bg-indigo-700"
            >
              Update Profile
            </Link>
          </div>

          <p className="text-gray-600 mb-4">
            Add your information to find the perfect coding buddy.
          </p>

          <ul className="space-y-2 mb-4">
            <li className="flex items-center">
              <div className={`mr-2 w-5 h-5 rounded-full flex items-center justify-center ${
                user?.full_name ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <span className="text-sm">✓</span>
              </div>
              <span className={user?.full_name ? '' : 'text-gray-400'}>
                Basic Info {user?.full_name ? '(Complete)' : '(Incomplete)'}
              </span>
            </li>
            
            <li className="flex items-center">
              <div className={`mr-2 w-5 h-5 rounded-full flex items-center justify-center ${
                socialProfiles.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <span className="text-sm">✓</span>
              </div>
              <span className={socialProfiles.length > 0 ? '' : 'text-gray-400'}>
                Connect social profiles {socialProfiles.length > 0 ? `(${socialProfiles.length} connected)` : '(None connected)'}
              </span>
            </li>
            
            <li className="flex items-center">
              <div className={`mr-2 w-5 h-5 rounded-full flex items-center justify-center ${
                scores?.technical_skills ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <span className="text-sm">✓</span>
              </div>
              <span className={scores?.technical_skills ? '' : 'text-gray-400'}>
                Analyze profiles {scores?.technical_skills ? '(Complete)' : '(Pending)'}
              </span>
            </li>
          </ul>
        </div>

        {/* Social Profiles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Social Profiles</h2>
            <Link
              to="/profile"
              className="bg-indigo-600 text-white py-1 px-3 rounded text-sm hover:bg-indigo-700"
            >
              Manage Social Profiles
            </Link>
          </div>

          {socialProfiles.length > 0 ? (
            <ul className="space-y-2">
              {socialProfiles.map(profile => (
                <li key={profile.id} className="flex items-center p-2 border rounded">
                  <div className="capitalize font-medium">{profile.platform_type}</div>
                  <div className="ml-3 text-gray-600 truncate flex-1">
                    {profile.profile_url}
                  </div>
                  {profile.last_analyzed && (
                    <div className="text-xs text-gray-500">
                      Analyzed: {new Date(profile.last_analyzed).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No social profiles connected yet.</p>
              <Link
                to="/profile"
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Connect Profiles
              </Link>
            </div>
          )}
        </div>

        {/* Your Matches */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Matches</h2>
            <Link
              to="/matches"
              className="bg-indigo-600 text-white py-1 px-3 rounded text-sm hover:bg-indigo-700"
            >
              View All Matches
            </Link>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matches.slice(0, 3).map(match => (
                <div key={match.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{match.matched_user.full_name}</h3>
                    <div className="bg-indigo-100 text-indigo-800 text-xs font-medium rounded px-2 py-1">
                      {match.compatibility_score}% Match
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{match.matched_user.email}</div>
                  <div className={`text-xs py-1 px-2 rounded-full inline-block ${
                    match.status === 'accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : match.status === 'rejected'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No matches found yet. Complete your profile and analyze your social profiles to find matches.</p>
              <Link
                to="/matches"
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Find Matches
              </Link>
            </div>
          )}
        </div>

        {/* Technical Skills Summary */}
        {scores?.technical_skills && (
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Technical Skills and Analysis Scores</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scores.technical_skills).map(([skill, data]) => (
                <div key={skill} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium capitalize">
                    {skill.replace(/_/g, ' ')}
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {typeof data === 'object' ? data.score : data}/5
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {buddyMatchScore && (
      <div className="md:col-span-1">
        <ProfileMatchIndicator 
         buddyMatchScore={buddyMatchScore.buddyMatchScore} 
         componentScores={buddyMatchScore.componentScores}
        />
      </div>
    )}
    </div>
  );
}
