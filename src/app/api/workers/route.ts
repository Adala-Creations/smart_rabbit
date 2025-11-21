import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper function to generate random password
function generatePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rabbitryId = searchParams.get('rabbitryId');

    // If rabbitryId is provided, get workers for that rabbitry
    if (rabbitryId) {
      const workers = await prisma.rabbitryWorker.findMany({
        where: { rabbitryId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          rabbitry: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      });
      return NextResponse.json(workers);
    }

    // Otherwise, get all workers
    const workers = await prisma.rabbitryWorker.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        rabbitry: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an OWNER
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can add workers' },
        { status: 403 }
      );
    }

    const { email, name, rabbitryId, role } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    let generatedPassword = '';

    if (!user) {
      // Create new user account with auto-generated password
      generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          role: 'WORKER',
        },
      });
    } else {
      // User exists - check if they're not already an owner
      if (user.role === 'OWNER') {
        return NextResponse.json(
          { error: 'Cannot add an owner as a worker' },
          { status: 400 }
        );
      }
    }

    // If rabbitryId is provided, assign worker to rabbitry
    let worker = null;
    if (rabbitryId) {
      // Check if rabbitry exists
      const rabbitry = await prisma.rabbitry.findUnique({ where: { id: rabbitryId } });
      if (!rabbitry) {
        return NextResponse.json({ error: 'Rabbitry not found' }, { status: 404 });
      }

      // Check if worker is already assigned
      const existingAssignment = await prisma.rabbitryWorker.findUnique({
        where: {
          rabbitryId_userId: {
            rabbitryId,
            userId: user.id,
          },
        },
      });

      if (!existingAssignment) {
        worker = await prisma.rabbitryWorker.create({
          data: {
            rabbitryId,
            userId: user.id,
            role: role || 'worker',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            rabbitry: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      worker,
      generatedPassword: generatedPassword || null, // Only sent if new account was created
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Worker assignment ID is required' }, { status: 400 });
    }

    const worker = await prisma.rabbitryWorker.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        rabbitry: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error('Error updating worker assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Worker assignment ID is required' }, { status: 400 });
    }

    const worker = await prisma.rabbitryWorker.findUnique({
      where: { id },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker assignment not found' }, { status: 404 });
    }

    await prisma.rabbitryWorker.delete({ where: { id } });

    return NextResponse.json({ message: 'Worker removed from rabbitry successfully' });
  } catch (error) {
    console.error('Error removing worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
