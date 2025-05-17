// src/components/shared/PageHelpers.tsx
'use client';

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function RequireLoginFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Login Required</h2>
        <p className="text-gray-600">Please log in to access this page.</p>
        <a href="/custom-login" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
          Go to Login
        </a>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">{subtitle}</p>
    </header>
  );
}