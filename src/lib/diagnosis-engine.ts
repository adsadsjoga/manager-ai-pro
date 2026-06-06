import { summarizeCampaigns, type CampaignSummary } from '@/lib/campaign-metrics'
import type { BusinessProfile, DailyMetric, MetaAd } from '@prisma/client'

type CreativeVideoMetrics = {
  avgWatchTime?: number
  thruplay?: number
  p25?: number
  p50?: number
  p75?: number
  p95?: number
  p100?: number
}

export type CreativeDiagnosis = {
  adId: string
  adName: string
  campaignName: string
  status: string
  format: 'video' | 'image'
  score: number
  issue: string
  recommendation: string
  primaryText: string | null
  headline: string | null
  videoMetrics: CreativeVideoMetrics
}

export type DiagnosisAction = {
  priority: 'high' | 'medium' | 'low'
  title: string
  target: string
  reason: string
}

export type AccountDiagnosis = {
  healthScore: number
  summary: string
  businessContext: {
    businessName: string
    objective: string
    offer: string
    targetAudience: string
  } | null
  campaignDiagnosis: CampaignSummary[]
  creativeDiagnosis: CreativeDiagnosis[]
  actions: DiagnosisAction[]
}

function asVideoMetrics(value: unknown): CreativeVideoMetrics {
  if (!value || typeof value !== 'object') return {}
  return value as CreativeVideoMetrics
}

function scoreCreative(ad: MetaAd) {
  const videoMetrics = asVideoMetrics(ad.videoMetrics)
  let score = 70

  if (!ad.primaryText && !ad.headline) score -= 18
  if (ad.effectiveStatus !== 'ACTIVE') score -= 10

  if (ad.videoId) {
    if ((videoMetrics.p25 || 0) > 0 && (videoMetrics.p50 || 0) === 0) score -= 18
    if ((videoMetrics.p50 || 0) > 0 && (videoMetrics.p100 || 0) === 0) score -= 10
    if ((videoMetrics.avgWatchTime || 0) > 0) score += 5
  }

  return Math.max(0, Math.min(100, score))
}

function creativeIssue(ad: MetaAd) {
  const videoMetrics = asVideoMetrics(ad.videoMetrics)

  if (!ad.primaryText && !ad.headline) return 'Copy principal ausente ou nao capturada.'
  if (ad.effectiveStatus !== 'ACTIVE') return 'Anuncio nao esta ativo.'
  if (ad.videoId && (videoMetrics.p25 || 0) > 0 && (videoMetrics.p50 || 0) === 0) {
    return 'Queda forte antes de 50% do video.'
  }
  if (ad.videoId && (videoMetrics.p100 || 0) === 0) {
    return 'Pouca conclusao de video ate o final.'
  }
  return 'Criativo com sinais suficientes para comparacao.'
}

function creativeRecommendation(ad: MetaAd) {
  const videoMetrics = asVideoMetrics(ad.videoMetrics)

  if (!ad.primaryText && !ad.headline) {
    return 'Criar uma copy clara com promessa nos primeiros segundos e CTA direto.'
  }
  if (ad.effectiveStatus !== 'ACTIVE') {
    return 'Manter como referencia, mas nao usar para decisao de escala enquanto estiver inativo.'
  }
  if (ad.videoId && (videoMetrics.p25 || 0) > 0 && (videoMetrics.p50 || 0) === 0) {
    return 'Testar nova abertura do video, gancho mais forte e cortar introducao lenta.'
  }
  if (ad.videoId && (videoMetrics.p100 || 0) === 0) {
    return 'Testar versao mais curta ou reposicionar a oferta antes da metade do video.'
  }
  return 'Cruzar este criativo com CTR, CPC e compras antes de escalar.'
}

