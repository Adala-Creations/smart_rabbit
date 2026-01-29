import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, return success message even if user doesn't exist
      // This prevents email enumeration attacks
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, you will be able to reset your password' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Account found. Please proceed with secret key verification.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
