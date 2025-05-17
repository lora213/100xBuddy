import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({
          status: 'error',
          message: 'You must be logged in.',
        }),
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: { user: session.user },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}