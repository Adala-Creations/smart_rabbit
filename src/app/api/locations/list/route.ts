import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // 'mode' expects a Prisma QueryMode; cast to any to satisfy typing since this endpoint is lightweight
    const where = q ? { name: { contains: q, mode: 'insensitive' as any } } : {};

    const list = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      select: { id: true, name: true },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching location list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
