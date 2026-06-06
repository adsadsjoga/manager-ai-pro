import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { buildAccountDiagnosis } from '@/lib/diagnosis-engine'
import { prisma } from '@/lib/prisma'

type DiagnosisBody = {
  accountId?: string
}

async function getAccount(userId: string, accountId?: string | null) {
  return prisma.adAccount.findFirst({
    where: {
      userId,
      windsorConnected: true,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })
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
  const account = await getAccount(userId, searchParams.get('accountId'))

  if (!account) {
    return NextResponse.json({ success: true, diagnosis: null })
  }

  const latestInsight = await prisma.aiInsight.findFirst({
    where: {
      adAccountId: account.id,
      insightType: 'account_diagnosis',
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    diagnosis: latestInsight
      ? {
          id: latestInsight.id,
          createdAt: latestInsight.createdAt,
          analysis: latestInsight.fullAnalysis
            ? JSON.parse(latestInsight.fullAnalysis)
            : null,
        }
      : null,
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

  const body = (await req.json()) as DiagnosisBody
  const account = await getAccount(userId, body.accountId)

  if (!account) {
    return NextResponse.json(
      { success: false, error: 'Conta de anuncio nao encontrada' },
      { status: 404 }
    )
  }

  const metrics = await prisma.dailyMetric.findMany({
    where: { adAccountId: account.id },
    orderBy: { date: 'desc' },
  })
  const creatives = await prisma.metaAd.findMany({
    where: { adAccountId: account.id },
    orderBy: { updatedAt: 'desc' },
  })
  const businessProfile = await prisma.businessProfile.findFirst({
    where: {
      userId,
      adAccountId: account.id,
    },
  })

  const diagnosis = buildAccountDiagnosis({ metrics, creatives, businessProfile })
  const periodEnd = new Date()
  const periodStart = new Date(periodEnd.getTime() - 30 * 86400000)

  const insight = await prisma.aiInsight.create({
    data: {
      adAccountId: account.id,
      insightType: 'account_diagnosis',
      severity:
        diagnosis.healthScore < 50
          ? 'critical'
          : diagnosis.healthScore < 70
            ? 'warning'
            : 'info',
      healthScore: diagnosis.healthScore,
      title: 'Diagnostico IA da conta',
      summary: diagnosis.summary,
      fullAnalysis: JSON.stringify(diagnosis),
      recommendations: diagnosis.actions,
      metricsSnapshot: {
        campaigns: diagnosis.campaignDiagnosis,
        creatives: diagnosis.creativeDiagnosis,
      },
      periodStart,
      periodEnd,
    },
  })

  return NextResponse.json({
    success: true,
    diagnosis,
    insightId: insight.id,
  })
}
