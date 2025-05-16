// components/MatchSuggestions.js
import React, { useState } from 'react';
import { sendMatchRequest } from '../services/api';

const MatchSuggestions = ({ matches, onRequestSent, onError }) => {
  const [sending, setSending] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleSendRequest = async (match) => {
    try {
      setSending(true);
      
      await sendMatchRequest(
        match.match_id,
        match.compatibility_score,
        match.match_reason
      );
      
      // Call callback function if provided
      if (onRequestSent) {
        onRequestSent(match);
      }
      
      // Show success message
      alert(`Match request sent to ${match.matched_user.full_name}!`);
    } catch (error) {
      console.error('Error sending match request:', error);
      
      // If it's already matched, show appropriate message
      if (error.response?.data?.requestStatus === 'accepted') {
        alert('You are already connected with this user!');
      } 
      // If there's already a pending request
      else if (error.response?.data?.requestStatus === 'pending') {
        if (error.response?.data?.isIncoming) {
          alert('This user has already sent you a match request. Check your notifications!');
        } else {
          alert('You have already sent a match request to this user.');
        }
      } 
      // Other errors
      else {
        if (onError) {
          onError(error);
        } else {
          alert('Failed to send match request. Please try again.');
        }
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Suggested Matches</h2>
      
      {matches.length === 0 ? (
        <div className="bg-gray-50 p-4 rounded text-center text-gray-600">
          No match suggestions available. Complete your profile to get better matches!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(match => (
            <div 
              key={match.match_id}
              className={`bg-white rounded-lg shadow border ${
                selectedMatch?.match_id === match.match_id 
                  ? 'border-indigo-500' 
                  : 'border-transparent'
              } hover:border-indigo-300 transition-all duration-200`}
              onClick={() => setSelectedMatch(match)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{match.matched_user.full_name}</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium rounded px-2 py-1">
                    {match.compatibility_score}% Match
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {match.match_reason}
                </p>
                
                {/* User preferences */}
                <div className="mt-3 space-y-2 text-xs text-gray-600">
                  {match.matched_user.learning_style && (
                    <div className="flex justify-between">
                      <span>Learning Style:</span>
                      <span className="font-medium">{match.matched_user.learning_style}</span>
                    </div>
                  )}
                  
                  {match.matched_user.collaboration_preference && (
                    <div className="flex justify-between">
                      <span>Collaboration:</span>
                      <span className="font-medium">
                        {getCollaborationText(match.matched_user.collaboration_preference)}
                      </span>
                    </div>
                  )}
                  
                  {match.matched_user.mentorship_type && (
                    <div className="flex justify-between">
                      <span>Mentorship:</span>
                      <span className="font-medium capitalize">
                        {match.matched_user.mentorship_type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendRequest(match);
                  }}
                  disabled={sending}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md transition duration-200 disabled:opacity-50"
                >
                  {sending ? 'Sending Request...' : 'Send Match Request'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Details panel for selected match */}
      {selectedMatch && (
        <div className="mt-6 bg-white rounded-lg shadow p-4 border-t-4 border-indigo-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{selectedMatch.matched_user.full_name}</h3>
            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full px-3 py-1">
              {selectedMatch.compatibility_score}% Match
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">
            {selectedMatch.match_reason}
          </p>
          
          {/* Match details if available */}
          {selectedMatch.match_details && (
            <div className="space-y-4">
              {/* Technical compatibility */}
              {selectedMatch.match_details.technical_score !== undefined && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Technical Compatibility</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${selectedMatch.match_details.technical_score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedMatch.match_details.technical_score}% - {getCompatibilityText(selectedMatch.match_details.technical_score)}
                  </p>
                </div>
              )}
              
              {/* Preference compatibility */}
              {selectedMatch.match_details.preference_score !== undefined && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Preference Compatibility</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${selectedMatch.match_details.preference_score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedMatch.match_details.preference_score}% - {getCompatibilityText(selectedMatch.match_details.preference_score)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => handleSendRequest(selectedMatch)}
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              {sending ? 'Sending Request...' : 'Send Match Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
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

function getCompatibilityText(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Low';
}

export default MatchSuggestions;