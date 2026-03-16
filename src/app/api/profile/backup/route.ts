import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PROFILE_BACKUP_VERSION = 1;
const PROFILE_BACKUP_APP = 'smart-rabbit';

type BackupProfile = {
  email: string;
  name: string | null;
  role: string;
};

type BackupLocation = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupRabbitry = {
  id: string;
  name: string;
  description: string | null;
  locationId: string;
  createdAt: string;
  updatedAt: string;
};

type BackupWorkerAssignment = {
  id: string;
  rabbitryId: string;
  role: string;
  assignedAt: string;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
};

type BackupCage = {
  id: string;
  cageId: string;
  type: string;
  rabbitryId: string;
  capacity: number;
  compartments: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupRabbit = {
  id: string;
  rabbitId: string;
  name: string | null;
  gender: string;
  breed: string;
  dateOfBirth: string | null;
  cageId: string;
  status: string;
  healthStatus: string;
  healthDescription: string | null;
  color: string | null;
  motherId: string | null;
  fatherId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  compartment: number;
};

type BackupWeightMeasurement = {
  id: string;
  rabbitId: string;
  weight: number;
  measurementDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupMating = {
  id: string;
  buckId: string;
  doeId: string;
  matingDate: string;
  expectedKindlingDate: string | null;
  successful: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupBirth = {
  id: string;
  matingId: string;
  birthDate: string;
  totalKits: number;
  aliveKits: number;
  deadKits: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupOffspringBatch = {
  id: string;
  batchId: string;
  birthId: string;
  count: number;
  status: string;
  notes: string | null;
  sourceBatchId: string | null;
  createdAt: string;
  updatedAt: string;
  overallHealthStatus: string;
  cageId: string | null;
  compartment: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  sexedAt: string | null;
  availableCount: number;
};

type BackupOffspringBatchHealthHistory = {
  id: string;
  batchId: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type BackupOffspringWeight = {
  id: string;
  batchId: string;
  weight: number;
  measurementDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupOffspringDeath = {
  id: string;
  batchId: string;
  deathDate: string;
  count: number;
  cause: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupDeath = {
  id: string;
  rabbitId: string;
  deathDate: string;
  cause: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupSale = {
  id: string;
  rabbitId: string | null;
  batchId: string | null;
  quantitySold: number;
  description: string;
  amount: number;
  saleDate: string;
  buyerName: string | null;
  buyerContact: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupExpense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupDebtor = {
  id: string;
  name: string;
  contact: string | null;
  amountOwed: number;
  description: string;
  dueDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupCreditor = BackupDebtor;

type BackupNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  userId: string | null;
  relatedId: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupNote = {
  id: string;
  title: string;
  content: string;
  type: string;
  subject: string;
  rabbitId: string | null;
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProfileBackupPayload = {
  app: string;
  version: number;
  exportedAt: string;
  profile: BackupProfile;
  data: {
    locations: BackupLocation[];
    rabbitries: BackupRabbitry[];
    workerAssignments: BackupWorkerAssignment[];
    cages: BackupCage[];
    rabbits: BackupRabbit[];
    weightMeasurements: BackupWeightMeasurement[];
    matings: BackupMating[];
    births: BackupBirth[];
    offspringBatches: BackupOffspringBatch[];
    offspringBatchHealthHistory: BackupOffspringBatchHealthHistory[];
    offspringWeights: BackupOffspringWeight[];
    offspringDeaths: BackupOffspringDeath[];
    deaths: BackupDeath[];
    sales: BackupSale[];
    expenses: BackupExpense[];
    debtors: BackupDebtor[];
    creditors: BackupCreditor[];
    notifications: BackupNotification[];
    notes: BackupNote[];
  };
};

type RestoreSummary = {
  restoredWorkerAssignments: number;
  skippedWorkerAssignments: number;
};

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function ensureBackupPayload(payload: unknown): ProfileBackupPayload {
  if (!isRecord(payload)) {
    throw new Error('Invalid backup file.');
  }

  if (payload.app !== PROFILE_BACKUP_APP || payload.version !== PROFILE_BACKUP_VERSION) {
    throw new Error('Unsupported backup format.');
  }

  if (!isRecord(payload.profile) || typeof payload.profile.email !== 'string') {
    throw new Error('Backup profile metadata is missing.');
  }

  if (!isRecord(payload.data)) {
    throw new Error('Backup data is missing.');
  }

  const requiredCollections = [
    'locations',
    'rabbitries',
    'workerAssignments',
    'cages',
    'rabbits',
    'weightMeasurements',
    'matings',
    'births',
    'offspringBatches',
    'offspringBatchHealthHistory',
    'offspringWeights',
    'offspringDeaths',
    'deaths',
    'sales',
    'expenses',
    'debtors',
    'creditors',
    'notifications',
    'notes',
  ];

  for (const key of requiredCollections) {
    if (!Array.isArray(payload.data[key])) {
      throw new Error(`Backup collection \"${key}\" is missing or invalid.`);
    }
  }

  return payload as ProfileBackupPayload;
}

async function requireOwner() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  if (user.role !== 'OWNER') {
    return { error: NextResponse.json({ error: 'Only owners can back up or restore data' }, { status: 403 }) };
  }

  return { user };
}

async function buildBackupPayload(user: { id: string; email: string; name: string | null; role: string }): Promise<ProfileBackupPayload> {
  const locations = await prisma.location.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  const locationIds = locations.map((location) => location.id);

  const rabbitries = locationIds.length > 0
    ? await prisma.rabbitry.findMany({
        where: {
          ownerId: user.id,
          locationId: { in: locationIds },
        },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const rabbitryIds = rabbitries.map((rabbitry) => rabbitry.id);

  const workerAssignments = rabbitryIds.length > 0
    ? await prisma.rabbitryWorker.findMany({
        where: { rabbitryId: { in: rabbitryIds } },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { assignedAt: 'asc' },
      })
    : [];

  const cages = rabbitryIds.length > 0
    ? await prisma.cage.findMany({
        where: { rabbitryId: { in: rabbitryIds } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const cageIds = cages.map((cage) => cage.id);

  const rabbits = cageIds.length > 0
    ? await prisma.rabbit.findMany({
        where: { cageId: { in: cageIds } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const rabbitIds = rabbits.map((rabbit) => rabbit.id);

  const weightMeasurements = rabbitIds.length > 0
    ? await prisma.weightMeasurement.findMany({
        where: { rabbitId: { in: rabbitIds } },
        orderBy: { measurementDate: 'asc' },
      })
    : [];

  const matings = rabbitIds.length > 0
    ? await prisma.mating.findMany({
        where: {
          buckId: { in: rabbitIds },
          doeId: { in: rabbitIds },
        },
        orderBy: { matingDate: 'asc' },
      })
    : [];

  const matingIds = matings.map((mating) => mating.id);

  const births = matingIds.length > 0
    ? await prisma.birth.findMany({
        where: { matingId: { in: matingIds } },
        orderBy: { birthDate: 'asc' },
      })
    : [];

  const birthIds = births.map((birth) => birth.id);

  const offspringBatches = birthIds.length > 0
    ? await prisma.offspringBatch.findMany({
        where: { birthId: { in: birthIds } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const batchIds = offspringBatches.map((batch) => batch.id);

  const offspringBatchHealthHistory = batchIds.length > 0
    ? await prisma.offspringBatchHealthHistory.findMany({
        where: { batchId: { in: batchIds } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const offspringWeights = batchIds.length > 0
    ? await prisma.offspringWeight.findMany({
        where: { batchId: { in: batchIds } },
        orderBy: { measurementDate: 'asc' },
      })
    : [];

  const offspringDeaths = batchIds.length > 0
    ? await prisma.offspringDeath.findMany({
        where: { batchId: { in: batchIds } },
        orderBy: { deathDate: 'asc' },
      })
    : [];

  const deaths = rabbitIds.length > 0
    ? await prisma.death.findMany({
        where: { rabbitId: { in: rabbitIds } },
        orderBy: { deathDate: 'asc' },
      })
    : [];

  const sales = await prisma.sale.findMany({
    where: {
      OR: [
        rabbitIds.length > 0 ? { rabbitId: { in: rabbitIds } } : undefined,
        batchIds.length > 0 ? { batchId: { in: batchIds } } : undefined,
      ].filter(Boolean) as Prisma.SaleWhereInput[],
    },
    orderBy: { saleDate: 'asc' },
  });

  const expenses = await prisma.expense.findMany({ orderBy: { expenseDate: 'asc' } });
  const debtors = await prisma.debtor.findMany({ orderBy: { createdAt: 'asc' } });
  const creditors = await prisma.creditor.findMany({ orderBy: { createdAt: 'asc' } });
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: null }, { userId: user.id }],
    },
    orderBy: { createdAt: 'asc' },
  });
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  return {
    app: PROFILE_BACKUP_APP,
    version: PROFILE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
    data: serialize({
      locations,
      rabbitries: rabbitries.map(({ ownerId: _ownerId, ...rabbitry }) => rabbitry),
      workerAssignments: workerAssignments.map((assignment) => ({
        id: assignment.id,
        rabbitryId: assignment.rabbitryId,
        role: assignment.role,
        assignedAt: assignment.assignedAt.toISOString(),
        user: assignment.user,
      })),
      cages,
      rabbits,
      weightMeasurements,
      matings,
      births,
      offspringBatches,
      offspringBatchHealthHistory,
      offspringWeights,
      offspringDeaths,
      deaths,
      sales,
      expenses,
      debtors,
      creditors,
      notifications,
      notes: notes.map(({ userId: _userId, ...note }) => note),
    }) as unknown as ProfileBackupPayload['data'],
  };
}

async function deleteCurrentDataset(tx: Prisma.TransactionClient, userId: string) {
  const locations = await tx.location.findMany({
    where: { userId },
    select: { id: true },
  });
  const locationIds = locations.map((location) => location.id);

  const rabbitries = locationIds.length > 0
    ? await tx.rabbitry.findMany({
        where: {
          ownerId: userId,
          locationId: { in: locationIds },
        },
        select: { id: true },
      })
    : [];
  const rabbitryIds = rabbitries.map((rabbitry) => rabbitry.id);

  const cages = rabbitryIds.length > 0
    ? await tx.cage.findMany({
        where: { rabbitryId: { in: rabbitryIds } },
        select: { id: true },
      })
    : [];
  const cageIds = cages.map((cage) => cage.id);

  const rabbits = cageIds.length > 0
    ? await tx.rabbit.findMany({
        where: { cageId: { in: cageIds } },
        select: { id: true },
      })
    : [];
  const rabbitIds = rabbits.map((rabbit) => rabbit.id);

  const matings = rabbitIds.length > 0
    ? await tx.mating.findMany({
        where: {
          buckId: { in: rabbitIds },
          doeId: { in: rabbitIds },
        },
        select: { id: true },
      })
    : [];
  const matingIds = matings.map((mating) => mating.id);

  const births = matingIds.length > 0
    ? await tx.birth.findMany({
        where: { matingId: { in: matingIds } },
        select: { id: true },
      })
    : [];
  const birthIds = births.map((birth) => birth.id);

  const batches = birthIds.length > 0
    ? await tx.offspringBatch.findMany({
        where: { birthId: { in: birthIds } },
        select: { id: true },
      })
    : [];
  const batchIds = batches.map((batch) => batch.id);

  await tx.note.deleteMany({
    where: {
      OR: [
        { userId },
        rabbitIds.length > 0 ? { rabbitId: { in: rabbitIds } } : undefined,
        batchIds.length > 0 ? { batchId: { in: batchIds } } : undefined,
      ].filter(Boolean) as Prisma.NoteWhereInput[],
    },
  });

  if (rabbitIds.length > 0) {
    await tx.weightMeasurement.deleteMany({ where: { rabbitId: { in: rabbitIds } } });
    await tx.death.deleteMany({ where: { rabbitId: { in: rabbitIds } } });
  }

  if (batchIds.length > 0) {
    await tx.offspringBatchHealthHistory.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.offspringWeight.deleteMany({ where: { batchId: { in: batchIds } } });
    await tx.offspringDeath.deleteMany({ where: { batchId: { in: batchIds } } });
  }

  if (rabbitIds.length > 0 || batchIds.length > 0) {
    await tx.sale.deleteMany({
      where: {
        OR: [
          rabbitIds.length > 0 ? { rabbitId: { in: rabbitIds } } : undefined,
          batchIds.length > 0 ? { batchId: { in: batchIds } } : undefined,
        ].filter(Boolean) as Prisma.SaleWhereInput[],
      },
    });
  }

  if (rabbitryIds.length > 0) {
    await tx.rabbitryWorker.deleteMany({ where: { rabbitryId: { in: rabbitryIds } } });
  }

  if (batchIds.length > 0) {
    await tx.offspringBatch.deleteMany({ where: { id: { in: batchIds } } });
  }

  if (birthIds.length > 0) {
    await tx.birth.deleteMany({ where: { id: { in: birthIds } } });
  }

  if (matingIds.length > 0) {
    await tx.mating.deleteMany({ where: { id: { in: matingIds } } });
  }

  if (rabbitIds.length > 0) {
    await tx.rabbit.deleteMany({ where: { id: { in: rabbitIds } } });
  }

  if (cageIds.length > 0) {
    await tx.cage.deleteMany({ where: { id: { in: cageIds } } });
  }

  if (rabbitryIds.length > 0) {
    await tx.rabbitry.deleteMany({ where: { id: { in: rabbitryIds } } });
  }

  if (locationIds.length > 0) {
    await tx.location.deleteMany({ where: { id: { in: locationIds } } });
  }

  await tx.expense.deleteMany({});
  await tx.debtor.deleteMany({});
  await tx.creditor.deleteMany({});
  await tx.notification.deleteMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
  });
}

async function restoreBackup(tx: Prisma.TransactionClient, user: { id: string; name: string | null }, backup: ProfileBackupPayload): Promise<RestoreSummary> {
  await deleteCurrentDataset(tx, user.id);

  await tx.user.update({
    where: { id: user.id },
    data: { name: backup.profile.name },
  });

  if (backup.data.locations.length > 0) {
    await tx.location.createMany({
      data: backup.data.locations.map((location) => ({
        id: location.id,
        name: location.name,
        description: location.description,
        type: location.type,
        address: location.address,
        userId: user.id,
        createdAt: new Date(location.createdAt),
        updatedAt: new Date(location.updatedAt),
      })),
    });
  }

  if (backup.data.rabbitries.length > 0) {
    await tx.rabbitry.createMany({
      data: backup.data.rabbitries.map((rabbitry) => ({
        id: rabbitry.id,
        name: rabbitry.name,
        description: rabbitry.description,
        locationId: rabbitry.locationId,
        ownerId: user.id,
        createdAt: new Date(rabbitry.createdAt),
        updatedAt: new Date(rabbitry.updatedAt),
      })),
    });
  }

  if (backup.data.cages.length > 0) {
    await tx.cage.createMany({
      data: backup.data.cages.map((cage) => ({
        id: cage.id,
        cageId: cage.cageId,
        type: cage.type as 'BREEDING' | 'WEANER',
        rabbitryId: cage.rabbitryId,
        capacity: cage.capacity,
        compartments: cage.compartments,
        description: cage.description,
        createdAt: new Date(cage.createdAt),
        updatedAt: new Date(cage.updatedAt),
      })),
    });
  }

  if (backup.data.rabbits.length > 0) {
    await tx.rabbit.createMany({
      data: backup.data.rabbits.map((rabbit) => ({
        id: rabbit.id,
        rabbitId: rabbit.rabbitId,
        name: rabbit.name,
        gender: rabbit.gender as 'BUCK' | 'DOE',
        breed: rabbit.breed,
        dateOfBirth: parseDate(rabbit.dateOfBirth),
        cageId: rabbit.cageId,
        status: rabbit.status as 'ACTIVE' | 'SOLD' | 'DECEASED' | 'WEANED',
        healthStatus: rabbit.healthStatus as 'HEALTHY' | 'SICK' | 'INJURED',
        healthDescription: rabbit.healthDescription,
        color: rabbit.color,
        motherId: null,
        fatherId: null,
        notes: rabbit.notes,
        createdAt: new Date(rabbit.createdAt),
        updatedAt: new Date(rabbit.updatedAt),
        compartment: rabbit.compartment,
      })),
    });

    for (const rabbit of backup.data.rabbits) {
      if (!rabbit.motherId && !rabbit.fatherId) {
        continue;
      }

      await tx.rabbit.update({
        where: { id: rabbit.id },
        data: {
          motherId: rabbit.motherId,
          fatherId: rabbit.fatherId,
        },
      });
    }
  }

  if (backup.data.weightMeasurements.length > 0) {
    await tx.weightMeasurement.createMany({
      data: backup.data.weightMeasurements.map((measurement) => ({
        id: measurement.id,
        rabbitId: measurement.rabbitId,
        weight: measurement.weight,
        measurementDate: new Date(measurement.measurementDate),
        notes: measurement.notes,
        createdAt: new Date(measurement.createdAt),
        updatedAt: new Date(measurement.updatedAt),
      })),
    });
  }

  if (backup.data.matings.length > 0) {
    await tx.mating.createMany({
      data: backup.data.matings.map((mating) => ({
        id: mating.id,
        buckId: mating.buckId,
        doeId: mating.doeId,
        matingDate: new Date(mating.matingDate),
        expectedKindlingDate: parseDate(mating.expectedKindlingDate),
        successful: mating.successful,
        notes: mating.notes,
        createdAt: new Date(mating.createdAt),
        updatedAt: new Date(mating.updatedAt),
      })),
    });
  }

  if (backup.data.births.length > 0) {
    await tx.birth.createMany({
      data: backup.data.births.map((birth) => ({
        id: birth.id,
        matingId: birth.matingId,
        birthDate: new Date(birth.birthDate),
        totalKits: birth.totalKits,
        aliveKits: birth.aliveKits,
        deadKits: birth.deadKits,
        notes: birth.notes,
        createdAt: new Date(birth.createdAt),
        updatedAt: new Date(birth.updatedAt),
      })),
    });
  }

  if (backup.data.offspringBatches.length > 0) {
    await tx.offspringBatch.createMany({
      data: backup.data.offspringBatches.map((batch) => ({
        id: batch.id,
        batchId: batch.batchId,
        birthId: batch.birthId,
        count: batch.count,
        status: batch.status,
        notes: batch.notes,
        sourceBatchId: null,
        createdAt: new Date(batch.createdAt),
        updatedAt: new Date(batch.updatedAt),
        overallHealthStatus: batch.overallHealthStatus as 'HEALTHY' | 'SICK' | 'INJURED',
        cageId: batch.cageId,
        compartment: batch.compartment,
        maleCount: batch.maleCount,
        femaleCount: batch.femaleCount,
        sexedAt: parseDate(batch.sexedAt),
        availableCount: batch.availableCount,
      })),
    });

    for (const batch of backup.data.offspringBatches) {
      if (!batch.sourceBatchId) {
        continue;
      }

      await tx.offspringBatch.update({
        where: { id: batch.id },
        data: { sourceBatchId: batch.sourceBatchId },
      });
    }
  }

  if (backup.data.offspringBatchHealthHistory.length > 0) {
    await tx.offspringBatchHealthHistory.createMany({
      data: backup.data.offspringBatchHealthHistory.map((entry) => ({
        id: entry.id,
        batchId: entry.batchId,
        status: entry.status as 'HEALTHY' | 'SICK' | 'INJURED',
        notes: entry.notes,
        createdAt: new Date(entry.createdAt),
      })),
    });
  }

  if (backup.data.offspringWeights.length > 0) {
    await tx.offspringWeight.createMany({
      data: backup.data.offspringWeights.map((weight) => ({
        id: weight.id,
        batchId: weight.batchId,
        weight: weight.weight,
        measurementDate: new Date(weight.measurementDate),
        notes: weight.notes,
        createdAt: new Date(weight.createdAt),
        updatedAt: new Date(weight.updatedAt),
      })),
    });
  }

  if (backup.data.offspringDeaths.length > 0) {
    await tx.offspringDeath.createMany({
      data: backup.data.offspringDeaths.map((death) => ({
        id: death.id,
        batchId: death.batchId,
        deathDate: new Date(death.deathDate),
        count: death.count,
        cause: death.cause,
        notes: death.notes,
        createdAt: new Date(death.createdAt),
        updatedAt: new Date(death.updatedAt),
      })),
    });
  }

  if (backup.data.deaths.length > 0) {
    await tx.death.createMany({
      data: backup.data.deaths.map((death) => ({
        id: death.id,
        rabbitId: death.rabbitId,
        deathDate: new Date(death.deathDate),
        cause: death.cause,
        notes: death.notes,
        createdAt: new Date(death.createdAt),
        updatedAt: new Date(death.updatedAt),
      })),
    });
  }

  if (backup.data.sales.length > 0) {
    await tx.sale.createMany({
      data: backup.data.sales.map((sale) => ({
        id: sale.id,
        rabbitId: sale.rabbitId,
        batchId: sale.batchId,
        quantitySold: sale.quantitySold,
        description: sale.description,
        amount: sale.amount,
        saleDate: new Date(sale.saleDate),
        buyerName: sale.buyerName,
        buyerContact: sale.buyerContact,
        notes: sale.notes,
        createdAt: new Date(sale.createdAt),
        updatedAt: new Date(sale.updatedAt),
      })),
    });
  }

  if (backup.data.expenses.length > 0) {
    await tx.expense.createMany({
      data: backup.data.expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        expenseDate: new Date(expense.expenseDate),
        vendor: expense.vendor,
        notes: expense.notes,
        createdAt: new Date(expense.createdAt),
        updatedAt: new Date(expense.updatedAt),
      })),
    });
  }

  if (backup.data.debtors.length > 0) {
    await tx.debtor.createMany({
      data: backup.data.debtors.map((debtor) => ({
        id: debtor.id,
        name: debtor.name,
        contact: debtor.contact,
        amountOwed: debtor.amountOwed,
        description: debtor.description,
        dueDate: parseDate(debtor.dueDate),
        status: debtor.status,
        notes: debtor.notes,
        createdAt: new Date(debtor.createdAt),
        updatedAt: new Date(debtor.updatedAt),
      })),
    });
  }

  if (backup.data.creditors.length > 0) {
    await tx.creditor.createMany({
      data: backup.data.creditors.map((creditor) => ({
        id: creditor.id,
        name: creditor.name,
        contact: creditor.contact,
        amountOwed: creditor.amountOwed,
        description: creditor.description,
        dueDate: parseDate(creditor.dueDate),
        status: creditor.status,
        notes: creditor.notes,
        createdAt: new Date(creditor.createdAt),
        updatedAt: new Date(creditor.updatedAt),
      })),
    });
  }

  if (backup.data.notifications.length > 0) {
    await tx.notification.createMany({
      data: backup.data.notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        read: notification.read,
        userId: notification.userId ? user.id : null,
        relatedId: notification.relatedId,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
      })),
    });
  }

  if (backup.data.notes.length > 0) {
    await tx.note.createMany({
      data: backup.data.notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        type: note.type as 'GENERAL' | 'HEALTH' | 'FINANCE' | 'OTHER',
        subject: note.subject as 'NONE' | 'RABBIT' | 'BATCH',
        rabbitId: note.rabbitId,
        batchId: note.batchId,
        userId: user.id,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      })),
    });
  }

  let restoredWorkerAssignments = 0;
  let skippedWorkerAssignments = 0;

  const workerEmails = backup.data.workerAssignments.map((assignment) => assignment.user.email);
  const existingWorkers = workerEmails.length > 0
    ? await tx.user.findMany({
        where: { email: { in: workerEmails } },
        select: { id: true, email: true, role: true },
      })
    : [];
  const existingWorkersByEmail = new Map(existingWorkers.map((worker) => [worker.email, worker]));

  for (const assignment of backup.data.workerAssignments) {
    const worker = existingWorkersByEmail.get(assignment.user.email);

    if (!worker || worker.role === 'OWNER') {
      skippedWorkerAssignments += 1;
      continue;
    }

    await tx.rabbitryWorker.create({
      data: {
        id: assignment.id,
        rabbitryId: assignment.rabbitryId,
        userId: worker.id,
        role: assignment.role,
        assignedAt: new Date(assignment.assignedAt),
      },
    });
    restoredWorkerAssignments += 1;
  }

  return {
    restoredWorkerAssignments,
    skippedWorkerAssignments,
  };
}

export async function GET() {
  try {
    const auth = await requireOwner();
    if ('error' in auth) {
      return auth.error;
    }

    const backup = await buildBackupPayload(auth.user);
    const dateStamp = new Date().toISOString().slice(0, 10);

    return NextResponse.json(backup, {
      headers: {
        'Content-Disposition': `attachment; filename="smart-rabbit-backup-${dateStamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Error generating backup:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner();
    if ('error' in auth) {
      return auth.error;
    }

    const payload = ensureBackupPayload(await request.json());

    if (payload.profile.email !== auth.user.email) {
      return NextResponse.json(
        { error: 'This backup belongs to a different account and cannot be restored here.' },
        { status: 400 },
      );
    }

    const summary = await prisma.$transaction((tx) => restoreBackup(tx, auth.user, payload));

    return NextResponse.json({
      message: 'Backup restored successfully',
      ...summary,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    const message = error instanceof Error ? error.message : 'Failed to restore backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}