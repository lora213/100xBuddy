// src/app/matches/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomAuth } from '@/lib/custom-auth';
import { matchesApi, aiApi } from '@/lib/api';
import { FullPageLoader, RequireLoginFallback } from '@/components/shared/PageHelpers';

// Define the detailed match interface
interface MatchDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  matchScore: number;
  matchReason: string;
  matchType: 'cofounder' | 'teammate' | 'client';
  skills: string[];
  tagline?: string;
  location?: string;
  bio?: string;
  availableHours?: string;
  companiesWorkedAt?: string[];
  ikigai?: {
    passion: string;
    profession: string;
    vocation: string;
    mission: string;
  };
  workingStyle?: {
    communicationStyle: string;
    workHours: string;
    decisionMaking: string;
    feedbackPreference: string;
  };
  socialProfiles?: {
    type: string;
    url: string;
  }[];
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading } = useCustomAuth();
  
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [error, setError] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  
  useEffect(() => {
    const fetchMatchDetail = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // In a real implementation, this would fetch from the API
        // const response = await matchesApi.getMatchDetails(id as string);
        
        // For now, use sample data
        // This would normally come from your API
        const sampleMatch: MatchDetail = {
          id: id as string,
          userId: 'user1',
          name: 'Alex Johnson',
          email: 'alex@example.com',
          profileImage: '/api/placeholder/128/128',
          matchScore: 92,
          matchReason: 'Alex has strong React and Node.js experience, matching your technical co-founder requirements. Their background in fintech aligns with your project domain.',
          matchType: 'cofounder',
          skills: ['React', 'Node.js', 'TypeScript', 'Product Strategy', 'System Architecture', 'Team Leadership'],
          tagline: 'Full-stack developer with 8 years experience',
          location: 'San Francisco, CA',
          bio: 'I\'m a passionate developer with experience building scalable web applications. Previously led engineering at two fintech startups and looking for my next venture as a technical co-founder.',
          availableHours: '20+ hours/week',
          companiesWorkedAt: ['FinTech Solutions', 'PaymentPro', 'TechCorp'],
          ikigai: {
            passion: 'Building elegant, scalable software solutions that solve real problems.',
            profession: 'Full-stack development with expertise in React, Node.js, and TypeScript. Skilled in system architecture and team leadership.',
            vocation: 'Developing fintech applications and mentoring junior developers.',
            mission: 'Creating technology that makes financial services more accessible and transparent.'
          },
          workingStyle: {
            communicationStyle: 'direct',
            workHours: 'flexible',
            decisionMaking: 'analytical',
            feedbackPreference: 'direct'
          },
          socialProfiles: [
            { type: 'github', url: 'https://github.com/alexjohnson' },
            { type: 'linkedin', url: 'https://linkedin.com/in/alexjohnson' }
          ]
        };
        
        setMatch(sampleMatch);
        
        // Generate AI explanation for the match
        const explanation = await aiApi.generateMatchExplanation(
          user, 
          sampleMatch, 
          sampleMatch.matchType
        );
        
        setAiExplanation(explanation.explanation);
      } catch (error) {
        console.error('Error fetching match details:', error);
        setError('Failed to load match details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchDetail();
  }, [id, user]);
  
  const handleSendRequest = async () => {
    if (!match) return;
    
    setSendingRequest(true);
    try {
      // In a real implementation, this would call your API
      await matchesApi.sendMatchRequest(
        match.userId,
        match.matchScore,
        match.matchReason
      );
      
      // Show success and navigate back
      alert('Connection request sent successfully!');
      router.push('/matches');
    } catch (error) {
      console.error('Error sending request:', error);
      setError('Failed to send connection request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };
  
  if (isLoading || loading) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    return <RequireLoginFallback />;
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/matches')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back to matches
        </button>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Match not found</h3>
          <p className="text-gray-600 mb-4">This match may no longer be available.</p>
          <button
            onClick={() => router.push('/matches')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to matches
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/matches')}
        className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to matches
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header with match score */}
        <div className="bg-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{match.name}</h1>
            <div className="text-xl font-semibold">
              {match.matchScore}% Match
            </div>
          </div>
          <p className="mt-1 text-indigo-100">{match.tagline}</p>
          
          <div className="mt-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              match.matchType === 'cofounder' ? 'bg-purple-200 text-purple-900' :
              match.matchType === 'teammate' ? 'bg-blue-200 text-blue-900' :
              'bg-orange-200 text-orange-900'
            }`}>
              {match.matchType === 'cofounder' ? 'Co-founder' : 
               match.matchType === 'teammate' ? 'Teammate' : 'Client'} Match
            </span>
            {match.location && (
              <span className="ml-3 text-indigo-100">
                <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {match.location}
              </span>
            )}
            {match.availableHours && (
              <span className="ml-3 text-indigo-100">
                <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {match.availableHours}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex md:flex-row flex-col">
            <div className="md:w-1/3 mb-6 md:mb-0">
              <div className="text-center md:text-left mb-4">
                <img 
                  src={match.profileImage || '/api/placeholder/128/128'} 
                  alt={match.name} 
                  className="w-32 h-32 rounded-full mx-auto md:mx-0 object-cover"
                />
              </div>
              
              {/* Social profiles */}
              {match.socialProfiles && match.socialProfiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Connect on</h3>
                  <div className="flex gap-2">
                    {match.socialProfiles.map((profile, idx) => (
                      <a 
                        key={idx}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-indigo-600"
                      >
                        {profile.type === 'github' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                          </svg>
                        ) : profile.type === 'linkedin' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        ) : (
                          <span>{profile.type}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skills */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {match.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Companies worked at */}
              {match.companiesWorkedAt && match.companiesWorkedAt.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Experience</h3>
                  <ul className="text-sm text-gray-700">
                    {match.companiesWorkedAt.map((company, idx) => (
                      <li key={idx} className="mb-1">• {company}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 md:pl-8">
              {/* Bio */}
              {match.bio && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">About</h3>
                  <p className="text-gray-600">{match.bio}</p>
                </div>
              )}
              
              {/* AI Match Explanation */}
              <div className="mb-6 bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-indigo-700 mb-2">Why You Match</h3>
                <p className="text-indigo-900">{aiExplanation || match.matchReason}</p>
              </div>
              
              {/* Ikigai */}
              {match.ikigai && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Ikigai Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800">Passion</h4>
                      <p className="text-sm text-red-700">{match.ikigai.passion}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800">Profession</h4>
                      <p className="text-sm text-blue-700">{match.ikigai.profession}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800">Vocation</h4>
                      <p className="text-sm text-green-700">{match.ikigai.vocation}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800">Mission</h4>
                      <p className="text-sm text-yellow-700">{match.ikigai.mission}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Working Style */}
              {match.workingStyle && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Working Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">Communication Style</h4>
                      <p className="text-sm text-gray-600">
                        {match.workingStyle.communicationStyle === 'direct' ? 'Direct & Straightforward' :
                         match.workingStyle.communicationStyle === 'collaborative' ? 'Collaborative & Inclusive' :
                         match.workingStyle.communicationStyle === 'detail-oriented' ? 'Detail-Oriented' :
                         match.workingStyle.communicationStyle === 'visual' ? 'Visual & Demonstrative' :
                         match.workingStyle.communicationStyle}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">Work Hours</h4>
                      <p className="text-sm text-gray-600">
                        {match.workingStyle.workHours === 'traditional' ? 'Traditional Hours' :
                         match.workingStyle.workHours === 'flexible' ? 'Flexible Schedule' :
                         match.workingStyle.workHours === 'early-bird' ? 'Early Bird' :
                         match.workingStyle.workHours === 'night-owl' ? 'Night Owl' :
                         match.workingStyle.workHours}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">Decision Making</h4>
                      <p className="text-sm text-gray-600">
                        {match.workingStyle.decisionMaking === 'analytical' ? 'Analytical' :
                         match.workingStyle.decisionMaking === 'intuitive' ? 'Intuitive' :
                         match.workingStyle.decisionMaking === 'collaborative' ? 'Collaborative' :
                         match.workingStyle.decisionMaking === 'decisive' ? 'Decisive' :
                         match.workingStyle.decisionMaking}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">Feedback Preference</h4>
                      <p className="text-sm text-gray-600">
                        {match.workingStyle.feedbackPreference === 'direct' ? 'Direct & Immediate' :
                         match.workingStyle.feedbackPreference === 'gentle' ? 'Constructive & Gentle' :
                         match.workingStyle.feedbackPreference === 'detailed' ? 'Detailed & Specific' :
                         match.workingStyle.feedbackPreference === 'public' ? 'Public Recognition' :
                         match.workingStyle.feedbackPreference}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <button 
              onClick={() => router.push('/matches')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100"
            >
              Back to Matches
            </button>
            <button
              onClick={handleSendRequest}
              disabled={sendingRequest}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {sendingRequest ? 'Sending...' : 'Send Connection Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}