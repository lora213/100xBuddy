// Fixed ProfileSummary.js

import React, { useState, useEffect } from 'react';
import { getProfileSummaries } from '../services/api';

const ProfileSummary = () => {
  const [summaries, setSummaries] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile summaries...');
      const res = await getProfileSummaries();
      console.log('Raw profile summaries response:', JSON.stringify(res.data, null, 2));
    
      
      if (res.data.summaries && res.data.summaries.length > 0) {
        setSummaries(res.data.summaries);

        // Log each summary
      res.data.summaries.forEach(summary => {
        console.log(`Summary for ${summary.platform}:`, {
          id: summary.id,
          platform: summary.platform,
          summary_text: summary.summary,
          alignment_score: summary.alignment_score,
          created_at: summary.created_at
        });
      });

        setSelectedPlatform(res.data.summaries[0].platform);
      } else {
        console.log('No summaries found in response');
      }
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError('Failed to load profile summaries');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSummary = () => {
    return summaries.find(s => s.platform === selectedPlatform);
  };

  const getAlignmentColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlignmentText = (score) => {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Good match';
    if (score >= 40) return 'Average match';
    return 'Below average match';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Profile Analysis Summary</h2>
        <div className="py-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-500">Loading summaries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Profile Analysis Summary</h2>
        <div className="py-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Profile Analysis Summary</h2>
        <div className="py-4 text-center text-gray-500">
          No profile summaries available. Your profiles may need to be analyzed again.
        </div>
        <button 
          onClick={fetchSummaries}
          className="mt-2 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          Refresh Summaries
        </button>
      </div>
    );
  }

  const selectedSummary = getSelectedSummary();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-4">Profile Analysis Summary</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Select Profile
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          {summaries.map(summary => (
            <option key={summary.id || summary.platform} value={summary.platform}>
              {summary.platform.charAt(0).toUpperCase() + summary.platform.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedSummary && (
        <div className="mt-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-lg capitalize">
              {selectedSummary.platform} Profile Analysis
            </h3>
            <div className={`px-3 py-1 rounded-full ${getAlignmentColor(selectedSummary.alignment_score).replace('text-', 'bg-').replace('600', '100')}`}>
            <span className={`font-medium ${getAlignmentColor(selectedSummary.alignment_score || 0)}`}>
              {selectedSummary.alignment_score || 0}% - {getAlignmentText(selectedSummary.alignment_score || 0)}
            </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              {selectedSummary.summary || selectedSummary.summary_text || "No detailed summary available for this profile."}
            </p>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Analysis performed on {new Date(selectedSummary.created_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSummary;