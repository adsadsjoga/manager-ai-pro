export type CampaignForAnalysis = {
  name: string
  spend: number
  revenue?: number
  purchases?: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  frequency?: number
  health: number
}

export type AnalysisRecommendation = {
  priority: 'high' | 'medium' | 'low'
  action: string
  campaign: string
  expected_impact: string
}

export type GeneratedAlert = {
  alertType: string
  severity: 'critical' | 'warning' | 'opportunity' | 'info'
  title: string
  message: string
  campaignName: string
  metrics: Record<string, number | string>
}

export type CampaignAnalysis = {
  health_score: number
  summary: string
  alerts: string[]
  opportunities: string[]
  recommendations: AnalysisRecommendation[]
  generatedAlerts: GeneratedAlert[]
}

function formatMoney(value: number) {
  return `EUR ${value.toFixed(2)}`
}

function pushRecommendation(
  recommendations: AnalysisRecommendation[],
  recommendation: AnalysisRecommendation
) {
  const alreadyExists = recommendations.some(
    (item) =>
      item.campaign === recommendation.campaign &&
      item.action === recommendation.action
  )

  if (!alreadyExists) {
    recommendations.push(recommendation)
  }
}

export function analyzeCampaigns(campaigns: CampaignForAnalysis[]): CampaignAnalysis {
  const alerts: string[] = []
  const opportunities: string[] = []
  const recommendations: AnalysisRecommendation[] = []
  const generatedAlerts: GeneratedAlert[] = []

  for (const campaign of campaigns) {
    const purchases = campaign.purchases || 0
    const frequency = campaign.frequency || 0

    if (campaign.spend >= 10 && purchases === 0) {
      alerts.push(
        `Gasto sem compras em "${campaign.name}" (${formatMoney(campaign.spend)} investidos).`
      )
      pushRecommendation(recommendations, {
        priority: 'high',
        action:
          'Conferir evento de compra, pagina de destino e oferta antes de aumentar investimento.',
        campaign: campaign.name,
        expected_impact: 'Evitar gasto improdutivo e encontrar o gargalo de conversao.',
      })
      generatedAlerts.push({
        alertType: 'spend_without_purchase',
        severity: 'critical',
        title: `Gasto sem compras: ${formatMoney(campaign.spend)}`,
        message:
          'A campanha ja consumiu investimento relevante e ainda nao gerou compras no periodo analisado.',
        campaignName: campaign.name,
        metrics: { spend: campaign.spend, purchases, clicks: campaign.clicks },
      })
    }

    if (campaign.ctr < 2 && campaign.impressions >= 100) {
      alerts.push(`CTR baixo em "${campaign.name}" (${campaign.ctr.toFixed(2)}%).`)
      pushRecommendation(recommendations, {
        priority: 'high',
        action: 'Criar novos criativos e testar uma copy mais direta nos primeiros 3 segundos.',
        campaign: campaign.name,
        expected_impact: 'Aumentar CTR e reduzir custo por clique.',
      })
      generatedAlerts.push({
        alertType: 'low_ctr',
        severity: 'critical',
        title: `CTR baixo: ${campaign.ctr.toFixed(2)}%`,
        message:
          'O CTR esta abaixo do recomendado. Isso pode indicar criativo fraco, headline pouco atrativa ou publico desalinhado.',
        campaignName: campaign.name,
        metrics: { ctr: campaign.ctr, clicks: campaign.clicks, impressions: campaign.impressions },
      })
    }

    if (campaign.cpc > 0.3) {
      alerts.push(`CPC alto em "${campaign.name}" (${formatMoney(campaign.cpc)}).`)
      pushRecommendation(recommendations, {
        priority: 'medium',
        action: 'Revisar publico, criativo e chamada principal do anuncio.',
        campaign: campaign.name,
        expected_impact: 'Reduzir custo por clique.',
      })
      generatedAlerts.push({
        alertType: 'high_cpc',
        severity: 'warning',
        title: `CPC alto: ${formatMoney(campaign.cpc)}`,
        message:
          'O custo por clique esta acima do ideal. Revise criativo, publico e promessa principal.',
        campaignName: campaign.name,
        metrics: { cpc: campaign.cpc, spend: campaign.spend, clicks: campaign.clicks },
      })
    }

    if (campaign.cpm > 12) {
      alerts.push(`CPM alto em "${campaign.name}" (${formatMoney(campaign.cpm)}).`)
      generatedAlerts.push({
        alertType: 'high_cpm',
        severity: 'warning',
        title: `CPM alto: ${formatMoney(campaign.cpm)}`,
        message:
          'O custo por mil impressoes esta elevado. Pode indicar publico pequeno ou alta concorrencia.',
        campaignName: campaign.name,
        metrics: { cpm: campaign.cpm, spend: campaign.spend, impressions: campaign.impressions },
      })
    }

    if (frequency > 3.5 && campaign.ctr < 3) {
      alerts.push(`Frequencia alta em "${campaign.name}" (${frequency.toFixed(2)}x).`)
      pushRecommendation(recommendations, {
        priority: 'medium',
        action: 'Renovar criativos e ampliar publico para reduzir fadiga.',
        campaign: campaign.name,
        expected_impact: 'Recuperar CTR e reduzir saturacao do publico.',
      })
      generatedAlerts.push({
        alertType: 'creative_fatigue',
        severity: 'warning',
        title: `Possivel fadiga: ${frequency.toFixed(2)}x`,
        message:
          'A frequencia esta alta e o CTR nao acompanha. Pode ser sinal de criativo saturado.',
        campaignName: campaign.name,
        metrics: { frequency, ctr: campaign.ctr, impressions: campaign.impressions },
      })
    }

    if (campaign.ctr >= 4 && campaign.cpc <= 0.15) {
      opportunities.push(
        `"${campaign.name}" tem bom CTR e CPC baixo. Pode ser candidata para escalar.`
      )
      pushRecommendation(recommendations, {
        priority: 'medium',
        action: 'Aumentar orcamento gradualmente entre 15% e 25% e monitorar CPC/CTR.',
        campaign: campaign.name,
        expected_impact: 'Gerar mais volume mantendo eficiencia.',
      })
      generatedAlerts.push({
        alertType: 'scale_opportunity',
        severity: 'opportunity',
        title: 'Oportunidade de escala',
        message:
          'Essa campanha tem bom CTR e CPC baixo. Considere aumentar orcamento gradualmente.',
        campaignName: campaign.name,
        metrics: { ctr: campaign.ctr, cpc: campaign.cpc, spend: campaign.spend },
      })
    }

    if (purchases >= 2 && campaign.roas >= 1) {
      opportunities.push(`"${campaign.name}" ja validou compras e tem ROAS positivo.`)
      pushRecommendation(recommendations, {
        priority: 'low',
        action: 'Duplicar aprendizados desta campanha para novos conjuntos ou criativos.',
        campaign: campaign.name,
        expected_impact: 'Aumentar consistencia mantendo uma base validada.',
      })
    }

    if (campaign.health >= 80) {
      generatedAlerts.push({
        alertType: 'healthy_campaign',
        severity: 'info',
        title: 'Campanha saudavel',
        message:
          'Essa campanha esta com boa eficiencia geral e pode servir como referencia para novos criativos.',
        campaignName: campaign.name,
        metrics: { health: campaign.health, ctr: campaign.ctr, cpc: campaign.cpc },
      })
    }
  }

  const avgHealth = campaigns.reduce((acc, campaign) => acc + campaign.health, 0) / campaigns.length
  const bestCampaign = [...campaigns].sort((a, b) => b.ctr - a.ctr)[0]
  const worstCampaign = [...campaigns].sort((a, b) => a.health - b.health)[0]

  if (alerts.length === 0) {
    alerts.push('Nenhum alerta critico foi encontrado no periodo analisado.')
  }

  if (opportunities.length === 0) {
    opportunities.push(
      'Ainda nao ha oportunidade clara de escala. Mantenha volume e acompanhe mais dados.'
    )
  }

  if (recommendations.length === 0) {
    pushRecommendation(recommendations, {
      priority: 'low',
      action: 'Manter monitoramento e comparar o proximo periodo com este recorte.',
      campaign: bestCampaign.name,
      expected_impact: 'Criar uma base de decisao mais confiavel.',
    })
  }

  return {
    health_score: Math.round(avgHealth),
    summary: `A conta tem ${campaigns.length} campanhas analisadas. A melhor campanha por CTR e "${bestCampaign.name}" com ${bestCampaign.ctr.toFixed(
      2
    )}%. A campanha que mais precisa de atencao e "${worstCampaign.name}" com score ${worstCampaign.health}/100.`,
    alerts,
    opportunities,
    recommendations,
    generatedAlerts,
  }
}