export function buildAccountDiagnosis(params: {
  metrics: DailyMetric[]
  creatives: MetaAd[]
  businessProfile?: BusinessProfile | null
}): AccountDiagnosis {
  const campaigns = summarizeCampaigns(params.metrics).sort((a, b) => b.spend - a.spend)
  const creatives: CreativeDiagnosis[] = params.creatives
    .map((ad) => ({
      adId: ad.metaAdId,
      adName: ad.adName || ad.metaAdId,
      campaignName: ad.campaignName || 'Sem campanha',
      status: ad.effectiveStatus || ad.status || 'sem status',
      format: ad.videoId ? ('video' as const) : ('image' as const),
      score: scoreCreative(ad),
      issue: creativeIssue(ad),
      recommendation: creativeRecommendation(ad),
      primaryText: ad.primaryText,
      headline: ad.headline,
      videoMetrics: asVideoMetrics(ad.videoMetrics),
    }))
    .sort((a, b) => a.score - b.score)

  const actions: DiagnosisAction[] = []
  const profile = params.businessProfile
  const weakCampaign = campaigns.find((campaign) => campaign.spend >= 10 && campaign.health < 60)
  const strongCampaign = campaigns.find(
    (campaign) => campaign.ctr >= 4 && campaign.cpc <= 0.2 && campaign.spend > 0
  )
  const weakCreative = creatives.find((creative) => creative.score < 60)
  const activeVideo = creatives.find(
    (creative) => creative.format === 'video' && creative.status === 'ACTIVE'
  )

  if (weakCampaign) {
    actions.push({
      priority: 'high',
      title: 'Revisar campanha com gasto e baixa saude',
      target: weakCampaign.name,
      reason: `Score ${weakCampaign.health}/100, CTR ${weakCampaign.ctr.toFixed(2)}% e CPC ${weakCampaign.cpc.toFixed(2)}.`,
    })
  }

  if (profile && profile.monthlyGoal && profile.averageTicket) {
    const neededSales = Math.ceil(profile.monthlyGoal / profile.averageTicket)
    actions.push({
      priority: 'medium',
      title: 'Alinhar meta comercial com volume de vendas',
      target: profile.businessName,
      reason: `Para chegar a ${profile.monthlyGoal.toFixed(2)} de receita com ticket medio ${profile.averageTicket.toFixed(2)}, o negocio precisa de aproximadamente ${neededSales} vendas no periodo.`,
    })
  }

  if (profile?.offer && weakCreative) {
    actions.push({
      priority: 'medium',
      title: 'Reforcar oferta no criativo',
      target: weakCreative.adName,
      reason: `A oferta cadastrada e "${profile.offer}". Use isso como promessa principal nos primeiros segundos/copy.`,
    })
  }

  if (weakCreative) {
    actions.push({
      priority: 'high',
      title: 'Criar nova variacao de criativo',
      target: weakCreative.adName,
      reason: weakCreative.issue,
    })
  }

  if (strongCampaign) {
    actions.push({
      priority: 'medium',
      title: 'Testar escala gradual',
      target: strongCampaign.name,
      reason: `CTR ${strongCampaign.ctr.toFixed(2)}% com CPC ${strongCampaign.cpc.toFixed(2)}.`,
    })
  }

  if (activeVideo) {
    actions.push({
      priority: 'medium',
      title: 'Comparar retencao do video com CTR',
      target: activeVideo.adName,
      reason: 'Video ativo com dados de retencao disponiveis para avaliar gancho e queda.',
    })
  }

  if (actions.length === 0) {
    actions.push({
      priority: 'low',
      title: 'Aguardar mais volume',
      target: 'Conta',
      reason: 'Ainda nao ha sinais fortes o suficiente para uma acao agressiva.',
    })
  }

  const campaignHealth =
    campaigns.length > 0
      ? campaigns.reduce((sum, campaign) => sum + campaign.health, 0) / campaigns.length
      : 50
  const creativeHealth =
    creatives.length > 0
      ? creatives.reduce((sum, creative) => sum + creative.score, 0) / creatives.length
      : 50
  const healthScore = Math.round((campaignHealth + creativeHealth) / 2)

  return {
    healthScore,
    summary: profile
      ? `Analise de ${profile.businessName} combinou ${campaigns.length} campanhas, ${creatives.length} criativos e o objetivo "${profile.mainObjective || 'nao informado'}". Score geral ${healthScore}/100.`
      : `Analise combinou ${campaigns.length} campanhas e ${creatives.length} criativos. A conta esta com score geral ${healthScore}/100.`,
    businessContext: profile
      ? {
          businessName: profile.businessName,
          objective: profile.mainObjective || '',
          offer: profile.offer || '',
          targetAudience: profile.targetAudience || '',
        }
      : null,
    campaignDiagnosis: campaigns,
    creativeDiagnosis: creatives,
    actions,
  }
}
