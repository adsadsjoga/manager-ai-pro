import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  DEFAULT_ALERT_RULES,
  evaluateAlertRules,
  persistAlertsWithCooldown,
} from '@/lib/alert-engine'
import { analyzeCampaigns, type CampaignForAnalysis } from '@/lib/campaign-analysis'
import { prisma } from '@/lib/prisma'

type AnalyzeBody = {
  campaigns?: CampaignForAnalysis[]
}

function parseJson(value: string | null) {
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const latestInsight = await prisma.aiInsight.findFirst({
    where: {
      adAccount: {
        userId,
      },
      insightType: 'campaign_analysis',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      severity: true,
      healthScore: true,
      title: true,
      summary: true,
      fullAnalysis: true,
      recommendations: true,
      createdAt: true,
      periodStart: true,
      periodEnd: true,
    },
  })

  return NextResponse.json({
    success: true,
    insight: latestInsight
      ? {
          ...latestInsight,
          analysis: parseJson(latestInsight.fullAnalysis),
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

  try {
    const body = (await req.json()) as AnalyzeBody
    const campaigns = body.campaigns || []

    if (!campaigns.length) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma campanha enviada para analise' },
        { status: 400 }
      )
    }

    const adAccount = await prisma.adAccount.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    if (!adAccount) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma conta de anuncios encontrada' },
        { status: 404 }
      )
    }

    const analysis = analyzeCampaigns(campaigns)
    const alertRules = await prisma.alertRule.findMany({
      where: {
        userId,
        isActive: true,
      },
    })
    const effectiveRules = alertRules.length
      ? alertRules
      : DEFAULT_ALERT_RULES.map((rule) => ({
          ...rule,
          name: rule.name,
          metric: rule.metric,
          operator: rule.operator,
          threshold: rule.threshold,
          severity: rule.severity,
          cooldownHours: rule.cooldownHours,
          notifyEmail: true,
        }))
    const ruleAlerts = evaluateAlertRules(campaigns, effectiveRules)
    const generatedAlerts = [...analysis.generatedAlerts, ...ruleAlerts].filter(
      (alert, index, allAlerts) =>
        allAlerts.findIndex(
          (item) =>
            item.alertType === alert.alertType &&
            item.campaignName === alert.campaignName &&
            item.severity === alert.severity
        ) === index
    )
    const persistedAnalysis = {
      ...analysis,
      generatedAlerts,
    }
    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - 30 * 86400000)

    await prisma.aiInsight.create({
      data: {
        adAccountId: adAccount.id,
        insightType: 'campaign_analysis',
        severity:
          persistedAnalysis.health_score < 50
            ? 'critical'
            : persistedAnalysis.health_score < 70
              ? 'warning'
              : 'info',
        healthScore: persistedAnalysis.health_score,
        title: 'Analise automatica de campanhas',
        summary: persistedAnalysis.summary,
        fullAnalysis: JSON.stringify(persistedAnalysis),
        recommendations: persistedAnalysis.recommendations,
        metricsSnapshot: campaigns,
        periodStart,
        periodEnd,
      },
    })

    const createdAlerts = await persistAlertsWithCooldown(prisma, {
      adAccountId: adAccount.id,
      alerts: generatedAlerts,
      rules: effectiveRules,
    })

    return NextResponse.json({
      success: true,
      analysis: persistedAnalysis,
      alertsCreated: createdAlerts.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
