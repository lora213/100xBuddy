// src/app/profile/social/page.tsx
'use client';

import { useCustomAuth } from '@/lib/custom-auth';
import SocialProfiles from '@/components/profile/SocialProfiles';
import { FullPageLoader, RequireLoginFallback, PageHeader } from '@/components/shared/PageHelpers';

export default function SocialProfilesPage() {
  const { user, isLoading } = useCustomAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    return <RequireLoginFallback />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader 
        title="Social Profiles & Analysis"
        subtitle="Connect your professional profiles to improve your match accuracy."
      />
      
      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-indigo-700">
              Connecting your social profiles helps us better understand your skills and experience. 
              This information is used to find high-quality matches based on your profile.
            </p>
          </div>
        </div>
      </div>
      
      <SocialProfiles />
    </div>
  );
}