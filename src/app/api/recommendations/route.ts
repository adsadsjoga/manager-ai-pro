import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { summarizeCampaigns } from '@/lib/campaign-metrics'
import {
  buildBudgetForecast,
  buildCampaignRecommendations,
} from '@/lib/recommendation-engine'
import { prisma } from '@/lib/prisma'

function daysWithData(dates: Date[]) {
  return new Set(dates.map((date) => date.toISOString().slice(0, 10))).size
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
  const accountId = searchParams.get('accountId')

  const account = await prisma.adAccount.findFirst({
    where: {
      userId,
      windsorConnected: true,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!account) {
    return NextResponse.json({
      success: true,
      recommendations: [],
      forecast: null,
      account: null,
    })
  }

  const metrics = await prisma.dailyMetric.findMany({
    where: { adAccountId: account.id },
    orderBy: { date: 'asc' },
  })
  const campaigns = summarizeCampaigns(metrics)
  const recommendations = buildCampaignRecommendations(campaigns)
  const forecast = buildBudgetForecast(
    campaigns,
    daysWithData(metrics.map((metric) => metric.date))
  )

  return NextResponse.json({
    success: true,
    recommendations,
    forecast,
    campaigns,
    account: {
      accountId: account.accountId,
      accountName: account.accountName,
      currency: account.currency,
    },
  })
}
