import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const NOTE_TYPES = new Set(['GENERAL', 'HEALTH', 'FINANCE', 'OTHER']);
const NOTE_SUBJECTS = new Set(['NONE', 'RABBIT', 'BATCH']);
const noteDelegate = (prisma as any).note;

function ensureNoteDelegate() {
  if (!noteDelegate) {
    throw new Error('Notes model is not available in Prisma client. Run prisma generate and restart the dev server.');
  }
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

export async function GET() {
  try {
    ensureNoteDelegate();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await noteDelegate.findMany({
      where: { userId: user.id },
      include: {
        rabbit: {
          select: {
            id: true,
            rabbitId: true,
            name: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchId: true,
            status: true,
            maleCount: true,
            femaleCount: true,
            availableCount: true,
            count: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureNoteDelegate();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const type = String(body.type || '').toUpperCase();
    const subject = String(body.subject || 'NONE').toUpperCase();
    const rabbitId = body.rabbitId || null;
    const batchId = body.batchId || null;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and note content are required' }, { status: 400 });
    }

    if (!NOTE_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid note type' }, { status: 400 });
    }

    if (!NOTE_SUBJECTS.has(subject)) {
      return NextResponse.json({ error: 'Invalid note subject' }, { status: 400 });
    }

    if (subject === 'RABBIT' && !rabbitId) {
      return NextResponse.json({ error: 'Please select a rabbit' }, { status: 400 });
    }

    if (subject === 'BATCH' && !batchId) {
      return NextResponse.json({ error: 'Please select a batch' }, { status: 400 });
    }

    const note = await noteDelegate.create({
      data: {
        title,
        content,
        type: type as any,
        subject: subject as any,
        rabbitId: subject === 'RABBIT' ? rabbitId : null,
        batchId: subject === 'BATCH' ? batchId : null,
        userId: user.id,
      },
      include: {
        rabbit: {
          select: {
            id: true,
            rabbitId: true,
            name: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchId: true,
            status: true,
            maleCount: true,
            femaleCount: true,
            availableCount: true,
            count: true,
          },
        },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    ensureNoteDelegate();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id;
    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const type = String(body.type || '').toUpperCase();
    const subject = String(body.subject || 'NONE').toUpperCase();
    const rabbitId = body.rabbitId || null;
    const batchId = body.batchId || null;

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const existing = await noteDelegate.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and note content are required' }, { status: 400 });
    }

    if (!NOTE_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid note type' }, { status: 400 });
    }

    if (!NOTE_SUBJECTS.has(subject)) {
      return NextResponse.json({ error: 'Invalid note subject' }, { status: 400 });
    }

    if (subject === 'RABBIT' && !rabbitId) {
      return NextResponse.json({ error: 'Please select a rabbit' }, { status: 400 });
    }

    if (subject === 'BATCH' && !batchId) {
      return NextResponse.json({ error: 'Please select a batch' }, { status: 400 });
    }

    const note = await noteDelegate.update({
      where: { id },
      data: {
        title,
        content,
        type: type as any,
        subject: subject as any,
        rabbitId: subject === 'RABBIT' ? rabbitId : null,
        batchId: subject === 'BATCH' ? batchId : null,
      },
      include: {
        rabbit: {
          select: {
            id: true,
            rabbitId: true,
            name: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchId: true,
            status: true,
            maleCount: true,
            femaleCount: true,
            availableCount: true,
            count: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    ensureNoteDelegate();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const existing = await noteDelegate.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await noteDelegate.delete({ where: { id } });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
