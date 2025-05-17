import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

// Direct API URL (not using our api.ts to avoid circular dependencies)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Make direct request to the backend instead of using our api client
          const response = await axios.post(`${API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          
          // Handle the response according to your backend's structure
          // This structure should match what your backend returns
          const { user, token } = response.data;
          
          if (user && token) {
            // Return the user object with token
            return {
              id: user.id,
              email: user.email,
              name: user.full_name || user.name,
              token: token,
            };
          }
          
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // If user just signed in, add their data to the token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.token = user.token; // Store the auth token
      }
      return token;
    },
    async session({ session, token }) {
      // Send token and user info to client
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
        session.token = token.token as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;