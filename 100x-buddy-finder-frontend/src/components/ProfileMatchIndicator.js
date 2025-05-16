// components/ProfileMatchIndicator.js
import React from 'react';

// Update the props to match what we're passing from the Dashboard
const ProfileMatchIndicator = ({ buddyMatchScore, componentScores }) => {
  // Use the overall score directly instead of calculating from alignmentScores
  const score = buddyMatchScore || 0;
  
  // Determine color and text based on score
  const getColorClass = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getScoreText = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Buddy Match Score</h2>
      
      <div className="flex flex-col items-center">
        <div className="relative h-36 w-36 mb-4">
          {/* Circular progress indicator */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="8" 
            />
            
            {/* Progress circle - stroke-dasharray is the circumference (2πr) */}
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={getColorClass(score).replace('bg-', 'text-')} 
              strokeWidth="8" 
              strokeDasharray="282.7"
              strokeDashoffset={282.7 - (282.7 * score / 100)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Score text */}
            <text 
              x="50" 
              y="45" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="bold"
              fill="currentColor"
            >
              {score}%
            </text>
            
            {/* Label text */}
            <text 
              x="50" 
              y="65" 
              textAnchor="middle" 
              fontSize="12"
              fill="currentColor"
            >
              {getScoreText(score)}
            </text>
          </svg>
        </div>
        
        <p className="text-center text-gray-600 text-sm">
          This score indicates how well your profiles align with what coding buddies are looking for.
        </p>
        
        {componentScores && (
          <div className="mt-4 w-full">
            <h3 className="text-sm font-medium mb-2">Score Breakdown:</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Analysis Score:</span>
                <span className="font-medium">{componentScores.analysisScore}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Profile Completeness:</span>
                <span className="font-medium">{componentScores.profileCompleteness}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Social Profiles:</span>
                <span className="font-medium">{componentScores.socialProfilesScore}%</span>
              </div>
            </div>
          </div>
        )}
        
        {score < 60 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-700 mb-2">Tips to improve your score:</p>
            <ul className="text-xs text-left text-gray-600 list-disc pl-5">
              <li>Complete your personal information</li>
              <li>Connect more social profiles</li>
              <li>Ensure your GitHub has public repositories</li>
              <li>Add skills and technologies you know</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileMatchIndicator;