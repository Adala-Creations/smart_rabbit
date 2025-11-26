-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'WORKER');

-- CreateEnum
CREATE TYPE "CageType" AS ENUM ('BREEDING', 'WEANER');

-- CreateEnum
CREATE TYPE "RabbitGender" AS ENUM ('BUCK', 'DOE');

-- CreateEnum
CREATE TYPE "RabbitStatus" AS ENUM ('ACTIVE', 'SOLD', 'DECEASED', 'WEANED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'SICK', 'INJURED');

-- CreateEnum
CREATE TYPE "OffspringHealthStatus" AS ENUM ('HEALTHY', 'SICK', 'INJURED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'EXPENSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rabbitry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "locationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rabbitry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RabbitryWorker" (
    "id" TEXT NOT NULL,
    "rabbitryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RabbitryWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cage" (
    "id" TEXT NOT NULL,
    "cageId" TEXT NOT NULL,
    "type" "CageType" NOT NULL,
    "rabbitryId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "compartments" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rabbit" (
    "id" TEXT NOT NULL,
    "rabbitId" TEXT NOT NULL,
    "name" TEXT,
    "gender" "RabbitGender" NOT NULL,
    "breed" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "cageId" TEXT NOT NULL,
    "status" "RabbitStatus" NOT NULL DEFAULT 'ACTIVE',
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "healthDescription" TEXT,
    "color" TEXT,
    "motherId" TEXT,
    "fatherId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "compartment" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Rabbit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mating" (
    "id" TEXT NOT NULL,
    "buckId" TEXT NOT NULL,
    "doeId" TEXT NOT NULL,
    "matingDate" TIMESTAMP(3) NOT NULL,
    "expectedKindlingDate" TIMESTAMP(3),
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Birth" (
    "id" TEXT NOT NULL,
    "matingId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "totalKits" INTEGER NOT NULL,
    "aliveKits" INTEGER NOT NULL,
    "deadKits" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Birth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffspringBatch" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "birthId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "sourceBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overallHealthStatus" "OffspringHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "cageId" TEXT,
    "compartment" INTEGER DEFAULT 1,
    "maleCount" INTEGER,
    "femaleCount" INTEGER,
    "sexedAt" TIMESTAMPTZ(6),

    CONSTRAINT "OffspringBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffspringBatchHealthHistory" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "OffspringHealthStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffspringBatchHealthHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffspringDeath" (
    "id" TEXT NOT NULL,
    "birthId" TEXT NOT NULL,
    "deathDate" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "cause" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffspringDeath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Death" (
    "id" TEXT NOT NULL,
    "rabbitId" TEXT NOT NULL,
    "deathDate" TIMESTAMP(3) NOT NULL,
    "cause" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Death_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightMeasurement" (
    "id" TEXT NOT NULL,
    "rabbitId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffspringWeight" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffspringWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "rabbitId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "buyerName" TEXT,
    "buyerContact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "RabbitryWorker_rabbitryId_userId_key" ON "RabbitryWorker"("rabbitryId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cage_cageId_key" ON "Cage"("cageId");

-- CreateIndex
CREATE UNIQUE INDEX "Rabbit_rabbitId_key" ON "Rabbit"("rabbitId");

-- CreateIndex
CREATE UNIQUE INDEX "OffspringBatch_batchId_key" ON "OffspringBatch"("batchId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbitry" ADD CONSTRAINT "Rabbitry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbitry" ADD CONSTRAINT "Rabbitry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabbitryWorker" ADD CONSTRAINT "RabbitryWorker_rabbitryId_fkey" FOREIGN KEY ("rabbitryId") REFERENCES "Rabbitry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RabbitryWorker" ADD CONSTRAINT "RabbitryWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cage" ADD CONSTRAINT "Cage_rabbitryId_fkey" FOREIGN KEY ("rabbitryId") REFERENCES "Rabbitry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbit" ADD CONSTRAINT "Rabbit_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES "Cage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbit" ADD CONSTRAINT "Rabbit_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Rabbit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbit" ADD CONSTRAINT "Rabbit_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Rabbit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mating" ADD CONSTRAINT "Mating_buckId_fkey" FOREIGN KEY ("buckId") REFERENCES "Rabbit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mating" ADD CONSTRAINT "Mating_doeId_fkey" FOREIGN KEY ("doeId") REFERENCES "Rabbit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Birth" ADD CONSTRAINT "Birth_matingId_fkey" FOREIGN KEY ("matingId") REFERENCES "Mating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffspringBatch" ADD CONSTRAINT "OffspringBatch_birthId_fkey" FOREIGN KEY ("birthId") REFERENCES "Birth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffspringBatch" ADD CONSTRAINT "fk_cage" FOREIGN KEY ("cageId") REFERENCES "Cage"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OffspringBatchHealthHistory" ADD CONSTRAINT "OffspringBatchHealthHistory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OffspringBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffspringDeath" ADD CONSTRAINT "OffspringDeath_birthId_fkey" FOREIGN KEY ("birthId") REFERENCES "Birth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Death" ADD CONSTRAINT "Death_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES "Rabbit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightMeasurement" ADD CONSTRAINT "WeightMeasurement_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES "Rabbit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffspringWeight" ADD CONSTRAINT "OffspringWeight_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OffspringBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES "Rabbit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
