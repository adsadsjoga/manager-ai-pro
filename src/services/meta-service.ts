const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_API_VERSION = process.env.META_API_VERSION || 'v23.0'

type MetaPagingResponse<T> = {
  data?: T[]
  paging?: {
    next?: string
  }
  error?: {
    message?: string
  }
}

type MetaActionStat = {
  action_type?: string
  value?: string | number
}

export type MetaInsightRow = {
  date_start: string
  date_stop?: string
  account_id?: string
  campaign_id?: string
  campaign_name?: string
  adset_id?: string
  adset_name?: string
  ad_id?: string
  ad_name?: string
  impressions?: string | number
  reach?: string | number
  frequency?: string | number
  clicks?: string | number
  spend?: string | number
  ctr?: string | number
  cpc?: string | number
  cpm?: string | number
  actions?: MetaActionStat[]
  action_values?: MetaActionStat[]
}

type MetaCreative = {
  id?: string
  name?: string
  body?: string
  title?: string
  object_story_spec?: {
    link_data?: {
      message?: string
      name?: string
      description?: string
      call_to_action?: {
        type?: string
      }
      picture?: string
      image_hash?: string
      link?: string
    }
    video_data?: {
      message?: string
      title?: string
      call_to_action?: {
        type?: string
      }
      video_id?: string
      image_url?: string
    }
  }
  asset_feed_spec?: {
    bodies?: Array<{ text?: string }>
    titles?: Array<{ text?: string }>
    descriptions?: Array<{ text?: string }>
    call_to_action_types?: string[]
    images?: Array<{ url?: string }>
    videos?: Array<{ video_id?: string; thumbnail_url?: string }>
  }
  image_url?: string
  thumbnail_url?: string
  effective_object_story_id?: string
  instagram_permalink_url?: string
}

type MetaAd = {
  id: string
  name?: string
  status?: string
  effective_status?: string
  campaign?: {
    id?: string
    name?: string
  }
  adset?: {
    id?: string
    name?: string
  }
  creative?: MetaCreative
  insights?: {
    data?: Array<{
      video_avg_time_watched_actions?: MetaActionStat[]
      video_p25_watched_actions?: MetaActionStat[]
      video_p50_watched_actions?: MetaActionStat[]
      video_p75_watched_actions?: MetaActionStat[]
      video_p95_watched_actions?: MetaActionStat[]
      video_p100_watched_actions?: MetaActionStat[]
      video_thruplay_watched_actions?: MetaActionStat[]
    }>
  }
}

export type NormalizedMetaAd = {
  metaAdId: string
  campaignId?: string
  campaignName?: string
  adsetId?: string
  adsetName?: string
  adName?: string
  status?: string
  effectiveStatus?: string
  creativeId?: string
  creativeName?: string
  primaryText?: string
  headline?: string
  description?: string
  callToAction?: string
  imageUrl?: string
  videoId?: string
  permalinkUrl?: string
  thumbnailUrl?: string
  videoMetrics: Record<string, number>
  rawData: MetaAd
}

export function hasMetaAccessToken() {
  return Boolean(process.env.META_ACCESS_TOKEN)
}

function firstText(values?: Array<{ text?: string }>) {
  return values?.find((item) => item.text?.trim())?.text?.trim() || null
}

