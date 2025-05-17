import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/matches',
  '/connections',
  '/ikigai',
  '/custom-dashboard',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/custom-login',
  '/custom-register',
];

// Helper function to get cookie value
function getCookie(request: NextRequest, name: string) {
  const cookie = request.cookies.get(name);
  return cookie ? cookie.value : null;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  // If it's neither protected nor public, allow access (e.g., API routes, static files)
  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next();
  }
  
  try {
    // For protected routes, check authentication
    if (isProtectedRoute) {
      // Check for custom auth token cookie
      const customAuthToken = getCookie(request, 'access_token');
      
      // If no token found, redirect to login
      if (!customAuthToken) {
        const url = new URL('/custom-login', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
      }
    }
    
    // For public routes (except homepage), if user is already authenticated, redirect to dashboard
    if (isPublicRoute && path !== '/') {
      // Check for custom auth token cookie
      const customAuthToken = getCookie(request, 'access_token');
      
      if (customAuthToken) {
        // If already logged in and trying to access login/register, redirect to dashboard
        return NextResponse.redirect(new URL('/custom-dashboard', request.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, allow the request to proceed
    return NextResponse.next();
  }
}

// Configure the matcher for the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /icons (inside /public)
     * 5. /images (inside /public)
     * 6. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|icons|images|[\\w-]+\\.\\w+).*)',
  ],
};