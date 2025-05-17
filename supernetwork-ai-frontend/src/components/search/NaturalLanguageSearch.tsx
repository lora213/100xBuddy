// src/components/search/NaturalLanguageSearch.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';

interface SearchProps {
  initialQuery?: string;
  onSearch?: (query: string, results: any) => void;
  placeholder?: string;
}

export default function NaturalLanguageSearch({ 
  initialQuery = '', 
  onSearch,
  placeholder = "Describe who you're looking for in plain language..."
}: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // This would call your AI API to process the natural language query
      const processedQuery = await aiApi.processNaturalLanguageQuery(query, {});
      
      // Pass results to parent component if callback exists
      if (onSearch) {
        onSearch(query, processedQuery);
      } else {
        // Otherwise navigate to matches page with query
        router.push(`/matches?q=${encodeURIComponent(query)}`);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Example search suggestions
  const exampleSuggestions = [
    "I need a technical co-founder with React and Node experience",
    "Looking for a UX designer for a fintech project",
    "Need a writer who specializes in AI topics",
    "Find me a marketing expert with SaaS experience"
  ];
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[60px]"
            placeholder={placeholder}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="absolute right-3 bottom-3 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Search suggestions */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Try searching for</h3>
        <div className="flex flex-wrap gap-2">
          {exampleSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}