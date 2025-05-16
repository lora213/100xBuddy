// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { getProfile, getSocialProfiles, updatePreferences, addSocialProfile, analyzeAllProfiles, analyzeGithub, analyzeLinkedin, deleteSocialProfile } from '../services/api';
import ProfileSummary from '../components/ProfileSummary';
import api from '../services/api';

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
  const [deletingProfile, setDeletingProfile] = useState(false);

  // State to track if profiles have been analyzed
  const [hasAnalyzedProfiles, setHasAnalyzedProfiles] = useState(false);
  
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
        
        // Get social profiles
        const socialProfiles = profileRes.data.socialProfiles || [];
        setSocialProfiles(socialProfiles);

        // Check if profiles have been analyzed
        if (socialProfiles.some(profile => profile.last_analyzed)) {
          setHasAnalyzedProfiles(true);
        }
  
        // Check and display analysis scores if they exist
        if (userData.analysisScores) {
          console.log("Analysis scores found:", userData.analysisScores);
          setHasAnalyzedProfiles(true);
        }
        
        // Try to fetch analysis scores separately
        try {
          const analysisRes = await api.get('/analysis/scores');
          if (analysisRes.data && analysisRes.data.scores) {
            console.log("Fetched analysis scores:", analysisRes.data.scores);
            setProfile(prevProfile => ({
              ...prevProfile,
              analysisScores: analysisRes.data.scores
            }));
          }
        } catch (scoresErr) {
          // Don't set main error for this - it's okay if scores aren't available yet
          console.log('No analysis scores available yet or error fetching scores:', scoresErr);
        }
        
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

  // Delete social profile
  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }
    
    try {
      setDeletingProfile(true);
      setError('');
      
      // Call the delete endpoint
      await deleteSocialProfile(profileId);
      
      // Remove from local state
      setSocialProfiles(prevProfiles => 
        prevProfiles.filter(profile => profile.id !== profileId)
      );
      
      alert('Profile deleted successfully');
    } catch (err) {
      console.error('Delete profile error:', err);
      setError('Failed to delete profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingProfile(false);
    }
  };

  const handleAnalyzeProfiles = async () => {
    if (socialProfiles.length === 0) {
      setError('No social profiles to analyze');
      return;
    }
    
    try {
      setAnalyzing(true);
      setError('');
      
      // Check if rubric scores are already present
      const profileRes = await getProfile();
      const userData = profileRes.data.user;

      if (userData.analysisScores) {
        setProfile(userData); // Display existing scores
        alert('Rubric scores already exist and have been displayed.');
        setHasAnalyzedProfiles(true);
        return;
      }

      // Call the analyze-all endpoint if no scores exist
      await analyzeAllProfiles();

      // Refresh the social profiles to show "Analyzed" status
      const socialRes = await getSocialProfiles();
      setSocialProfiles(socialRes.data.social_profiles || []);

      // Fetch updated rubric scores
      const updatedProfileRes = await getProfile();
      setProfile(updatedProfileRes.data.user);

      // Set flag that profiles have been analyzed
      setHasAnalyzedProfiles(true);

      alert('Profiles analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.error || 'Failed to analyze profiles');
    } finally {
      setAnalyzing(false);
    }
  };

  // Updated handleReAnalyzeProfile to fetch and display updated rubric scores after re-analysis.
  const handleReAnalyzeProfile = async (profile) => {
    try {
      setAnalyzing(true);
      setError('');

      // Call the specific analysis endpoint based on platform type
      if (profile.platform_type === 'github') {
        await analyzeGithub(profile.profile_url);
      } else if (profile.platform_type === 'linkedin') {
        await analyzeLinkedin(profile.profile_url);
      } else {
        alert('Re-analysis for this platform is not supported yet.');
        return;
      }

      // Fetch updated social profiles and rubric scores
      const socialRes = await getSocialProfiles();
      setSocialProfiles(socialRes.data.social_profiles || []);

      const profileRes = await getProfile();
      setProfile(profileRes.data.user);

      // Set flag that profiles have been analyzed
      setHasAnalyzedProfiles(true);

      // Log the updated rubric scores
      console.log('Updated Rubric Scores:', profileRes.data.user.analysisScores);

      alert(`${profile.platform_type} profile re-analyzed successfully!`);
    } catch (error) {
      console.error('Re-analysis error:', error);
      setError(error.response?.data?.error || 'Failed to re-analyze profile');
    } finally {
      setAnalyzing(false);
    }
  };

  // Removed unused handleFetchAnalysisScores function

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
                  <div className="flex items-center space-x-2">
                    {profile.last_analyzed ? (
                      <button
                        onClick={() => handleReAnalyzeProfile(profile)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Re-analyze"
                        title="Re-analyze profile"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-5 h-5 text-indigo-600"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                      </button>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Not Analyzed
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-2 rounded-full hover:bg-red-100 transition-colors"
                      aria-label="Delete"
                      title="Delete profile"
                      disabled={deletingProfile}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5 text-red-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No social profiles connected yet.</p>
          )}
        </div>

        <div className="mt-4">
         <button
          onClick={handleAnalyzeProfiles}
          disabled={analyzing || socialProfiles.length === 0}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
         >
          {analyzing ? 'Analyzing...' : 'Analyze Profiles'}
         </button>
        </div>
        
        <form onSubmit={handleAddSocialProfile}>
          <h3 className="font-medium mb-2 mt-6">Add New Profile</h3>
          
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
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">Technical Skills and Analysis Scores</h2>
          
          {profile?.analysisScores ? (
            <div className="space-y-6">
              {/* Technical Skills Scores */}
              {profile.analysisScores.technical_skills && (
                <div>
                  <h3 className="font-medium mb-2">Technical Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(profile.analysisScores.technical_skills).map(([skill, data]) => (
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
              
              {/* Social Blueprint Scores */}
              {profile.analysisScores.social_blueprint && (
                <div>
                  <h3 className="font-medium mb-2">Social Profiles Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(profile.analysisScores.social_blueprint).map(([profile, data]) => (
                      <div key={profile} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium capitalize">
                          {profile.replace(/_/g, ' ')}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof data === 'object' ? data.score : data}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Personal Attributes */}
              {profile.analysisScores.personal_attributes && (
                <div>
                  <h3 className="font-medium mb-2">Personal Attributes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(profile.analysisScores.personal_attributes).map(([attr, data]) => (
                      <div key={attr} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium capitalize">
                          {attr.replace(/_/g, ' ')}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {typeof data === 'object' ? data.score : data}/5
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">No analysis scores available. Please analyze your profiles.</p>
              <button
                onClick={handleAnalyzeProfiles}
                disabled={analyzing || socialProfiles.length === 0}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Analyze Profiles'}
              </button>
            </div>
          )}
        </div>

        {/* UPDATED: Replace the "coming soon" message with the ProfileSummary component */}
        <div className="mt-6">
          {hasAnalyzedProfiles ? (
            <ProfileSummary />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4">Profile Summaries</h2>
              <p className="text-gray-600 mb-4">
                Profile summaries will be available after you analyze your social profiles.
              </p>
              <button
                onClick={handleAnalyzeProfiles}
                disabled={analyzing || socialProfiles.length === 0}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Profiles'}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}