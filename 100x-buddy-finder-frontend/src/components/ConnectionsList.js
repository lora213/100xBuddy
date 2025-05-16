// Updated ConnectionsList.js with fixes for null user object

import React, { useState, useEffect } from 'react';
import { getConnections, getConnectionDetails } from '../services/api';
import { Link } from 'react-router-dom';

const ConnectionsList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await getConnections();
      console.log('Connections data:', res.data); // Log to debug the structure
      setConnections(res.data.connections || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load your connections');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionDetails = async (connectionId) => {
    try {
      setLoadingDetails(true);
      const res = await getConnectionDetails(connectionId);
      setConnectionDetails(res.data);
    } catch (err) {
      console.error('Error fetching connection details:', err);
      setError('Failed to load connection details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectConnection = (connection) => {
    setSelectedConnection(connection);
    fetchConnectionDetails(connection.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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

  if (connections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg className="w-16 h-16 text-indigo-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <h2 className="text-xl font-semibold mb-4">No Connections Yet</h2>
        <p className="text-gray-600 mb-6">
          You haven't connected with any coding buddies yet. 
          Find potential matches and send connection requests to build your network.
        </p>
        <Link to="/matches" className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
          Find Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Connections List */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-indigo-600 text-white p-4">
            <h3 className="font-medium">Your Connections</h3>
          </div>
          
          <div className="divide-y">
            {connections.map(connection => {
              // Get the name safely with fallback
              const userName = connection.user?.full_name || 
                                connection.buddy?.full_name || 
                                `Buddy ${connection.id.substring(0, 6)}`;
              
              return (
                <div 
                  key={connection.id}
                  onClick={() => handleSelectConnection(connection)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedConnection?.id === connection.id 
                      ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{userName}</h3>
                    <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {connection.compatibility_score}% Match
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Connected {formatDate(connection.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Connection Details */}
      <div className="md:col-span-2">
        {selectedConnection ? (
          loadingDetails ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading connection details...</p>
            </div>
          ) : connectionDetails ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {connectionDetails.user?.full_name || 'Coding Buddy'}
                  </h2>
                  <p className="text-gray-600">
                    {connectionDetails.user?.email || ''}
                  </p>
                </div>
                
                <div className="bg-indigo-50 text-indigo-800 font-medium rounded-lg text-sm p-3">
                  <div className="text-2xl font-bold text-center">
                    {connectionDetails.connection?.compatibility_score || '?'}%
                  </div>
                  <div className="text-xs text-center">Match Score</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Why You Matched</h3>
                <p className="text-gray-700">
                  {connectionDetails.connection?.match_reason || 
                   "You both have compatible skills and preferences that make you great coding buddies!"}
                </p>
              </div>
              
              {/* User details - only render if user data exists */}
              {connectionDetails.user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Preferences</h3>
                    <div className="space-y-2 text-sm">
                      {connectionDetails.user.learning_style && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Learning Style:</span>
                          <span className="font-medium">{connectionDetails.user.learning_style}</span>
                        </div>
                      )}
                      
                      {connectionDetails.user.collaboration_preference && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collaboration:</span>
                          <span className="font-medium">
                            {getCollaborationText(connectionDetails.user.collaboration_preference)}
                          </span>
                        </div>
                      )}
                      
                      {connectionDetails.user.mentorship_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mentorship:</span>
                          <span className="font-medium capitalize">
                            {connectionDetails.user.mentorship_type.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Social Profiles</h3>
                    {connectionDetails.user.social_profiles && 
                     connectionDetails.user.social_profiles.length > 0 ? (
                      <ul className="space-y-2">
                        {connectionDetails.user.social_profiles.map(profile => (
                          <li key={profile.id} className="text-sm">
                            <a 
                              href={profile.profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                            >
                              <span className="capitalize">{profile.platform_type}</span>
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">No social profiles available</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Skills section */}
              {connectionDetails.user?.skills && connectionDetails.user.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Technical Skills</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {connectionDetails.user.skills.map(skill => (
                      <div key={skill.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{skill.skill_name}</div>
                        <div className="text-xs text-gray-600">
                          <span className="capitalize">{skill.skill_type}</span>
                          <span className="mx-1">•</span>
                          <span>Level: {skill.proficiency_level}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact info */}
              {connectionDetails.user?.email && (
                <div className="mt-6 bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-600">
                  <h3 className="text-indigo-800 font-medium mb-2">Contact Information</h3>
                  <p className="text-sm text-indigo-700">
                    You can reach out to {connectionDetails.user.full_name || 'your buddy'} at{' '}
                    <a href={`mailto:${connectionDetails.user.email}`} className="font-medium underline">
                      {connectionDetails.user.email}
                    </a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              Failed to load connection details. Please try again.
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Select a connection to view details
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  
  // If less than a day ago, show "today" or "yesterday"
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  if (date.toDateString() === now.toDateString()) {
    return 'today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }
  
  // Otherwise, show a readable date
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getCollaborationText(value) {
  const mapping = {
    '1': 'Minimal',
    '2': 'Occasional',
    '3': 'Regular',
    '4': 'Frequent',
    '5': 'Continuous'
  };
  return mapping[value] || value;
}

export default ConnectionsList;