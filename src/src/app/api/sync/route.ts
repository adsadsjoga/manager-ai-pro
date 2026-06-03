import { NextResponse } from 'next/server'

const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY
const ACCOUNT_ID = '1772581277320489'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const fields = [
    'date', 'campaign_id', 'campaign_name', 'adset_name',
    'spend', 'impressions', 'reach', 'frequency', 'clicks',
    'ctr', 'cpc', 'cpm', 'actions', 'action_values',
    'website_purchase_roas', 'objective',
  ].join(',')

  const url = `https://connectors.windsor.ai/api/v1/data?connector=facebook&api_key=${WINDSOR_API_KEY}&account_id=${ACCOUNT_ID}&date_from=${thirtyDaysAgo}&date_to=${today}&fields=${fields}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json({
      success: true,
      rows: data?.data?.length ?? 0,
      sample: data?.data?.slice(0, 3) ?? []
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}