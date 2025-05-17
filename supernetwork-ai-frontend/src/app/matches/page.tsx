'use client';

import Link from 'next/link';

export default function MatchesPage() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Discover your perfect network matches based on your ikigai profile.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">
            The matches feature will be implemented soon!
          </p>
          <div className="mt-4">
            <Link 
              href="/profile/ikigai" 
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Complete Your Profile First
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}