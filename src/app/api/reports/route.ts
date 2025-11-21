import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to format dates by removing ISO timestamp
function formatDate(date: any): string {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0];
  }
  return String(date);
}

// Helper to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',');
  
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'rabbits';
    const format = searchParams.get('format') || 'csv';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let data: any[] = [];
    let headers: string[] = [];

    // Build date filter
    const dateFilter = dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    } : {};

    switch (type) {
      case 'rabbits':
        const rabbits = await prisma.rabbit.findMany({
          where: dateFilter,
          include: {
            cage: {
              include: {
                rabbitry: {
                  include: { location: true },
                },
              },
            },
          },
        });
        data = rabbits.map(r => ({
          rabbitId: r.rabbitId,
          name: r.name,
          gender: r.gender,
          breed: r.breed,
          status: r.status,
          healthStatus: r.healthStatus,
          dateOfBirth: formatDate(r.dateOfBirth),
          color: r.color,
          cage: r.cage?.cageId,
          compartment: (r as any)['compartment'],
          location: r.cage?.rabbitry?.location?.name,
          rabbitry: r.cage?.rabbitry?.name,
          notes: r.notes,
          createdAt: formatDate(r.createdAt),
        }));
        headers = ['rabbitId', 'name', 'gender', 'breed', 'status', 'healthStatus', 'dateOfBirth', 'color', 'cage', 'compartment', 'location', 'rabbitry', 'notes', 'createdAt'];
        break;

      case 'matings':
        const matings = await prisma.mating.findMany({
          where: dateFilter,
          include: {
            buck: true,
            doe: true,
            births: true,
          },
        });
        data = matings.map(m => ({
          matingDate: formatDate(m.matingDate),
          buck: m.buck.rabbitId,
          buckName: m.buck.name,
          doe: m.doe.rabbitId,
          doeName: m.doe.name,
          expectedKindlingDate: formatDate(m.expectedKindlingDate),
          successful: m.successful,
          birthsCount: m.births.length,
          notes: m.notes,
          createdAt: formatDate(m.createdAt),
        }));
        headers = ['matingDate', 'buck', 'buckName', 'doe', 'doeName', 'expectedKindlingDate', 'successful', 'birthsCount', 'notes', 'createdAt'];
        break;

      case 'births':
        const births = await prisma.birth.findMany({
          where: dateFilter,
          include: {
            mating: {
              include: {
                buck: true,
                doe: true,
              },
            },
          },
        });
        data = births.map(b => ({
          birthDate: formatDate(b.birthDate),
          buck: b.mating.buck.rabbitId,
          buckName: b.mating.buck.name,
          doe: b.mating.doe.rabbitId,
          doeName: b.mating.doe.name,
          totalKits: b.totalKits,
          aliveKits: b.aliveKits,
          deadKits: b.deadKits,
          survivalRate: b.aliveKits / b.totalKits * 100,
          notes: b.notes,
          createdAt: formatDate(b.createdAt),
        }));
        headers = ['birthDate', 'buck', 'buckName', 'doe', 'doeName', 'totalKits', 'aliveKits', 'deadKits', 'survivalRate', 'notes', 'createdAt'];
        break;

      case 'deaths':
        const deaths = await prisma.death.findMany({
          where: dateFilter,
          include: {
            rabbit: true,
          },
        });
        data = deaths.map(d => ({
          deathDate: formatDate(d.deathDate),
          rabbitId: d.rabbit.rabbitId,
          rabbitName: d.rabbit.name,
          breed: d.rabbit.breed,
          gender: d.rabbit.gender,
          cause: d.cause,
          notes: d.notes,
          createdAt: formatDate(d.createdAt),
        }));
        headers = ['deathDate', 'rabbitId', 'rabbitName', 'breed', 'gender', 'cause', 'notes', 'createdAt'];
        break;

      case 'sales':
        const sales = await prisma.sale.findMany({
          where: dateFilter,
          include: {
            rabbit: true,
          },
        });
        data = sales.map(s => ({
          saleDate: formatDate(s.saleDate),
          rabbit: s.rabbit?.rabbitId,
          rabbitName: s.rabbit?.name,
          description: s.description,
          amount: s.amount,
          buyerName: s.buyerName,
          buyerContact: s.buyerContact,
          notes: s.notes,
          createdAt: formatDate(s.createdAt),
        }));
        headers = ['saleDate', 'rabbit', 'rabbitName', 'description', 'amount', 'buyerName', 'buyerContact', 'notes', 'createdAt'];
        break;

      case 'expenses':
        const expenses = await prisma.expense.findMany({
          where: dateFilter,
        });
        data = expenses.map(e => ({
          expenseDate: formatDate(e.expenseDate),
          description: e.description,
          category: e.category,
          amount: e.amount,
          vendor: e.vendor,
          notes: e.notes,
          createdAt: formatDate(e.createdAt),
        }));
        headers = ['expenseDate', 'description', 'category', 'amount', 'vendor', 'notes', 'createdAt'];
        break;

      case 'locations':
        const locations = await prisma.location.findMany({
          where: dateFilter,
          include: {
            rabbitries: true,
          },
        });
        data = locations.map(l => ({
          name: l.name,
          type: l.type,
          address: l.address,
          description: l.description,
          rabbitriesCount: l.rabbitries.length,
          createdAt: formatDate(l.createdAt),
        }));
        headers = ['name', 'type', 'address', 'description', 'rabbitriesCount', 'createdAt'];
        break;

      case 'cages':
        const cages = await prisma.cage.findMany({
          where: dateFilter,
          include: {
            rabbitry: {
              include: { location: true },
            },
            rabbits: true,
          },
        });
        data = cages.map(c => ({
          cageId: c.cageId,
          type: c.type,
          capacity: c.capacity,
          compartments: c.compartments,
          currentOccupancy: c.rabbits.length,
          location: c.rabbitry.location.name,
          rabbitry: c.rabbitry.name,
          description: c.description,
          createdAt: formatDate(c.createdAt),
        }));
        headers = ['cageId', 'type', 'capacity', 'compartments', 'currentOccupancy', 'location', 'rabbitry', 'description', 'createdAt'];
        break;

      case 'workers':
        const workers = await prisma.rabbitryWorker.findMany({
          where: (dateFrom || dateTo) ? {
            assignedAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          } : undefined,
          include: {
            user: true,
            rabbitry: true,
          },
        });
        data = workers.map(w => ({
          workerName: w.user.name,
          email: w.user.email,
          userRole: w.user.role,
          rabbitry: w.rabbitry.name,
          workerRole: w.role,
          assignedAt: w.assignedAt,
        }));
        headers = ['workerName', 'email', 'userRole', 'rabbitry', 'workerRole', 'assignedAt'];
        break;

      case 'health':
        const healthHistory = await prisma.offspringBatchHealthHistory.findMany({
          where: dateFilter,
          include: { batch: true },
          orderBy: { createdAt: 'desc' },
        });
        data = healthHistory.map(h => ({
          batchId: h.batch.batchId,
            status: h.status,
            notes: h.notes,
            createdAt: formatDate(h.createdAt),
        }));
        headers = ['batchId','status','notes','createdAt'];
        break;

      case 'complete':
        // Generate complete report with all data
        const completeData: any = {};
        
        completeData.rabbits = await prisma.rabbit.findMany({ include: { cage: true } });
        completeData.matings = await prisma.mating.findMany({ include: { buck: true, doe: true } });
        completeData.births = await prisma.birth.findMany({ include: { mating: true } });
        completeData.deaths = await prisma.death.findMany({ include: { rabbit: true } });
        completeData.sales = await prisma.sale.findMany({ include: { rabbit: true } });
        completeData.expenses = await prisma.expense.findMany();
        completeData.locations = await prisma.location.findMany({ include: { rabbitries: true } });
        completeData.cages = await prisma.cage.findMany({ include: { rabbitry: true, rabbits: true } });
        completeData.workers = await prisma.rabbitryWorker.findMany({ include: { user: true, rabbitry: true } });

        if (format === 'json') {
          return new NextResponse(JSON.stringify(completeData, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="complete_report_${new Date().toISOString().split('T')[0]}.json"`,
            },
          });
        }
        
        // For CSV, return error as complete report is too complex for CSV
        return NextResponse.json({ error: 'Complete report only available in JSON format' }, { status: 400 });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate response based on format
    if (format === 'csv') {
      const csv = convertToCSV(data, headers);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
