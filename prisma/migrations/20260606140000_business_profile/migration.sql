CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "adAccountId" TEXT,
    "businessName" TEXT NOT NULL,
    "offer" TEXT,
    "targetAudience" TEXT,
    "country" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "averageTicket" DOUBLE PRECISION,
    "marginPercent" DOUBLE PRECISION,
    "monthlyGoal" DOUBLE PRECISION,
    "mainObjective" TEXT,
    "brandTone" TEXT,
    "websiteUrl" TEXT,
    "notes" TEXT,
    "aiContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessProfile_userId_adAccountId_key" ON "BusinessProfile"("userId", "adAccountId");

ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
