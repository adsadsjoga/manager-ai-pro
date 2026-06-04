import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { summarizeCampaigns } from '@/lib/campaign-metrics'
import { prisma } from '@/lib/prisma'

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
      { success: false, error: 'Usuário não autenticado' },
      { status: 401 }
    )
  }

  const adAccounts = await prisma.adAccount.findMany({
    where: { userId, windsorConnected: true },
    select: { id: true, accountId: true, accountName: true, currency: true },
    orderBy: { updatedAt: 'desc' },
  })

  const { searchParams } = new URL(req.url)
  const selectedAccountId = searchParams.get('accountId')
  const selectedAccount =
    adAccounts.find((account) => account.accountId === selectedAccountId) ||
    adAccounts[0] ||
    null
  const adAccountIds = selectedAccount ? [selectedAccount.id] : []
  const currency = selectedAccount?.currency || 'EUR'
  const dateFrom = parseDateParam(searchParams.get('dateFrom'))
  const dateTo = parseDateParam(searchParams.get('dateTo'))

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      adAccountId: {
        in: adAccountIds,
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
    orderBy: {
      date: 'desc',
    },
  })

  const filteredMetrics = metrics.filter(
    (item) => item.campaignName || item.adName
  )

  const totals = filteredMetrics.reduce(
    (acc, item) => {
      acc.spend += item.spend
      acc.revenue += item.revenue
      acc.leads += item.leads
      acc.purchases += item.purchases
      acc.clicks += item.clicks
      acc.impressions += item.impressions
      return acc
    },
    {
      spend: 0,
      revenue: 0,
      leads: 0,
      purchases: 0,
      clicks: 0,
      impressions: 0,
    }
  )

  const campaigns = summarizeCampaigns(metrics)

  const purchaseBreakdown = filteredMetrics
    .filter((item) => item.purchases > 0)
    .map((item) => ({
      date: item.date.toISOString().slice(0, 10),
      campaignName: item.campaignName || item.adName || 'Sem campanha',
      purchases: item.purchases,
      revenue: item.revenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    success: true,
    period: {
      dateFrom: dateFrom?.toISOString().slice(0, 10) || null,
      dateTo: dateTo?.toISOString().slice(0, 10) || null,
    },
    account: {
      currency,
      accountId: selectedAccount?.accountId || null,
      accountName: selectedAccount?.accountName || null,
      accounts: adAccounts.map((account) => ({
        accountId: account.accountId,
        accountName: account.accountName,
        currency: account.currency,
      })),
    },
    metrics: {
      spend: totals.spend,
      revenue: totals.revenue,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      leads: totals.leads,
      purchases: totals.purchases,
      clicks: totals.clicks,
      impressions: totals.impressions,
      conversionRate:
        totals.clicks > 0
          ? (totals.purchases / totals.clicks) * 100
          : 0,
      ctr:
        totals.impressions > 0
          ? (totals.clicks / totals.impressions) * 100
          : 0,
      cpc:
        totals.clicks > 0
          ? totals.spend / totals.clicks
          : 0,
      cpm:
        totals.impressions > 0
          ? (totals.spend / totals.impressions) * 1000
          : 0,
    },
    campaigns,
    purchaseBreakdown,
  })
}