function firstActionValue(actions?: MetaActionStat[]) {
  const value = actions?.[0]?.value
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeAd(ad: MetaAd): NormalizedMetaAd {
  const creative = ad.creative
  const linkData = creative?.object_story_spec?.link_data
  const videoData = creative?.object_story_spec?.video_data
  const assetFeed = creative?.asset_feed_spec
  const insights = ad.insights?.data?.[0]

  return {
    metaAdId: ad.id,
    campaignId: ad.campaign?.id,
    campaignName: ad.campaign?.name,
    adsetId: ad.adset?.id,
    adsetName: ad.adset?.name,
    adName: ad.name,
    status: ad.status,
    effectiveStatus: ad.effective_status,
    creativeId: creative?.id,
    creativeName: creative?.name,
    primaryText:
      creative?.body ||
      linkData?.message ||
      videoData?.message ||
      firstText(assetFeed?.bodies) ||
      undefined,
    headline:
      creative?.title ||
      linkData?.name ||
      videoData?.title ||
      firstText(assetFeed?.titles) ||
      undefined,
    description:
      linkData?.description ||
      firstText(assetFeed?.descriptions) ||
      undefined,
    callToAction:
      linkData?.call_to_action?.type ||
      videoData?.call_to_action?.type ||
      assetFeed?.call_to_action_types?.[0],
    imageUrl:
      creative?.image_url ||
      creative?.thumbnail_url ||
      linkData?.picture ||
      videoData?.image_url ||
      assetFeed?.images?.find((image) => image.url)?.url ||
      undefined,
    videoId:
      videoData?.video_id ||
      assetFeed?.videos?.find((video) => video.video_id)?.video_id ||
      undefined,
    permalinkUrl:
      creative?.instagram_permalink_url ||
      linkData?.link ||
      undefined,
    thumbnailUrl:
      creative?.thumbnail_url ||
      assetFeed?.videos?.find((video) => video.thumbnail_url)?.thumbnail_url ||
      undefined,
    videoMetrics: {
      avgWatchTime: firstActionValue(insights?.video_avg_time_watched_actions),
      p25: firstActionValue(insights?.video_p25_watched_actions),
      p50: firstActionValue(insights?.video_p50_watched_actions),
      p75: firstActionValue(insights?.video_p75_watched_actions),
      p95: firstActionValue(insights?.video_p95_watched_actions),
      p100: firstActionValue(insights?.video_p100_watched_actions),
      thruplay: firstActionValue(insights?.video_thruplay_watched_actions),
    },
    rawData: ad,
  }
}

async function metaFetch<T>(url: string): Promise<T> {
  if (!META_ACCESS_TOKEN) {
    throw new Error('META_ACCESS_TOKEN nao configurado')
  }

  const response = await fetch(url)
  const json = await response.json()

  if (!response.ok || json?.error) {
    throw new Error(json?.error?.message || `Erro Meta API: ${response.status}`)
  }

  return json as T
}

export async function fetchMetaAdsForAccount(accountId: string) {
  const fields = [
    'id',
    'name',
    'status',
    'effective_status',
    'campaign{id,name}',
    'adset{id,name}',
    [
      'creative{',
      [
        'id',
        'name',
        'body',
        'title',
        'object_story_spec',
        'asset_feed_spec',
        'image_url',
        'thumbnail_url',
        'effective_object_story_id',
        'instagram_permalink_url',
      ].join(','),
      '}',
    ].join(''),
    [
      'insights.date_preset(maximum){',
      [
        'video_avg_time_watched_actions',
        'video_p25_watched_actions',
        'video_p50_watched_actions',
        'video_p75_watched_actions',
        'video_p95_watched_actions',
        'video_p100_watched_actions',
        'video_thruplay_watched_actions',
      ].join(','),
      '}',
    ].join(''),
  ].join(',')

  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN || '',
    fields,
    limit: '100',
  })
  let nextUrl = `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads?${params.toString()}`
  const ads: MetaAd[] = []

  while (nextUrl) {
    const json = await metaFetch<MetaPagingResponse<MetaAd>>(nextUrl)
    ads.push(...(json.data || []))
    nextUrl = json.paging?.next || ''
  }

  return ads.map(normalizeAd)
}

export async function fetchMetaInsightsForAccount(params: {
  accountId: string
  dateFrom: string
  dateTo: string
}) {
  const fields = [
    'date_start',
    'date_stop',
    'account_id',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'ad_id',
    'ad_name',
    'impressions',
    'reach',
    'frequency',
    'clicks',
    'spend',
    'ctr',
    'cpc',
    'cpm',
    'actions',
    'action_values',
  ].join(',')

  const query = new URLSearchParams({
    access_token: META_ACCESS_TOKEN || '',
    fields,
    level: 'ad',
    time_increment: '1',
    limit: '500',
  })

  query.set(
    'time_range',
    JSON.stringify({
      since: params.dateFrom,
      until: params.dateTo,
    })
  )

  let nextUrl =
    `https://graph.facebook.com/${META_API_VERSION}/act_${params.accountId}/insights?` +
    query.toString()
  const rows: MetaInsightRow[] = []

  while (nextUrl) {
    const json = await metaFetch<MetaPagingResponse<MetaInsightRow>>(nextUrl)
    rows.push(...(json.data || []))
    nextUrl = json.paging?.next || ''
  }

  return rows
}
