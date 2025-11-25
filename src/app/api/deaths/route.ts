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

    const deaths = await prisma.death.findMany({
      include: {
        rabbit: true,
      },
      orderBy: { deathDate: 'desc' },
    });

    // Compute age at death for each record
    const formatted = deaths.map((d) => {
      const dob = d.rabbit?.dateOfBirth;
      const dd = d.deathDate;
      let ageAtDeath = '-';
      try {
        if (dob && dd) {
          const b = new Date(dob);
          const de = new Date(dd);
          if (!isNaN(b.getTime()) && !isNaN(de.getTime()) && de >= b) {
            let years = de.getFullYear() - b.getFullYear();
            let months = de.getMonth() - b.getMonth();
            let days = de.getDate() - b.getDate();
            if (days < 0) { months -= 1; const prevMonth = new Date(de.getFullYear(), de.getMonth(), 0).getDate(); days += prevMonth; }
            if (months < 0) { years -= 1; months += 12; }
            if (years > 0) ageAtDeath = `${years}y${months > 0 ? ` ${months}m` : ''}`;
            else if (months > 0) ageAtDeath = `${months}m${days > 0 ? ` ${days}d` : ''}`;
            else ageAtDeath = `${days}d`;
          }
        }
      } catch (e) {
        /* ignore */
      }
      return { ...d, ageAtDeath };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching deaths:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rabbitId, deathDate, cause, notes } = await req.json();

    if (!rabbitId || !deathDate) {
      return NextResponse.json(
        { error: 'RabbitId and deathDate are required' },
        { status: 400 }
      );
    }

    const death = await prisma.death.create({
      data: {
        rabbitId,
        deathDate: new Date(deathDate),
        cause,
        notes,
      },
      include: {
        rabbit: true,
      },
    });

    // Update rabbit status to DECEASED
    await prisma.rabbit.update({
      where: { id: rabbitId },
      data: { status: 'DECEASED' },
    });

    return NextResponse.json(death, { status: 201 });
  } catch (error) {
    console.error('Error recording death:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, deathDate, cause, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Death ID is required' }, { status: 400 });
    }

    const death = await prisma.death.update({
      where: { id },
      data: {
        ...(deathDate !== undefined && { deathDate: new Date(deathDate) }),
        ...(cause !== undefined && { cause }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        rabbit: true,
      },
    });

    return NextResponse.json(death);
  } catch (error) {
    console.error('Error updating death:', error);
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
      return NextResponse.json({ error: 'Death ID is required' }, { status: 400 });
    }

    const death = await prisma.death.findUnique({
      where: { id },
      include: { rabbit: true },
    });

    if (!death) {
      return NextResponse.json({ error: 'Death record not found' }, { status: 404 });
    }

    // Revert rabbit status back to ACTIVE when deleting death record
    await prisma.rabbit.update({
      where: { id: death.rabbitId },
      data: { status: 'ACTIVE' },
    });

    await prisma.death.delete({ where: { id } });

    return NextResponse.json({ message: 'Death record deleted successfully' });
  } catch (error) {
    console.error('Error deleting death:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
