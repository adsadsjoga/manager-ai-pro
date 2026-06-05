CREATE TABLE "MetaAd" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "metaAdId" TEXT NOT NULL,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "adsetId" TEXT,
    "adsetName" TEXT,
    "adName" TEXT,
    "status" TEXT,
    "effectiveStatus" TEXT,
    "creativeId" TEXT,
    "creativeName" TEXT,
    "primaryText" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "callToAction" TEXT,
    "imageUrl" TEXT,
    "videoId" TEXT,
    "permalinkUrl" TEXT,
    "thumbnailUrl" TEXT,
    "videoMetrics" JSONB,
    "rawData" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAd_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MetaAd_adAccountId_metaAdId_key" ON "MetaAd"("adAccountId", "metaAdId");

ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
