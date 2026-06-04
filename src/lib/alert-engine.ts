import type { AlertRule } from '@prisma/client'
import type { CampaignForAnalysis, GeneratedAlert } from '@/lib/campaign-analysis'

export type DefaultAlertRule = {
  name: string
  metric: string
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq'
  threshold: number
  timeWindow: number
  severity: 'critical' | 'warning' | 'opportunity' | 'info'
  cooldownHours: number
}

export const DEFAULT_ALERT_RULES: DefaultAlertRule[] = [
  {
    name: 'CTR muito baixo',
    metric: 'ctr',
    operator: 'lt',
    threshold: 2,
    timeWindow: 1,
    severity: 'critical',
    cooldownHours: 4,
  },
  {
    name: 'CPC alto',
    metric: 'cpc',
    operator: 'gt',
    threshold: 0.3,
    timeWindow: 1,
    severity: 'warning',
    cooldownHours: 4,
  },
  {
    name: 'CPM alto',
    metric: 'cpm',
    operator: 'gt',
    threshold: 12,
    timeWindow: 1,
    severity: 'warning',
    cooldownHours: 4,
  },
  {
    name: 'Gasto sem compra',
    metric: 'spend_without_purchase',
    operator: 'gt',
    threshold: 10,
    timeWindow: 1,
    severity: 'critical',
    cooldownHours: 4,
  },
  {
    name: 'Saude critica',
    metric: 'health',
    operator: 'lt',
    threshold: 50,
    timeWindow: 1,
    severity: 'critical',
    cooldownHours: 6,
  },
  {
    name: 'Fadiga de criativo',
    metric: 'creative_fatigue',
    operator: 'gt',
    threshold: 3.5,
    timeWindow: 3,
    severity: 'warning',
    cooldownHours: 8,
  },
  {
    name: 'Oportunidade de escala',
    metric: 'scale_opportunity',
    operator: 'gte',
    threshold: 75,
    timeWindow: 1,
    severity: 'opportunity',
    cooldownHours: 12,
  },
  {
    name: 'ROAS baixo',
    metric: 'roas',
    operator: 'lt',
    threshold: 1,
    timeWindow: 1,
    severity: 'warning',
    cooldownHours: 6,
  },
  {
    name: 'Conversao baixa',
    metric: 'conversion_rate',
    operator: 'lt',
    threshold: 1,
    timeWindow: 1,
    severity: 'warning',
    cooldownHours: 6,
  },
  {
    name: 'Bom CTR',
    metric: 'ctr_opportunity',
    operator: 'gte',
    threshold: 4,
    timeWindow: 1,
    severity: 'opportunity',
    cooldownHours: 12,
  },
  {
    name: 'Compras validadas',
    metric: 'purchases',
    operator: 'gte',
    threshold: 2,
    timeWindow: 1,
    severity: 'opportunity',
    cooldownHours: 12,
  },
  {
    name: 'Sem entrega',
    metric: 'impressions',
    operator: 'lt',
    threshold: 100,
    timeWindow: 1,
    severity: 'info',
    cooldownHours: 12,
  },
]

type RuleLike = Pick<
  AlertRule,
  'name' | 'metric' | 'operator' | 'threshold' | 'severity' | 'cooldownHours'
>

function compare(value: number, operator: string | null, threshold: number) {
  if (operator === 'lt') return value < threshold
  if (operator === 'lte') return value <= threshold
  if (operator === 'gt') return value > threshold
  if (operator === 'gte') return value >= threshold
  if (operator === 'eq') return value === threshold
  return false
}

function metricValue(campaign: CampaignForAnalysis, metric: string | null) {
  if (metric === 'ctr') return campaign.ctr
  if (metric === 'cpc') return campaign.cpc
  if (metric === 'cpm') return campaign.cpm
  if (metric === 'health') return campaign.health
  if (metric === 'roas') return campaign.roas
  if (metric === 'conversion_rate') {
    return campaign.clicks > 0 ? ((campaign.purchases || 0) / campaign.clicks) * 100 : 0
  }
  if (metric === 'ctr_opportunity') return campaign.ctr
  if (metric === 'purchases') return campaign.purchases || 0
  if (metric === 'impressions') return campaign.impressions
  if (metric === 'spend_without_purchase') {
    return (campaign.purchases || 0) === 0 ? campaign.spend : 0
  }
  if (metric === 'creative_fatigue') {
    return campaign.ctr < 3 ? campaign.frequency || 0 : 0
  }

  return 0
}

function alertMessage(rule: RuleLike, campaign: CampaignForAnalysis, value: number) {
  const metric = rule.metric || 'metric'
  const threshold = rule.threshold || 0

  if (metric === 'spend_without_purchase') {
    return `A campanha gastou EUR ${campaign.spend.toFixed(2)} sem compras no periodo.`
  }
  if (metric === 'creative_fatigue') {
    return `A frequencia chegou a ${value.toFixed(2)}x com CTR abaixo de 3%.`
  }
  if (metric === 'scale_opportunity') {
    return `A campanha esta com score ${campaign.health}/100 e pode ser avaliada para escala.`
  }

  return `${metric} atual: ${value.toFixed(2)}. Limite configurado: ${threshold}.`
}

export function evaluateAlertRules(
  campaigns: CampaignForAnalysis[],
  rules: RuleLike[]
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = []

  for (const campaign of campaigns) {
    for (const rule of rules) {
      if (!rule.metric || rule.threshold === null) continue

      const value = metricValue(campaign, rule.metric)

      if (!compare(value, rule.operator, rule.threshold)) continue

      alerts.push({
        alertType: rule.metric,
        severity: (rule.severity || 'warning') as GeneratedAlert['severity'],
        title: rule.name || `Alerta: ${rule.metric}`,
        message: alertMessage(rule, campaign, value),
        campaignName: campaign.name,
        metrics: {
          metric: rule.metric,
          value,
          threshold: rule.threshold,
        },
      })
    }
  }

  return alerts
}
