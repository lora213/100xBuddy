// src/app/profile/settings/page.tsx
'use client';

import { useCustomAuth } from '@/lib/custom-auth';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { FullPageLoader, RequireLoginFallback, PageHeader } from '@/components/shared/PageHelpers';

export default function ProfileSettingsPage() {
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
        title="Profile Settings & Privacy"
        subtitle="Control your profile visibility and communication preferences."
      />
      
      <ProfileSettings />
    </div>
  );
}