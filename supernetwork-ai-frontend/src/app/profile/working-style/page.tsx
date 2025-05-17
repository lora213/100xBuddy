// src/app/profile/working-style/page.tsx
'use client';

import { Suspense } from 'react';
import { WorkingStyleForm } from '@/components/working-style/WorkingStyleForm';
import { useCustomAuth } from '@/lib/custom-auth';
import { FullPageLoader, RequireLoginFallback, PageHeader } from '@/components/shared/PageHelpers';

export default function WorkingStylePage() {
  const { user, isLoading } = useCustomAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }
  if (!user) {
    return <RequireLoginFallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader 
          title="Working Style Preferences"
          subtitle="Define how you prefer to work with others."
        />
        <Suspense fallback={<FullPageLoader />}>
          <WorkingStyleForm />
        </Suspense>
      </div>
    </div>
  );
}

