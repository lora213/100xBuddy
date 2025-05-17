import { CustomAuthProvider } from '@/lib/custom-auth';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SuperNetworkAI',
  description: 'Find your perfect match with AI-powered networking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CustomAuthProvider>
          {children}
        </CustomAuthProvider>
      </body>
    </html>
  );
}
