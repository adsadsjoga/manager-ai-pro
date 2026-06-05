CREATE TABLE "RealSale" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "adAccountId" TEXT,
  "clientId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "externalId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'paid',
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "customerEmail" TEXT,
  "customerName" TEXT,
  "productName" TEXT,
  "campaignName" TEXT,
  "source" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RealSale_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RealSale_provider_externalId_key" ON "RealSale"("provider", "externalId");

ALTER TABLE "RealSale" ADD CONSTRAINT "RealSale_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RealSale" ADD CONSTRAINT "RealSale_adAccountId_fkey"
  FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RealSale" ADD CONSTRAINT "RealSale_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
