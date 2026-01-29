import { NextResponse } from 'next/server';

const RESET_SECRET_KEY = 'Res3+Pa55w0rD';

export async function POST(req: Request) {
  try {
    const { secretKey } = await req.json();

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Secret key is required' },
        { status: 400 }
      );
    }

    if (secretKey !== RESET_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Secret key verified' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Secret key verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
