-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "quantitySold" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OffspringBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
