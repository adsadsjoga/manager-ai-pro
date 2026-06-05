import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { summarizeCampaigns } from '@/lib/campaign-metrics'
import { resolveFacebookAccountName } from '@/lib/facebook-accounts'
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

function metricAccountId(rawData: unknown) {
  if (!rawData || typeof rawData !== 'object') return ''

  const accountId = (rawData as { account_id?: unknown }).account_id
  return String(accountId || '').trim()
}

function belongsToSelectedAccount(
  rawData: unknown,
  selectedAccountId: string | null | undefined
) {
  if (!selectedAccountId) return true

  const rawAccountId = metricAccountId(rawData)
  return rawAccountId === selectedAccountId
}

function metricSource(rawData: unknown) {
  if (!rawData || typeof rawData !== 'object') return 'unknown'

  return String((rawData as { source?: unknown }).source || 'windsor')
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario nao autenticado' },
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
    const selectedAccountName = selectedAccount
      ? resolveFacebookAccountName(
          selectedAccount.accountId,
          selectedAccount.accountName,
          selectedAccount.accountName
        )
      : null
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

    const accountScopedMetrics = metrics.filter((item) =>
      belongsToSelectedAccount(item.rawData, selectedAccount?.accountId)
    )
    const filteredMetrics = accountScopedMetrics.filter(
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

    const campaigns = summarizeCampaigns(accountScopedMetrics)
    const realSales = selectedAccount
      ? await prisma.realSale.findMany({
          where: {
            userId,
            adAccountId: selectedAccount.id,
            status: 'paid',
            ...(dateFrom || dateTo
              ? {
                  paidAt: {
                    ...(dateFrom ? { gte: dateFrom } : {}),
                    ...(dateTo ? { lt: addDays(dateTo, 1) } : {}),
                  },
                }
              : {}),
          },
          orderBy: { paidAt: 'desc' },
        })
      : []
    const realSalesTotals = realSales.reduce(
      (acc, sale) => {
        acc.sales += 1
        acc.revenue += sale.amount
        return acc
      },
      { sales: 0, revenue: 0 }
    )
    const dataSource = accountScopedMetrics.some(
      (item) => metricSource(item.rawData) === 'meta'
    )
      ? 'meta'
      : 'windsor'

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
        dataSource,
        financialSource: realSales.length > 0 ? 'real_sales' : dataSource,
        accountId: selectedAccount?.accountId || null,
        accountName: selectedAccountName,
        accounts: adAccounts.map((account) => ({
          accountId: account.accountId,
          accountName: resolveFacebookAccountName(
            account.accountId,
            account.accountName,
            account.accountName
          ),
          currency: account.currency,
        })),
      },
      metrics: {
        spend: totals.spend,
        revenue: realSales.length > 0 ? realSalesTotals.revenue : totals.revenue,
        metaRevenue: totals.revenue,
        realRevenue: realSalesTotals.revenue,
        roas:
          totals.spend > 0
            ? (realSales.length > 0 ? realSalesTotals.revenue : totals.revenue) /
              totals.spend
            : 0,
        leads: totals.leads,
        purchases: realSales.length > 0 ? realSalesTotals.sales : totals.purchases,
        metaPurchases: totals.purchases,
        realSales: realSalesTotals.sales,
        clicks: totals.clicks,
        impressions: totals.impressions,
        conversionRate:
          totals.clicks > 0
            ? ((realSales.length > 0 ? realSalesTotals.sales : totals.purchases) /
                totals.clicks) *
              100
            : 0,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      },
      campaigns,
      purchaseBreakdown,
      realSales: realSales.map((sale) => ({
        id: sale.id,
        provider: sale.provider,
        status: sale.status,
        amount: sale.amount,
        currency: sale.currency,
        customerEmail: sale.customerEmail,
        productName: sale.productName,
        campaignName: sale.campaignName,
        paidAt: sale.paidAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Dashboard API error', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao carregar dashboard',
      },
      { status: 500 }
    )
  }
}
