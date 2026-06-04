import type { DailyMetric } from '@prisma/client'

export type CampaignSummary = {
  name: string
  spend: number
  revenue: number
  leads: number
  purchases: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  frequency: number
  conversionRate: number
  health: number
}

export function summarizeCampaigns(metrics: DailyMetric[]): CampaignSummary[] {
  const filteredMetrics = metrics.filter((item) => item.campaignName || item.adName)
  const campaignsMap = new Map<string, CampaignSummary>()
  const frequencyMap = new Map<string, { total: number; rows: number }>()

  for (const item of filteredMetrics) {
    const key = item.campaignName || item.adName || 'Sem campanha'

    if (!campaignsMap.has(key)) {
      campaignsMap.set(key, {
        name: key,
        spend: 0,
        revenue: 0,
        leads: 0,
        purchases: 0,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
        frequency: 0,
        conversionRate: 0,
        health: 50,
      })
      frequencyMap.set(key, { total: 0, rows: 0 })
    }

    const campaign = campaignsMap.get(key)
    const frequency = frequencyMap.get(key)
    if (!campaign || !frequency) continue

    campaign.spend += item.spend
    campaign.revenue += item.revenue
    campaign.leads += item.leads
    campaign.purchases += item.purchases
    campaign.clicks += item.clicks
    campaign.impressions += item.impressions
    frequency.total += item.frequency
    frequency.rows += 1
  }

  return Array.from(campaignsMap.values()).map((campaign) => {
    const frequency = frequencyMap.get(campaign.name)

    campaign.ctr =
      campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0

    campaign.cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0

    campaign.cpm =
      campaign.impressions > 0 ? (campaign.spend / campaign.impressions) * 1000 : 0

    campaign.roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0

    campaign.conversionRate =
      campaign.clicks > 0 ? (campaign.purchases / campaign.clicks) * 100 : 0

    campaign.frequency = frequency && frequency.rows > 0 ? frequency.total / frequency.rows : 0

    campaign.health =
      campaign.purchases >= 10
        ? 90
        : campaign.purchases >= 3 && campaign.cpc <= 0.2
          ? 85
          : campaign.ctr >= 5 && campaign.cpc <= 0.15
            ? 80
            : campaign.ctr >= 4 && campaign.cpc <= 0.25
              ? 75
              : campaign.ctr >= 2
                ? 60
                : campaign.clicks > 0
                  ? 45
                  : 30

    return campaign
  })
}
