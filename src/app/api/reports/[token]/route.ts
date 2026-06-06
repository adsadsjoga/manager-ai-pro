import { NextResponse } from 'next/server'
import { buildReportHtml } from '@/lib/report-generator'
import { prisma } from '@/lib/prisma'

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function metricAccountId(rawData: unknown) {
  if (!rawData || typeof rawData !== 'object') return ''

  const accountId = (rawData as { account_id?: unknown }).account_id
  return String(accountId || '').trim()
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  const report = await prisma.report.findUnique({
    where: { shareToken: token },
    include: {
      adAccount: true,
    },
  })

  if (!report || !report.adAccount || !report.periodStart || !report.periodEnd) {
    return NextResponse.json(
      { success: false, error: 'Relatorio nao encontrado' },
      { status: 404 }
    )
  }

  if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Link expirado' },
      { status: 410 }
    )
  }

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      adAccountId: report.adAccountId || '',
      date: {
        gte: report.periodStart,
        lt: addDays(report.periodEnd, 1),
      },
    },
  })

  const latestInsight = await prisma.aiInsight.findFirst({
    where: {
      adAccountId: report.adAccountId || '',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const businessProfile = await prisma.businessProfile.findFirst({
    where: {
      userId: report.userId,
      adAccountId: report.adAccountId || undefined,
    },
  })

  const scopedMetrics = metrics.filter(
    (item) => metricAccountId(item.rawData) === report.adAccount?.accountId
  )

  const html = buildReportHtml({
    accountName: report.adAccount.accountName || 'Conta de anuncios',
    currency: report.adAccount.currency,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    metrics: scopedMetrics,
    latestInsight,
    businessProfile,
    template: report.format,
  })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
