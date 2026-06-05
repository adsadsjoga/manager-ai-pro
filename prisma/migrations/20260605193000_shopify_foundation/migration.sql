CREATE TABLE "ShopifyStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adAccountId" TEXT,
    "shopDomain" TEXT NOT NULL,
    "storeName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accessTokenEnc" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'not_connected',
    "syncError" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyStore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopifyProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adAccountId" TEXT,
    "shopifyStoreId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "status" TEXT,
    "productType" TEXT,
    "vendor" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "inventoryQty" INTEGER,
    "rawData" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShopifyOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adAccountId" TEXT,
    "shopifyStoreId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "orderName" TEXT,
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "customerEmail" TEXT,
    "customerName" TEXT,
    "productSummary" TEXT,
    "sourceName" TEXT,
    "landingSite" TEXT,
    "referringSite" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyStore_userId_shopDomain_key" ON "ShopifyStore"("userId", "shopDomain");
CREATE UNIQUE INDEX "ShopifyProduct_shopifyStoreId_shopifyProductId_key" ON "ShopifyProduct"("shopifyStoreId", "shopifyProductId");
CREATE UNIQUE INDEX "ShopifyOrder_shopifyStoreId_shopifyOrderId_key" ON "ShopifyOrder"("shopifyStoreId", "shopifyOrderId");

ALTER TABLE "ShopifyStore" ADD CONSTRAINT "ShopifyStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyStore" ADD CONSTRAINT "ShopifyStore_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "ShopifyStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "ShopifyStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
