-- DropIndex
DROP INDEX IF EXISTS "Product_status_idx";

-- AlterTable
ALTER TABLE "Product"
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "stockTotal";

-- DropEnum
DROP TYPE IF EXISTS "ProductStatus";
