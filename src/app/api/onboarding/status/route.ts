import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const [
    connectedAccounts,
    syncedAccounts,
    realSales,
    shopifyStores,
    shopifyProducts,
    shopifyOrders,
    metaAds,
    clients,
    reports,
    businessProfiles,
  ] = await Promise.all([
    prisma.adAccount.count({ where: { userId, windsorConnected: true } }),
    prisma.adAccount.count({ where: { userId, syncStatus: 'success' } }),
    prisma.realSale.count({ where: { userId, status: 'paid' } }),
    prisma.shopifyStore.count({
      where: { userId, syncStatus: { not: 'disconnected' } },
    }),
    prisma.shopifyProduct.count({ where: { userId } }),
    prisma.shopifyOrder.count({ where: { userId } }),
    prisma.metaAd.count({
      where: {
        adAccount: {
          userId,
        },
      },
    }),
    prisma.client.count({ where: { userId, isActive: true } }),
    prisma.report.count({ where: { userId } }),
    prisma.businessProfile.count({ where: { userId } }),
  ])

  const checks = {
    database: true,
    adAccount: connectedAccounts > 0,
    syncedMetrics: syncedAccounts > 0,
    realSales: realSales > 0,
    shopify: shopifyStores > 0,
    shopifySynced: shopifyProducts > 0 || shopifyOrders > 0,
    metaCreatives: metaAds > 0,
    clients: clients > 0,
    businessProfile: businessProfiles > 0,
    reports: reports > 0,
    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    metaConfigured: Boolean(process.env.META_ACCESS_TOKEN),
  }

  const completed = Object.values(checks).filter(Boolean).length
  const total = Object.values(checks).length

  return NextResponse.json({
    success: true,
    completed,
    total,
    progress: Math.round((completed / total) * 100),
    checks,
    counts: {
      connectedAccounts,
      syncedAccounts,
      realSales,
      shopifyStores,
      shopifyProducts,
      shopifyOrders,
      metaAds,
      clients,
      reports,
      businessProfiles,
    },
  })
}
