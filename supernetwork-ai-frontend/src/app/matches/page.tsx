// src/app/matches/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomAuth } from '@/lib/custom-auth';
import { matchesApi } from '@/lib/api';
import NaturalLanguageSearch from '@/components/search/NaturalLanguageSearch';
import { FullPageLoader, RequireLoginFallback } from '@/components/shared/PageHelpers';

// Define match types
type MatchType = 'cofounder' | 'teammate' | 'client' | 'all';

// Define the match interface
interface Match {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  matchScore: number;
  matchReason: string;
  matchType: MatchType;
  skills: string[];
  tagline?: string;
  lastActive?: string;
}

export default function MatchesPage() {
  const { user, isLoading } = useCustomAuth();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState<MatchType>('all');
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // Fetch matches
  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // In a real implementation, this would pass the search query to the backend
        const response = await matchesApi.getMatches();
        
        // For now, we'll use sample data since the backend isn't implemented
        const sampleMatches: Match[] = [
          {
            id: '1',
            userId: 'user1',
            name: 'Alex Johnson',
            email: 'alex@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 92,
            matchReason: 'Alex has strong React and Node.js experience, matching your technical co-founder requirements. Their background in fintech aligns with your project domain.',
            matchType: 'cofounder',
            skills: ['React', 'Node.js', 'TypeScript', 'Product Strategy'],
            tagline: 'Full-stack developer with 8 years experience',
            lastActive: '2 days ago'
          },
          {
            id: '2',
            userId: 'user2',
            name: 'Sam Peterson',
            email: 'sam@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 87,
            matchReason: 'Sam is a UX specialist with experience in fintech applications. They\'ve worked on similar projects and their visual design skills complement your technical background.',
            matchType: 'teammate',
            skills: ['UX Design', 'Figma', 'User Research', 'Prototyping'],
            tagline: 'UX designer passionate about fintech',
            lastActive: '5 hours ago'
          },
          {
            id: '3',
            userId: 'user3',
            name: 'Jordan Lee',
            email: 'jordan@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 81,
            matchReason: 'Jordan\'s company is looking for exactly the kind of technical expertise you offer. They need help building a new SaaS platform which aligns with your skills.',
            matchType: 'client',
            skills: ['Project Management', 'SaaS', 'B2B'],
            tagline: 'Startup founder looking for technical partners',
            lastActive: 'Online now'
          },
          {
            id: '4',
            userId: 'user4',
            name: 'Taylor Wright',
            email: 'taylor@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 78,
            matchReason: 'Taylor\'s expertise in AI content writing matches your search criteria. They have published extensively on AI topics and have technical knowledge to understand complex concepts.',
            matchType: 'teammate',
            skills: ['AI Writing', 'Content Strategy', 'Technical Writing'],
            tagline: 'AI specialized content writer',
            lastActive: '1 day ago'
          },
          {
            id: '5',
            userId: 'user5',
            name: 'Morgan Campbell',
            email: 'morgan@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 75,
            matchReason: 'Morgan has SaaS marketing experience and has worked with several tech startups. Their skills in growth marketing would help your project reach the right audience.',
            matchType: 'cofounder',
            skills: ['SaaS Marketing', 'Growth Strategy', 'Analytics'],
            tagline: 'Marketing expert for tech startups',
            lastActive: '3 days ago'
          }
        ];
        
        setMatches(sampleMatches);
        setFilteredMatches(sampleMatches);
        
        // Process any search query
        if (searchQuery) {
          handleSearchResults(searchQuery, null);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [user, searchQuery]);
  
  // Handle search results
  const handleSearchResults = (query: string, results: any) => {
    setSearchResults(results);
    
    // Filter matches based on search query
    // In a real implementation, this would use the results from the AI search
    if (query) {
      const lowerQuery = query.toLowerCase();
      const filtered = matches.filter(match => 
        match.name.toLowerCase().includes(lowerQuery) ||
        match.skills.some(skill => skill.toLowerCase().includes(lowerQuery)) ||
        match.matchReason.toLowerCase().includes(lowerQuery) ||
        match.tagline?.toLowerCase().includes(lowerQuery)
      );
      setFilteredMatches(filtered);
    } else {
      setFilteredMatches(matches);
    }
  };
  
  // Filter by match type
  const filterByType = (type: MatchType) => {
    setActiveFilter(type);
    
    if (type === 'all') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(match => match.matchType === type);
      setFilteredMatches(filtered);
    }
  };
  
  if (isLoading) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    return <RequireLoginFallback />;
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Match</h1>
      
      <div className="mb-8">
        <NaturalLanguageSearch 
          initialQuery={searchQuery} 
          onSearch={handleSearchResults}
          placeholder="Describe who you're looking for (e.g., 'technical co-founder with React experience')"
        />
      </div>
      
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => filterByType('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'all' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Matches
        </button>
        <button
          onClick={() => filterByType('cofounder')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'cofounder' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Co-founders
        </button>
        <button
          onClick={() => filterByType('teammate')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'teammate' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Teammates
        </button>
        <button
          onClick={() => filterByType('client')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'client' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Clients
        </button>
      </div>
      
      {/* Match results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later as new users join the platform.</p>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <img 
              src={match.profileImage || '/api/placeholder/64/64'} 
              alt={match.name} 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{match.name}</h3>
            <p className="text-sm text-gray-500 truncate">{match.tagline || match.email}</p>
            <div className="mt-1 flex items-center">
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {match.matchScore}% Match
              </span>
              <span className="ml-2 text-xs text-gray-500">{match.lastActive}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            match.matchType === 'cofounder' ? 'bg-purple-100 text-purple-800' :
            match.matchType === 'teammate' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {match.matchType === 'cofounder' ? 'Co-founder' : 
             match.matchType === 'teammate' ? 'Teammate' : 'Client'}
          </span>
        </div>
        
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500">Skills</h4>
          <div className="mt-1 flex flex-wrap gap-1">
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
        
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500">Why you match</h4>
          <p className="mt-1 text-sm text-gray-600 line-clamp-3">{match.matchReason}</p>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 flex justify-between">
        <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
          View Profile
        </button>
        <button className="text-sm bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700">
          Connect
        </button>
      </div>
    </div>
  );
}