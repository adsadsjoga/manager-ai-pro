import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CampaignSummary = {
  name: string
  spend: number
  revenue: number
  leads: number
  purchases: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  frequency: number
  conversionRate: number
  health: number
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
      { success: false, error: 'Usuário não autenticado' },
      { status: 401 }
    )
  }

  const adAccounts = await prisma.adAccount.findMany({
    where: { userId },
    select: { id: true, currency: true },
  })

  const adAccountIds = adAccounts.map((account) => account.id)
  const currency = adAccounts[0]?.currency || 'EUR'
  const { searchParams } = new URL(req.url)
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

  const campaignsMap = new Map<string, CampaignSummary>()

  for (const item of filteredMetrics) {
    const key = item.campaignName || item.adName || 'Sem campanha'

    if (!campaignsMap.has(key)) {
      campaignsMap.set(key, {
        name: key,
        spend: 0,
        revenue: 0,
        leads: 0,
        purchases: 0,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
        frequency: 0,
        conversionRate: 0,
        health: 50,
      })
    }

    const campaign = campaignsMap.get(key)
    if (!campaign) continue

    campaign.spend += item.spend
    campaign.revenue += item.revenue
    campaign.leads += item.leads
    campaign.purchases += item.purchases
    campaign.clicks += item.clicks
    campaign.impressions += item.impressions
    campaign.frequency += item.frequency
  }

  const campaigns = Array.from(campaignsMap.values()).map((campaign) => {
    campaign.ctr =
      campaign.impressions > 0
        ? (campaign.clicks / campaign.impressions) * 100
        : 0

    campaign.cpc =
      campaign.clicks > 0
        ? campaign.spend / campaign.clicks
        : 0

    campaign.cpm =
      campaign.impressions > 0
        ? (campaign.spend / campaign.impressions) * 1000
        : 0

    campaign.roas =
      campaign.spend > 0
        ? campaign.revenue / campaign.spend
        : 0

    campaign.conversionRate =
      campaign.clicks > 0
        ? (campaign.purchases / campaign.clicks) * 100
        : 0

    campaign.health =
      campaign.purchases >= 10 ? 90 :
      campaign.purchases >= 3 && campaign.cpc <= 0.2 ? 85 :
      campaign.ctr >= 5 && campaign.cpc <= 0.15 ? 80 :
      campaign.ctr >= 4 && campaign.cpc <= 0.25 ? 75 :
      campaign.ctr >= 2 ? 60 :
      campaign.clicks > 0 ? 45 :
      30

    return campaign
  })

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
