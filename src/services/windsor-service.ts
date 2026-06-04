const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY

export const WEBSITE_PURCHASE_ACTION_TYPE = 'offsite_conversion.fb_pixel_purchase'

export type WindsorAction = {
  action_type: string
  value: string | number
}

export type WindsorRow = {
  date: string
  datasource?: string
  account_name?: string
  source?: string
  campaign?: string | null

  campaign_id?: string | null
  campaign_name?: string | null
  adset_id?: string | null
  adset_name?: string | null
  ad_id?: string | null
  ad_name?: string | null

  platform?: string | null
  placement?: string | null
  objective?: string | null

  clicks?: number | string
  spend?: number | string
  impressions?: number | string
  reach?: number | string
  frequency?: number | string
  ctr?: number | string
  cpc?: number | string
  cpm?: number | string

  leads?: number | string
  purchases?: number | string
  purchase_roas?: number | string
  website_purchase_roas?: number | string

  actions?: WindsorAction[]
  action_values?: WindsorAction[]
}

type FetchFacebookAdsDataParams = {
  dateFrom?: string
  dateTo?: string
}

export function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function fetchFacebookAdsData(
  params: FetchFacebookAdsDataParams = {}
): Promise<WindsorRow[]> {
  if (!WINDSOR_API_KEY) {
    throw new Error('WINDSOR_API_KEY não configurada')
  }

  const today = new Date().toISOString().split('T')[0]
  const oneYearAgo = new Date(Date.now() - 365 * 86400000)
    .toISOString()
    .split('T')[0]

  const dateFrom = params.dateFrom || oneYearAgo
  const dateTo = params.dateTo || today

  const fields = [
    'date',
    'datasource',
    'account_name',
    'source',
    'campaign',
    'spend',
    'clicks',
    'impressions',
    'reach',
    'frequency',
    'ctr',
    'cpc',
    'cpm',
    'actions',
    'action_values',
  ].join(',')

  const url =
    `https://connectors.windsor.ai/facebook` +
    `?api_key=${WINDSOR_API_KEY}` +
    `&date_from=${dateFrom}` +
    `&date_to=${dateTo}` +
    `&fields=${fields}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro Windsor.ai: ${response.status}`)
  }

  const json = await response.json()

  console.log(
    `Windsor.ai sync fetched ${Array.isArray(json?.data) ? json.data.length : 0} rows from ${dateFrom} to ${dateTo}`
  )

  return (json?.data ?? []) as WindsorRow[]
}
