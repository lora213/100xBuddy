// src/pages/Matches.js
import React, { useState, useEffect } from 'react';
import { getMatches, findMatches, updateMatchStatus } from '../services/api';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      const response = await getMatches();
      setMatches(response.data.matches || []);
      
      // Select first match if available
      if (response.data.matches && response.data.matches.length > 0) {
        setSelectedMatch(response.data.matches[0]);
      }
    } catch (err) {
      console.error('Load matches error:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    try {
      setSearching(true);
      setError('');
      
      const response = await findMatches();
      setMatches(response.data.matches || []);
      
      if (response.data.matches && response.data.matches.length > 0) {
        setSelectedMatch(response.data.matches[0]);
      }
    } catch (err) {
      console.error('Find matches error:', err);
      setError('Failed to find matches');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
  };

  const handleUpdateStatus = async (matchId, status) => {
    try {
      await updateMatchStatus(matchId, status);
      
      // Update local state
      setMatches(matches.map(match => 
        match.id === matchId ? { ...match, status } : match
      ));
      
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch({ ...selectedMatch, status });
      }
    } catch (err) {
      console.error('Update match status error:', err);
      setError('Failed to update match status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading matches...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800">Your Matches</h1>
        
        <button
          onClick={handleFindMatches}
          disabled={searching}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Find New Matches'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Matches Found</h2>
          <p className="text-gray-600 mb-6">
            Complete your profile and add social profiles to find potential coding buddies.
          </p>
          <button
            onClick={handleFindMatches}
            disabled={searching}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Find Matches Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="bg-indigo-600 text-white p-4 font-medium">Match List</h2>
              
              <div className="divide-y">
                {matches.map(match => (
                  <div 
                    key={match.id}
                    onClick={() => handleSelectMatch(match)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedMatch?.id === match.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{match.matched_user.full_name}</h3>
                      <span className={`text-sm px-2 py-1 rounded-full ${getStatusClass(match.status)}`}>
                        {match.compatibility_score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {getMatchStatusText(match.status)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedMatch ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedMatch.matched_user.full_name}</h2>
                    <p className="text-gray-600">{selectedMatch.matched_user.email}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">{selectedMatch.compatibility_score}%</div>
                    <div className="text-sm text-gray-500">Match Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Technical Compatibility</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedMatch.match_details?.components?.technical?.score || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getCompatibilityDescription(selectedMatch.match_details?.components?.technical?.score)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Social Compatibility</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedMatch.match_details?.components?.social?.score || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getCompatibilityDescription(selectedMatch.match_details?.components?.social?.score)}
                    </p>
                  </div>
                </div>
                
                {selectedMatch.status === 'pending' && (
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={() => handleUpdateStatus(selectedMatch.id, 'accepted')}
                      className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    >
                      Accept Match
                    </button>
                    
                    <button
                      onClick={() => handleUpdateStatus(selectedMatch.id, 'rejected')}
                      className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                    >
                      Reject Match
                    </button>
                  </div>
                )}
                
                {selectedMatch.status === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded mt-6">
                    <p className="text-green-800">
                      You've accepted this match! You can contact them at {selectedMatch.matched_user.email}
                    </p>
                  </div>
                )}
                
                {selectedMatch.status === 'rejected' && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded mt-6">
                    <p className="text-gray-600">
                      You've rejected this match.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">Select a match to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusClass(status) {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-indigo-100 text-indigo-800';
  }
}

function getMatchStatusText(status) {
  switch (status) {
    case 'accepted':
      return 'Match accepted';
    case 'rejected':
      return 'Match rejected';
    default:
      return 'Pending';
  }
}

function getCompatibilityDescription(score) {
  if (!score) return 'No data available';
  
  if (score >= 80) {
    return 'Excellent compatibility';
  } else if (score >= 60) {
    return 'Good compatibility';
  } else if (score >= 40) {
    return 'Moderate compatibility';
  } else {
    return 'Low compatibility';
  }
}