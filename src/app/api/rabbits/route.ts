import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rabbits = await prisma.rabbit.findMany({
      include: {
        cage: {
          include: {
            rabbitry: {
              include: {
                location: true,
              },
            },
          },
        },
        mother: true,
        father: true,
        weights: {
          orderBy: { measurementDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rabbits);
  } catch (error) {
    console.error('Error fetching rabbits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      gender, 
      breed, 
      dateOfBirth, 
      cageId,
      compartment,
      color,
      motherId,
      fatherId,
      notes,
      weight,
      healthStatus,
      healthDescription
    } = await req.json();

    if (!gender || !breed || !cageId) {
      return NextResponse.json(
        { error: 'Gender, breed, and cageId are required' },
        { status: 400 }
      );
    }

    // Auto-generate unique rabbit ID
    const prefix = gender === 'BUCK' ? 'B-' : 'D-';
    const lastRabbit = await prisma.rabbit.findFirst({
      where: { rabbitId: { startsWith: prefix } },
      orderBy: { rabbitId: 'desc' },
    });
    
    let nextNumber = 1;
    if (lastRabbit) {
      const lastNumber = parseInt(lastRabbit.rabbitId.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    const rabbitId = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    const rabbit = await prisma.rabbit.create({
      data: {
        rabbitId,
        name,
        gender,
        breed,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        cageId,
        compartment: compartment ? parseInt(compartment) : 1,
        color,
        motherId,
        fatherId,
        notes,
        healthStatus: healthStatus || 'HEALTHY',
        healthDescription,
      },
      include: {
        cage: true,
        mother: true,
        father: true,
      },
    });

    // If weight is provided, create initial weight measurement
    if (weight) {
      await prisma.weightMeasurement.create({
        data: {
          rabbitId: rabbit.id,
          weight: parseFloat(weight),
          measurementDate: new Date(),
        },
      });
    }

    return NextResponse.json(rabbit, { status: 201 });
  } catch (error) {
    console.error('Error creating rabbit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, breed, cageId, compartment, color, status, notes, healthStatus, healthDescription } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Rabbit ID is required' }, { status: 400 });
    }

    const rabbit = await prisma.rabbit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(breed !== undefined && { breed }),
        ...(cageId !== undefined && { cageId }),
        ...(compartment !== undefined && { compartment: parseInt(compartment) }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(healthStatus !== undefined && { healthStatus }),
        ...(healthDescription !== undefined && { healthDescription }),
      },
      include: {
        cage: true,
        mother: true,
        father: true,
      },
    });

    return NextResponse.json(rabbit);
  } catch (error) {
    console.error('Error updating rabbit:', error);
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
      return NextResponse.json({ error: 'Rabbit ID is required' }, { status: 400 });
    }

    // Check if rabbit has offspring or is involved in matings
    const rabbit = await prisma.rabbit.findUnique({
      where: { id },
      include: {
        offspring: true,
        siredRabbits: true,
        matingsAsBuck: true,
        matingsAsDoe: true,
      },
    });

    if (!rabbit) {
      return NextResponse.json({ error: 'Rabbit not found' }, { status: 404 });
    }

    // Safe delete: only allow if no offspring or matings
    if (rabbit.offspring.length > 0 || rabbit.siredRabbits.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete rabbit with offspring. Please remove offspring first.' },
        { status: 400 }
      );
    }

    if (rabbit.matingsAsBuck.length > 0 || rabbit.matingsAsDoe.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete rabbit with mating records. Please delete matings first or mark rabbit as deceased.' },
        { status: 400 }
      );
    }

    await prisma.rabbit.delete({ where: { id } });

    return NextResponse.json({ message: 'Rabbit deleted successfully' });
  } catch (error) {
    console.error('Error deleting rabbit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
