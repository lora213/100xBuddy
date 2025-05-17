'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

// This is a dummy SessionProvider that does nothing
// It's maintained just to prevent errors in case components are still wrapped with it
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default AuthProvider;