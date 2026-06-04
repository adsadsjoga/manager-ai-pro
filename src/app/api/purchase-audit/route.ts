import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WEBSITE_PURCHASE_ACTION_TYPE } from '@/services/windsor-service'

type PurchaseAuditRawData = {
  purchaseSource?: string
  purchaseActionAudit?: Array<{
    actionType: string
    value: number
  }>
}

function parseDateParam(value: string | null) {
  if (!value) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const dateFrom = parseDateParam(searchParams.get('dateFrom'))
  const dateTo = parseDateParam(searchParams.get('dateTo'))

  const rows = await prisma.dailyMetric.findMany({
    where: {
      adAccount: {
        userId,
      },
      purchases: {
        gt: 0,
      },
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lt: addDays(dateTo, 1) } : {}),
            },
          }
        : {}),
    },
    orderBy: [
      {
        date: 'asc',
      },
      {
        campaignName: 'asc',
      },
    ],
    select: {
      date: true,
      campaignName: true,
      purchases: true,
      revenue: true,
      rawData: true,
    },
  })

  const breakdown = rows.map((row) => {
    const rawData = row.rawData as PurchaseAuditRawData | null

    return {
      date: row.date.toISOString().slice(0, 10),
      campaignName: row.campaignName,
      websitePurchases: row.purchases,
      revenue: row.revenue,
      purchaseSource: rawData?.purchaseSource || WEBSITE_PURCHASE_ACTION_TYPE,
      purchaseActionAudit: rawData?.purchaseActionAudit || [],
    }
  })

  return NextResponse.json({
    success: true,
    purchaseSource: WEBSITE_PURCHASE_ACTION_TYPE,
    period: {
      dateFrom: dateFrom?.toISOString().slice(0, 10) || null,
      dateTo: dateTo?.toISOString().slice(0, 10) || null,
    },
    totalWebsitePurchases: breakdown.reduce(
      (total, row) => total + row.websitePurchases,
      0
    ),
    breakdown,
  })
}
