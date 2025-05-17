import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock NextAuth API route to avoid 404 errors
export function GET(req: NextRequest) {
  return NextResponse.json(null);
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: "Use CustomAuthProvider instead of NextAuth",
  }, { status: 200 });
}

export const dynamic = 'force-dynamic';
export const runtime = 'edge';