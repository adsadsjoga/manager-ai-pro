ALTER TABLE "AdAccount" ALTER COLUMN "currency" SET DEFAULT 'EUR';
UPDATE "AdAccount" SET "currency" = 'EUR' WHERE "currency" = 'BRL';
