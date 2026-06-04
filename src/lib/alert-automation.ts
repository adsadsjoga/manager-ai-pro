import { analyzeCampaigns } from '@/lib/campaign-analysis'
import { summarizeCampaigns } from '@/lib/campaign-metrics'
import {
  DEFAULT_ALERT_RULES,
  evaluateAlertRules,
  persistAlertsWithCooldown,
} from '@/lib/alert-engine'
import { prisma } from '@/lib/prisma'

function daysAgo(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

export async function runAlertAutomationForAccount(params: {
  userId: string
  adAccountId: string
  lookbackDays?: number
}) {
  const lookbackDays = params.lookbackDays || 7
  const periodStart = daysAgo(lookbackDays)
  const periodEnd = new Date()

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      adAccountId: params.adAccountId,
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  })

  const campaigns = summarizeCampaigns(metrics)

  if (!campaigns.length) {
    return {
      campaigns: 0,
      alertsCreated: 0,
      insightCreated: false,
    }
  }

  const configuredRules = await prisma.alertRule.findMany({
    where: {
      userId: params.userId,
      isActive: true,
    },
  })

  const effectiveRules = configuredRules.length
    ? configuredRules
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

  const analysis = analyzeCampaigns(campaigns)
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

  await prisma.aiInsight.create({
    data: {
      adAccountId: params.adAccountId,
      insightType: 'alert_automation',
      severity:
        persistedAnalysis.health_score < 50
          ? 'critical'
          : persistedAnalysis.health_score < 70
            ? 'warning'
            : 'info',
      healthScore: persistedAnalysis.health_score,
      title: 'Monitoramento automatico de alertas',
      summary: persistedAnalysis.summary,
      fullAnalysis: JSON.stringify(persistedAnalysis),
      recommendations: persistedAnalysis.recommendations,
      metricsSnapshot: campaigns,
      periodStart,
      periodEnd,
    },
  })

  const createdAlerts = await persistAlertsWithCooldown(prisma, {
    adAccountId: params.adAccountId,
    alerts: generatedAlerts,
    rules: effectiveRules,
  })

  return {
    campaigns: campaigns.length,
    alertsCreated: createdAlerts.length,
    insightCreated: true,
  }
}
