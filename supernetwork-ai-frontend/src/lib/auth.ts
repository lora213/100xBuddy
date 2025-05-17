'use client';

import { useCustomAuth } from './custom-auth';
import { useRouter } from 'next/navigation';

// This file provides compatibility with NextAuth function calls
// while using our custom authentication system underneath

// Mock session type to match NextAuth format
type Session = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
};

// Mock NextAuth's useSession hook
export function useSession() {
  const { user, token, isLoading } = useCustomAuth();
  
  return {
    data: user ? {
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name || user.email
      },
      token
    } as Session : null,
    status: isLoading ? "loading" : user ? "authenticated" : "unauthenticated",
    update: async () => true
  };
}

// Mock NextAuth's signIn function
export function signIn(provider?: string, options?: any) {
  // We can't actually implement this mock since we need credentials
  // But we can redirect to our login page
  const router = useRouter();
  router.push('/custom-login');
  return Promise.resolve({ ok: false, error: "Use custom login page" });
}

// Mock NextAuth's signOut function
export function signOut(options?: any) {
  const { logout } = useCustomAuth();
  logout();
  return Promise.resolve({ url: '/custom-login' });
}

// Mock NextAuth options
export const authOptions = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/custom-login' }
};

export default authOptions;
  