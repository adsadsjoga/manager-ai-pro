import type { CampaignSummary } from '@/lib/campaign-metrics'

export type CampaignRecommendation = {
  campaign: string
  priority: 'high' | 'medium' | 'low'
  action: 'pause' | 'reduce' | 'test_creative' | 'scale' | 'monitor'
  title: string
  reason: string
  suggestedBudgetChangePct: number
}

export type BudgetForecast = {
  currentSpend: number
  projectedMonthlySpend: number
  suggestedMonthlyBudget: number
  expectedClicks: number
  expectedPurchases: number
  note: string
}

function recommendationForCampaign(campaign: CampaignSummary): CampaignRecommendation {
  if (campaign.spend >= 10 && campaign.clicks === 0) {
    return {
      campaign: campaign.name,
      priority: 'high',
      action: 'pause',
      title: 'Pausar ou revisar entrega',
      reason: 'A campanha gastou sem gerar cliques. Verifique publico, criativo e aprovacao.',
      suggestedBudgetChangePct: -100,
    }
  }

  if (campaign.clicks >= 30 && campaign.ctr < 2) {
    return {
      campaign: campaign.name,
      priority: 'high',
      action: 'test_creative',
      title: 'Trocar criativo/copy',
      reason: `CTR ${campaign.ctr.toFixed(2)}% indica baixa atratividade do anuncio.`,
      suggestedBudgetChangePct: -20,
    }
  }

  if (campaign.cpc > 0.3 && campaign.spend >= 10) {
    return {
      campaign: campaign.name,
      priority: 'medium',
      action: 'reduce',
      title: 'Reduzir investimento e testar publico',
      reason: `CPC ${campaign.cpc.toFixed(2)} esta acima do alvo atual.`,
      suggestedBudgetChangePct: -15,
    }
  }

  if (campaign.ctr >= 4 && campaign.cpc <= 0.2 && campaign.spend > 0) {
    return {
      campaign: campaign.name,
      priority: campaign.purchases > 0 ? 'high' : 'medium',
      action: 'scale',
      title: 'Escalar gradualmente',
      reason: `CTR ${campaign.ctr.toFixed(2)}% com CPC ${campaign.cpc.toFixed(2)} mostra boa eficiencia.`,
      suggestedBudgetChangePct: 20,
    }
  }

  return {
    campaign: campaign.name,
    priority: 'low',
    action: 'monitor',
    title: 'Monitorar mais volume',
    reason: 'Ainda nao ha sinal forte para pausar ou escalar agressivamente.',
    suggestedBudgetChangePct: 0,
  }
}

export function buildCampaignRecommendations(campaigns: CampaignSummary[]) {
  return campaigns
    .filter((campaign) => campaign.spend > 0 || campaign.clicks > 0 || campaign.impressions > 0)
    .map(recommendationForCampaign)
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 }
      return priorityScore[b.priority] - priorityScore[a.priority]
    })
}

export function buildBudgetForecast(campaigns: CampaignSummary[], daysWithData: number): BudgetForecast {
  const activeDays = Math.max(daysWithData, 1)
  const currentSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0)
  const currentClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0)
  const currentPurchases = campaigns.reduce((sum, campaign) => sum + campaign.purchases, 0)
  const scalableSpend = campaigns
    .filter((campaign) => campaign.ctr >= 4 && campaign.cpc <= 0.2)
    .reduce((sum, campaign) => sum + campaign.spend, 0)
  const dailySpend = currentSpend / activeDays
  const projectedMonthlySpend = dailySpend * 30
  const suggestedMonthlyBudget =
    scalableSpend > 0 ? projectedMonthlySpend * 1.15 : projectedMonthlySpend
  const clicksPerEuro = currentSpend > 0 ? currentClicks / currentSpend : 0
  const purchasesPerEuro = currentSpend > 0 ? currentPurchases / currentSpend : 0

  return {
    currentSpend,
    projectedMonthlySpend,
    suggestedMonthlyBudget,
    expectedClicks: Math.round(suggestedMonthlyBudget * clicksPerEuro),
    expectedPurchases: Math.round(suggestedMonthlyBudget * purchasesPerEuro),
    note:
      scalableSpend > 0
        ? 'Ha campanhas com sinal para escala leve. A previsao adiciona 15% sobre a tendencia atual.'
        : 'Sem campanha forte para escala. A previsao mantem a tendencia atual ate ganhar mais sinal.',
  }
}
