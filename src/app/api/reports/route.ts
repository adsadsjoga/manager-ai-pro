import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createShareToken } from '@/lib/report-generator'
import { prisma } from '@/lib/prisma'

type ReportBody = {
  reportType?: string
  dateFrom?: string
  dateTo?: string
  accountId?: string
}

function parseDate(value: string | undefined) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

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

  const adAccount = accountId
    ? await prisma.adAccount.findFirst({
        where: { userId, accountId },
        select: { id: true },
      })
    : null

  const reports = await prisma.report.findMany({
    where: {
      userId,
      ...(accountId ? { adAccountId: adAccount?.id || '__none__' } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      adAccount: {
        select: {
          accountId: true,
          accountName: true,
        },
      },
    },
  })

  return NextResponse.json({
    success: true,
    reports,
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as ReportBody
  const periodStart = parseDate(body.dateFrom)
  const periodEnd = parseDate(body.dateTo)

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { success: false, error: 'Periodo invalido' },
      { status: 400 }
    )
  }

  const adAccount = await prisma.adAccount.findFirst({
    where: {
      userId,
      ...(body.accountId ? { accountId: body.accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!adAccount) {
    return NextResponse.json(
      { success: false, error: 'Nenhuma conta de anuncios encontrada' },
      { status: 404 }
    )
  }

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      adAccountId: adAccount.id,
      date: {
        gte: periodStart,
        lt: addDays(periodEnd, 1),
      },
    },
    select: {
      rawData: true,
    },
  })
  const metricsCount = metrics.filter(
    (metric) => metricAccountId(metric.rawData) === adAccount.accountId
  ).length

  if (metricsCount === 0) {
    return NextResponse.json(
      { success: false, error: 'Sem dados para este periodo' },
      { status: 400 }
    )
  }

  const type = body.reportType || 'custom'
  const report = await prisma.report.create({
    data: {
      userId,
      adAccountId: adAccount.id,
      name: `Relatorio ${type} - ${periodStart.toISOString().slice(0, 10)} a ${periodEnd
        .toISOString()
        .slice(0, 10)}`,
      reportType: type,
      format: 'html-pdf',
      periodStart,
      periodEnd,
      status: 'ready',
      shareToken: createShareToken(),
      shareExpiresAt: addDays(new Date(), 30),
      generatedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    report,
  })
}
