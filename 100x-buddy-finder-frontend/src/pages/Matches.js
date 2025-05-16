// src/pages/Matches.js

import React, { useState, useEffect, useCallback } from 'react';
import { findMatches, getMatches, updateMatchStatus, getIncomingMatchRequests, sendMatchRequest, acceptMatchRequest, rejectMatchRequest, getOutgoingMatchRequests } from '../services/api';
import { useLocation } from 'react-router-dom';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [processingRequest, setProcessingRequest] = useState(false);
  const [sentRequestUserIds, setSentRequestUserIds] = useState(new Set());
  
  const location = useLocation();

  // Use useCallback to memoize the loadData function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load existing matches
      const matchesRes = await getMatches();
      setMatches(matchesRes.data.matches || []);
      
      // Select first match if available
      if (matchesRes.data.matches && matchesRes.data.matches.length > 0) {
        setSelectedMatch(matchesRes.data.matches[0]);
      }
      
      // Fetch incoming match requests
      const requestsRes = await getIncomingMatchRequests();
      setIncomingRequests(requestsRes.data.requests || []);
      
      // Check if there's a specific request to highlight
      const params = new URLSearchParams(location.search);
      const requestId = params.get('request');
      if (requestId && requestsRes.data.requests) {
        const foundRequest = requestsRes.data.requests.find(req => req.id === requestId);
        if (foundRequest) {
          setActiveTab('requests');
        }
      }
      
    } catch (err) {
      console.error('Load data error:', err);
      setError('Failed to load match data');
    } finally {
      setLoading(false);
    }
  }, [location]); // Include location as a dependency

  // Check if a request has been sent for matches in suggestions tab
  const checkIfRequestSent = useCallback(async () => {
    try {
      // Fetch outgoing match requests
      const { data: outgoingRequests } = await getOutgoingMatchRequests();
      
      if (outgoingRequests && outgoingRequests.requests) {
        console.log('Outgoing requests:', outgoingRequests.requests);
        
        // Create a map of receiver IDs for quick lookup
        const sentRequestIds = new Set(
          outgoingRequests.requests.map(req => req.receiver_id)
        );
        
        // Update matches to mark those that already have requests sent
        setMatches(prevMatches => 
          prevMatches.map(match => ({
            ...match,
            request_sent: sentRequestIds.has(match.match_id)
          }))
        );
      }
    } catch (err) {
      console.error('Error checking sent requests:', err);
    }
  }, []);

  const loadSentRequests = useCallback(async () => {
    try {
      console.log('Loading sent requests...');
      const { data } = await getOutgoingMatchRequests();
      
      if (data && data.requests) {
        // Create a Set of all user IDs who have received requests
        const requestIds = new Set();
        data.requests.forEach(req => {
          requestIds.add(req.receiver_id);
          console.log(`Found sent request to: ${req.receiver_id}`);
        });
        
        // Update our state
        setSentRequestUserIds(requestIds);
        
        // Also mark matching suggestions
        if (matches.length > 0) {
          setMatches(prevMatches => 
            prevMatches.map(match => ({
              ...match,
              request_sent: requestIds.has(match.match_id)
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  }, [matches.length]);

  useEffect(() => {
    // Check if there's a request ID in the URL params
    const params = new URLSearchParams(location.search);
    const requestId = params.get('request');
    if (requestId) {
      setActiveTab('requests');
    }
    
    loadData();
  }, [location, loadData]); // Added loadData to the dependency array
  
  useEffect(() => {
    if (activeTab === 'suggestions') {
      loadSentRequests();
    }
  }, [activeTab, loadSentRequests]);

  const handleFindMatches = async () => {
    try {
      setSearching(true);
      setError('');
      
      const response = await findMatches();
      
      if (response.data.matches && response.data.matches.length > 0) {
        // Apply sent request flags to new matches
        const newMatches = response.data.matches.map(match => ({
          ...match,
          request_sent: sentRequestUserIds.has(match.match_id)
        }));
        
        setMatches(newMatches);
        setSelectedMatch(newMatches[0]);
        setActiveTab('suggestions');
      } else {
        setMatches([]);
        alert('No matches found. Try completing your profile or adding more skills.');
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
      if (!matchId) {
        console.error('Match ID is undefined');
        setError('Cannot update match status: Invalid match ID');
        return;
      }
      
      console.log(`Updating match status: ID=${matchId}, status=${status}`);
      
      await updateMatchStatus(matchId, status);
      
      // Update local state
      setMatches(matches.map(match => 
        match.id === matchId ? { ...match, status } : match
      ));
      
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch({ ...selectedMatch, status });
      }
      
      alert(`Match ${status === 'accepted' ? 'accepted' : 'declined'} successfully!`);
    } catch (err) {
      console.error('Update match status error:', err);
      setError('Failed to update match status');
    }
  };
  
  const handleSendMatchRequest = async (match) => {
    try {
      setProcessingRequest(true);
      
      await sendMatchRequest(
        match.match_id,
        match.compatibility_score,
        match.match_reason
      );
      
      // Update our Set of sent requests
      setSentRequestUserIds(prev => {
        const updated = new Set(prev);
        updated.add(match.match_id);
        return updated;
      });
      
      // Update matches list
      setMatches(prevMatches => 
        prevMatches.map(m => 
          m.match_id === match.match_id 
            ? { ...m, request_sent: true } 
            : m
        )
      );
      
      alert(`Match request sent to ${match.matched_user.full_name}!`);
    } catch (error) {
      console.error('Error sending match request:', error);
      // Error handling...
    } finally {
      setProcessingRequest(false);
    }
  };
  
  const handleAcceptRequest = async (requestId) => {
    try {
      setProcessingRequest(true);
      await acceptMatchRequest(requestId);
      
      // Update local state
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
      
      alert('Match request accepted! You can now view this connection in your connections list.');
      
      // Refresh matches
      loadData();
      
    } catch (err) {
      console.error('Accept request error:', err);
      alert('Failed to accept match request');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setProcessingRequest(true);
      await rejectMatchRequest(requestId);
      
      // Update local state
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
      
      alert('Match request rejected.');
      
    } catch (err) {
      console.error('Reject request error:', err);
      alert('Failed to reject match request');
    } finally {
      setProcessingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800">Find Coding Buddies</h1>
        
        <button
          onClick={handleFindMatches}
          disabled={searching}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center"
        >
          {searching ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : 'Find New Matches'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'matches' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-indigo-600'
            }`}
            onClick={() => setActiveTab('matches')}
          >
            Your Matches
            {matches.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full px-2 py-0.5">
                {matches.length}
              </span>
            )}
          </button>
          
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'suggestions' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-indigo-600'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Match Suggestions
          </button>
          
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'requests' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-600 hover:text-indigo-600'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Incoming Requests
            {incomingRequests.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium rounded-full px-2 py-0.5">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Existing Matches Tab */}
      {activeTab === 'matches' && (
        <>
          {matches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg 
                className="mx-auto h-16 w-16 text-indigo-300 mb-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">No Matches Found</h2>
              <p className="text-gray-600 mb-6">
                Complete your profile and add social profiles to find potential coding buddies.
              </p>
              <button
                onClick={handleFindMatches}
                disabled={searching}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
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
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedMatch?.id === match.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        } transition-all duration-200`}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{match.matched_user.full_name}</h3>
                          <span className={`text-sm px-2 py-1 rounded-full font-medium ${getStatusClass(match.status)}`}>
                            {match.compatibility_score}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">
                            {getMatchStatusText(match.status)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            match.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                            match.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                {selectedMatch ? (
                  <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedMatch.matched_user.full_name}</h2>
                        <p className="text-gray-600">{selectedMatch.matched_user.email}</p>
                      </div>
                      
                      <div className="text-center bg-indigo-50 p-3 rounded-lg">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">{selectedMatch.compatibility_score}%</div>
                        <div className="text-sm text-indigo-500">Match Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Technical Compatibility</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${selectedMatch.match_details?.components?.technical?.score || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getCompatibilityDescription(selectedMatch.match_details?.components?.technical?.score)}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Social Compatibility</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${selectedMatch.match_details?.components?.social?.score || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getCompatibilityDescription(selectedMatch.match_details?.components?.social?.score)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Personal Compatibility</h3>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${selectedMatch.match_details?.components?.personal?.score || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getCompatibilityDescription(selectedMatch.match_details?.components?.personal?.score)}
                      </p>
                    </div>
                    
                    {/* FIX 1: Don't show Accept/Decline buttons for outgoing match requests */}
                    {selectedMatch.status === 'pending' && !selectedMatch.is_match_request && (
                      <div className="flex space-x-4 mt-6">
                        <button
                          onClick={() => handleUpdateStatus(selectedMatch.id, 'accepted')}
                          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200 flex-1"
                        >
                          Accept Match
                        </button>
                        
                        <button
                          onClick={() => handleUpdateStatus(selectedMatch.id, 'rejected')}
                          className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors duration-200 flex-1"
                        >
                          Decline Match
                        </button>
                      </div>
                    )}
                    
                    {selectedMatch.status === 'pending' && selectedMatch.is_match_request && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="ml-3 text-yellow-800">
                            You've sent a match request to this user. Waiting for their response.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedMatch.status === 'accepted' && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded mt-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-green-800">
                            You've accepted this match! You can contact them at {selectedMatch.matched_user.email}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedMatch.status === 'rejected' && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded mt-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <p className="ml-3 text-gray-600">
                            You've declined this match.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
                    Select a match from the list to view details
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Match Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div>
          {matches.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Suggested Matches</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matches.map(match => (
                  <div 
                    key={match.match_id}
                    className="bg-white rounded-lg shadow border hover:border-indigo-300 transition-all duration-200"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold">{match.matched_user.full_name}</h3>
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium rounded px-2 py-1">
                          {match.compatibility_score}% Match
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {match.match_reason || "This user seems compatible with your skills and preferences."}
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
                      
                      {/* FIX 2: Display different button based on request status */}
                      {match.request_sent ? (
                        <button
                          disabled={true}
                          className="mt-4 w-full bg-gray-400 text-white py-2 px-3 rounded-md cursor-not-allowed"
                        >
                          Request Sent
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMatchRequest(match)}
                          disabled={processingRequest}
                          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md transition duration-200 disabled:opacity-50"
                        >
                          {processingRequest ? 'Sending Request...' : 'Send Match Request'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 text-indigo-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-xl font-semibold mb-4">No Match Suggestions Yet</h2>
              <p className="text-gray-600 mb-6">
                Click "Find Matches" to discover potential coding buddies based on your profile and skills.
              </p>
              <button
                onClick={handleFindMatches}
                disabled={searching}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
              >
                {searching ? 'Finding Matches...' : 'Find Matches Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === 'requests' && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Incoming Match Requests</h2>
    
    {incomingRequests.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incomingRequests.map(request => (
          <div key={request.id} className="bg-white rounded-lg shadow border hover:border-indigo-300 transition-all duration-200">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">
                  {request.users ? request.users.full_name : `User ${request.sender_id?.substring(0, 8) || 'Unknown'}`}
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium rounded px-2 py-1">
                  {request.compatibility_score}% Match
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {request.match_reason || 'This user wants to connect with you!'}
              </p>
              
              {/* Adding debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-4">
                  <div>Request ID: {request.id}</div>
                  <div>Sender ID: {request.sender_id || 'N/A'}</div>
                  <div>User Data: {request.users ? 'Available' : 'Missing'}</div>
                </div>
              )}
              
              <div className="flex justify-between space-x-2 mt-4">
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={processingRequest}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded transition duration-200 disabled:opacity-50"
                >
                  {processingRequest ? 'Processing...' : 'Accept'}
                </button>
                
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  disabled={processingRequest}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-2 rounded transition duration-200 disabled:opacity-50"
                >
                  {processingRequest ? 'Processing...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg className="w-16 h-16 text-indigo-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-semibold mb-4">No Incoming Requests</h2>
        <p className="text-gray-600">
          You don't have any pending match requests. When someone wants to connect with you, their request will appear here.
        </p>
      </div>
    )}
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