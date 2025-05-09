// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { getProfile, getSocialProfiles, updatePreferences, addSocialProfile, analyzeAllProfiles, addSkills } from '../services/api';

export default function Profile() {
  // User profile state
  const [profile, setProfile] = useState(null);
  const [socialProfiles, setSocialProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [collaborationPreference, setCollaborationPreference] = useState('');
  const [careerGoals, setCareerGoals] = useState([]);
  const [mentorshipType, setMentorshipType] = useState('');
  
  // Social profile form
  const [platformType, setPlatformType] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  
  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
  async function loadProfileData() {
  try {
    setLoading(true);
    console.log("Fetching profile data...");
    
    // Get user profile
    const profileRes = await getProfile();
    console.log("Profile response:", profileRes.data);
    
    const userData = profileRes.data.user || {};
    setProfile(userData);
    
    // Set form values (with fallbacks for missing data)
    setFullName(userData.full_name || '');
    setLearningStyle(userData.learning_style || '');
    setCollaborationPreference(userData.collaboration_preference?.toString() || '');
    setCareerGoals(Array.isArray(userData.career_goals) ? userData.career_goals : []);
    setMentorshipType(userData.mentorship_type || '');
    
    // Get social profiles (ensure we're using the right property name)
    const socialProfiles = profileRes.data.socialProfiles || [];
    setSocialProfiles(socialProfiles);
    
  } catch (err) {
    console.error('Profile loading error:', err);
    setError('Failed to load profile: ' + (err.response?.data?.error || err.message));
  } finally {
    setLoading(false);
  }
  }
    
    loadProfileData();
  }, []);
  
  // Update user preferences
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSavingProfile(true);
      
      await updatePreferences({
        full_name: fullName,
        learning_style: learningStyle,
        collaboration_preference: collaborationPreference,
        career_goals: careerGoals,
        mentorship_type: mentorshipType
      });
      
      setError('');
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Add social profile
  const handleAddSocialProfile = async (e) => {
    e.preventDefault();
    
    if (!platformType || !profileUrl) {
      setError('Platform type and profile URL are required');
      return;
    }
    
    try {
      setAddingProfile(true);
      setError('');
      
      const response = await addSocialProfile({
        platform_type: platformType,
        profile_url: profileUrl
      });
      
      console.log("Add profile response:", response.data);
      
      // Update the social profiles with the returned data
      if (response.data.socialProfiles) {
        setSocialProfiles(response.data.socialProfiles);
      } else {
        // Alternatively, fetch all profiles again
        const profilesResponse = await getSocialProfiles();
        setSocialProfiles(profilesResponse.data.socialProfiles || []);
      }
      
      // Reset form
      setPlatformType('');
      setProfileUrl('');
      
    } catch (err) {
      console.error('Add social profile error:', err);
      setError(err.response?.data?.error || 'Failed to add social profile');
    } finally {
      setAddingProfile(false);
    }
  };  

  const handleAnalyzeProfiles = async () => {
    if (socialProfiles.length === 0) {
      setError('No social profiles to analyze');
      return;
    }
    
    try {
      setAnalyzing(true);  // Show loading state
      setError('');        // Clear any previous errors
      
      // Call the analyze-all endpoint
      await analyzeAllProfiles();
      
      // Refresh the social profiles to show "Analyzed" status
      const socialRes = await getSocialProfiles();
      setSocialProfiles(socialRes.data.social_profiles || []);
      
      // Notify the user
      alert('Profiles analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.error || 'Failed to analyze profiles');
    } finally {
      setAnalyzing(false);  // Clear loading state
    }
  };

  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">Your Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Personal Information</h2>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Learning Style
              </label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Learning Style</option>
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Hands-on</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Collaboration Preference
              </label>
              <select
                value={collaborationPreference}
                onChange={(e) => setCollaborationPreference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Preference</option>
                <option value="1">Minimal Interaction</option>
                <option value="2">Occasional Check-ins</option>
                <option value="3">Regular Scheduled Meetings</option>
                <option value="4">Frequent Collaboration</option>
                <option value="5">Continuous Pair Programming</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Mentorship Type
              </label>
              <select
                value={mentorshipType}
                onChange={(e) => setMentorshipType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Type</option>
                <option value="seeking">Seeking Mentorship</option>
                <option value="offering">Offering Mentorship</option>
                <option value="peer">Peer Collaboration</option>
                <option value="mixed">Mixed (Depends on Topic)</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={savingProfile}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Social Profiles</h2>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Your Connected Profiles</h3>
          
          {socialProfiles.length > 0 ? (
            <div className="space-y-2">
              {socialProfiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium capitalize">{profile.platform_type}</span>
                    <span className="text-gray-500 text-sm ml-2">{profile.profile_url}</span>
                  </div>
                  {profile.last_analyzed ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Analyzed
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Not Analyzed
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No social profiles connected yet.</p>
          )}
          {socialProfiles.length > 0 && (
            <div className="mt-4">
              <button
                onClick={handleAnalyzeProfiles}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                Analyze Profiles
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
         <button
          onClick={handleAnalyzeProfiles}
          disabled={analyzing || socialProfiles.length === 0}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 mr-4"
         >
          {analyzing ? 'Analyzing...' : 'Analyze Profiles'}
         </button>
        </div>
        
        <form onSubmit={handleAddSocialProfile}>
          <h3 className="font-medium mb-2">Add New Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Platform
              </label>
              <select
                value={platformType}
                onChange={(e) => setPlatformType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Platform</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Profile URL
              </label>
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={addingProfile}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50">
                {addingProfile ? 'Adding...' : 'Add Profile'}
              </button>
            </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Technical Skills</h2>
        
        <p className="text-gray-600 mb-4">
          Add your technical skills to help us find the best match for you. This feature will be available soon.
        </p>
        
        <button
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded cursor-not-allowed"
          disabled
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
}