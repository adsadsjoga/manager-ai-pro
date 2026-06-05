import { auth } from '@clerk/nextjs/server'
import { summarizeCampaigns } from '@/lib/campaign-metrics'
import { prisma } from '@/lib/prisma'

function escapeCsv(value: string | number) {
  const text = String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Usuario nao autenticado', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  const account = await prisma.adAccount.findFirst({
    where: {
      userId,
      windsorConnected: true,
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!account) {
    return new Response('Nenhuma conta encontrada', { status: 404 })
  }

  const metrics = await prisma.dailyMetric.findMany({
    where: { adAccountId: account.id },
  })
  const campaigns = summarizeCampaigns(metrics)
  const rows = [
    [
      'Campanha',
      'Gasto',
      'Receita',
      'ROAS',
      'Compras',
      'Cliques',
      'Impressoes',
      'CTR',
      'CPC',
      'CPM',
      'Saude',
    ],
    ...campaigns.map((campaign) => [
      campaign.name,
      campaign.spend.toFixed(2),
      campaign.revenue.toFixed(2),
      campaign.roas.toFixed(2),
      campaign.purchases,
      campaign.clicks,
      campaign.impressions,
      campaign.ctr.toFixed(2),
      campaign.cpc.toFixed(2),
      campaign.cpm.toFixed(2),
      campaign.health,
    ]),
  ]
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="campanhas-${account.accountId}.csv"`,
    },
  })
}
