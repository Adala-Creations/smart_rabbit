// 'offspring-deaths' case was moved into the switch below to avoid accidental top-level code

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
      case 'rabbits-inventory':
        // Fetch adult rabbits
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
        const rabbitRows = rabbits.map(r => ({
          type: 'Adult Rabbit',
          id: r.rabbitId,
          name: r.name,
          gender: r.gender,
          breed: r.breed,
          status: r.status,
          healthStatus: r.healthStatus,
          dateOfBirth: formatDate(r.dateOfBirth),
          color: r.color,
          count: 1,
          cage: r.cage?.cageId,
          compartment: (r as any)['compartment'],
          location: r.cage?.rabbitry?.location?.name,
          rabbitry: r.cage?.rabbitry?.name,
          notes: r.notes,
          createdAt: formatDate(r.createdAt),
        }));

        // Fetch offspring batches (exclude ARCHIVED)
        const offspringBatches = await prisma.offspringBatch.findMany({
          where: {
            ...dateFilter,
            status: { not: 'ARCHIVED' },
          },
          include: {
            birth: {
              include: {
                mating: {
                  include: {
                    buck: true,
                    doe: true,
                  },
                },
              },
            },
            cage: {
              include: {
                rabbitry: {
                  include: { location: true },
                },
              },
            },
          },
        });
        const offspringRows = offspringBatches.map(b => ({
          type: b.status === 'SEXED' ? 'Grower Batch' : 'Kit Batch',
          id: b.batchId,
          name: null,
          gender: b.maleCount && b.femaleCount ? `${b.maleCount}M/${b.femaleCount}F` : 'Unsexed',
          breed: b.birth?.mating?.buck?.breed || b.birth?.mating?.doe?.breed || '',
          status: b.status,
          healthStatus: b.overallHealthStatus,
          dateOfBirth: formatDate(b.birth?.birthDate),
          color: null,
          count: b.count,
          cage: b.cage?.cageId,
          compartment: b.compartment,
          location: b.cage?.rabbitry?.location?.name,
          rabbitry: b.cage?.rabbitry?.name,
          notes: b.notes,
          createdAt: formatDate(b.createdAt),
        }));

        // Combine rabbits and offspring
        data = [...rabbitRows, ...offspringRows];
        headers = ['type', 'id', 'name', 'gender', 'breed', 'status', 'healthStatus', 'dateOfBirth', 'color', 'count', 'cage', 'compartment', 'location', 'rabbitry', 'notes', 'createdAt'];
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
      case 'death-records':
        // Fetch adult rabbit deaths
        const deaths = await prisma.death.findMany({
          where: dateFilter,
          include: {
            rabbit: true,
          },
        });
        const deathRows = deaths.map(d => ({
          type: 'Adult Rabbit',
          deathDate: formatDate(d.deathDate),
          id: d.rabbit.rabbitId,
          name: d.rabbit.name,
          breed: d.rabbit.breed,
          gender: d.rabbit.gender,
          count: 1,
          ageAtDeath: (() => {
            try {
              const dob = d.rabbit?.dateOfBirth;
              const dd = d.deathDate;
              if (!dob || !dd) return '';
              const b = new Date(dob);
              const de = new Date(dd);
              if (isNaN(b.getTime()) || isNaN(de.getTime()) || de < b) return '';
              let years = de.getFullYear() - b.getFullYear();
              let months = de.getMonth() - b.getMonth();
              let days = de.getDate() - b.getDate();
              if (days < 0) { months -= 1; const prevMonth = new Date(de.getFullYear(), de.getMonth(), 0).getDate(); days += prevMonth; }
              if (months < 0) { years -= 1; months += 12; }
              if (years > 0) return `${years}y${months > 0 ? ` ${months}m` : ''}`;
              if (months > 0) return `${months}m${days > 0 ? ` ${days}d` : ''}`;
              return `${days}d`;
            } catch(e) { return ''; }
          })(),
          cause: d.cause,
          notes: d.notes,
          createdAt: formatDate(d.createdAt),
        }));

        // Fetch offspring deaths
        const offspringDeaths = await prisma.offspringDeath.findMany({
          where: dateFilter as any,
          include: { birth: { include: { mating: { include: { buck: true, doe: true } } } } },
        });
        const offspringDeathRows = offspringDeaths.map(od => ({
          type: 'Offspring (Kit)',
          deathDate: formatDate(od.deathDate),
          id: null,
          name: null,
          breed: od.birth?.mating?.buck?.breed || od.birth?.mating?.doe?.breed || '',
          gender: null,
          count: od.count,
          ageAtDeath: (() => {
            try {
              const bd = od.birth?.birthDate;
              const dd = od.deathDate;
              if (!bd || !dd) return '';
              const b = new Date(bd);
              const de = new Date(dd);
              if (isNaN(b.getTime()) || isNaN(de.getTime()) || de < b) return '';
              let years = de.getFullYear() - b.getFullYear();
              let months = de.getMonth() - b.getMonth();
              let days = de.getDate() - b.getDate();
              if (days < 0) { months -= 1; const prevMonth = new Date(de.getFullYear(), de.getMonth(), 0).getDate(); days += prevMonth; }
              if (months < 0) { years -= 1; months += 12; }
              if (years > 0) return `${years}y${months > 0 ? ` ${months}m` : ''}`;
              if (months > 0) return `${months}m${days > 0 ? ` ${days}d` : ''}`;
              return `${days}d`;
            } catch(e) { return ''; }
          })(),
          cause: od.cause,
          notes: od.notes,
          createdAt: formatDate(od.createdAt),
        }));

        // Combine adult and offspring deaths
        data = [...deathRows, ...offspringDeathRows];
        headers = ['type', 'deathDate', 'id', 'name', 'breed', 'gender', 'count', 'ageAtDeath', 'cause', 'notes', 'createdAt'];
        break;

      case 'offspring-deaths':
        // Keep for backward compatibility
        const offspringDeathsLegacy = await prisma.offspringDeath.findMany({
          where: dateFilter as any,
          include: { birth: { include: { mating: { include: { buck: true, doe: true } } } } },
        });
        data = offspringDeathsLegacy.map(od => ({
          birthDate: formatDate(od.birth.birthDate),
          parents: od.birth.mating ? `${od.birth.mating.buck.rabbitId} × ${od.birth.mating.doe.rabbitId}` : '',
          deathDate: formatDate(od.deathDate),
          count: od.count,
          cause: od.cause,
          ageAtDeath: (() => {
            try {
              const bd = od.birth?.birthDate;
              const dd = od.deathDate;
              if (!bd || !dd) return '';
              const b = new Date(bd);
              const de = new Date(dd);
              if (isNaN(b.getTime()) || isNaN(de.getTime()) || de < b) return '';
              let years = de.getFullYear() - b.getFullYear();
              let months = de.getMonth() - b.getMonth();
              let days = de.getDate() - b.getDate();
              if (days < 0) { months -= 1; const prevMonth = new Date(de.getFullYear(), de.getMonth(), 0).getDate(); days += prevMonth; }
              if (months < 0) { years -= 1; months += 12; }
              if (years > 0) return `${years}y${months > 0 ? ` ${months}m` : ''}`;
              if (months > 0) return `${months}m${days > 0 ? ` ${days}d` : ''}`;
              return `${days}d`;
            } catch(e) { return ''; }
          })(),
          notes: od.notes,
          createdAt: formatDate(od.createdAt),
        }));
        headers = ['birthDate', 'parents', 'deathDate', 'count', 'cause', 'ageAtDeath', 'notes', 'createdAt'];
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

      case 'finance-records':
        // Fetch sales
        const salesCombined = await prisma.sale.findMany({
          where: dateFilter,
          include: {
            rabbit: true,
          },
        });
        const salesRows = salesCombined.map(s => ({
          type: 'Sale',
          date: formatDate(s.saleDate),
          description: s.description,
          category: null,
          amount: s.amount,
          rabbit: s.rabbit?.rabbitId,
          rabbitName: s.rabbit?.name,
          buyerName: s.buyerName,
          buyerContact: s.buyerContact,
          vendor: null,
          notes: s.notes,
          createdAt: formatDate(s.createdAt),
        }));

        // Fetch expenses
        const expensesCombined = await prisma.expense.findMany({
          where: dateFilter,
        });
        const expenseRows = expensesCombined.map(e => ({
          type: 'Expense',
          date: formatDate(e.expenseDate),
          description: e.description,
          category: e.category,
          amount: -Math.abs(e.amount), // Negative for expenses
          rabbit: null,
          rabbitName: null,
          buyerName: null,
          buyerContact: null,
          vendor: e.vendor,
          notes: e.notes,
          createdAt: formatDate(e.createdAt),
        }));

        // Combine sales and expenses
        data = [...salesRows, ...expenseRows];
        headers = ['type', 'date', 'description', 'category', 'amount', 'rabbit', 'rabbitName', 'buyerName', 'buyerContact', 'vendor', 'notes', 'createdAt'];
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
