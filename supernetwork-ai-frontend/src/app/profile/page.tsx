'use client';

import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Here you&apos;ll be able to edit your profile information.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">
            Complete your profile by filling out both the Ikigai framework and Working Style preferences.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Link 
                href="/profile/ikigai" 
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors mr-3"
              >
                Begin Ikigai Profile Setup
              </Link>
              <Link 
                href="/profile/working-style" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Working Style Preferences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}