import { randomBytes } from 'node:crypto'
import type { AiInsight, DailyMetric } from '@prisma/client'
import { summarizeCampaigns } from '@/lib/campaign-metrics'

export type ReportMetrics = {
  spend: number
  revenue: number
  roas: number
  leads: number
  purchases: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpm: number
}

export function createShareToken() {
  return randomBytes(24).toString('hex')
}

export function summarizeReportMetrics(metrics: DailyMetric[]): ReportMetrics {
  const totals = metrics.reduce(
    (acc, item) => {
      acc.spend += item.spend
      acc.revenue += item.revenue
      acc.leads += item.leads
      acc.purchases += item.purchases
      acc.clicks += item.clicks
      acc.impressions += item.impressions
      return acc
    },
    {
      spend: 0,
      revenue: 0,
      leads: 0,
      purchases: 0,
      clicks: 0,
      impressions: 0,
    }
  )

  return {
    ...totals,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function buildReportHtml(params: {
  accountName: string
  currency: string
  periodStart: Date
  periodEnd: Date
  metrics: DailyMetric[]
  latestInsight?: AiInsight | null
}) {
  const totals = summarizeReportMetrics(params.metrics)
  const campaigns = summarizeCampaigns(params.metrics)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8)

  const insight = params.latestInsight?.summary || 'Sem analise salva para este periodo.'

  return `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatorio Ads Manager AI</title>
  <style>
    body { margin: 0; padding: 40px; font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; }
    .page { max-width: 960px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 28px; }
    h2 { margin-top: 32px; font-size: 18px; }
    .muted { color: #6b7280; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 24px; }
    .metric { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
    .metric span { display: block; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    .metric strong { display: block; margin-top: 8px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { text-align: left; color: #6b7280; background: #f9fafb; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; }
    .insight { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px; line-height: 1.5; }
    .print { margin: 24px auto; max-width: 960px; text-align: right; }
    button { background: #4f46e5; color: white; border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
      .print { display: none; }
    }
  </style>
</head>
<body>
  <div class="print"><button onclick="window.print()">Baixar/Imprimir PDF</button></div>
  <main class="page">
    <section class="header">
      <div>
        <h1>${escapeHtml(params.accountName)}</h1>
        <p class="muted">Relatorio de performance gerado pelo Ads Manager AI Pro</p>
      </div>
      <div>
        <p class="muted">Periodo</p>
        <strong>${formatDate(params.periodStart)} - ${formatDate(params.periodEnd)}</strong>
      </div>
    </section>

    <section class="grid">
      <div class="metric"><span>Investimento</span><strong>${formatCurrency(totals.spend, params.currency)}</strong></div>
      <div class="metric"><span>Receita</span><strong>${formatCurrency(totals.revenue, params.currency)}</strong></div>
      <div class="metric"><span>ROAS</span><strong>${totals.roas.toFixed(2)}x</strong></div>
      <div class="metric"><span>Compras</span><strong>${totals.purchases}</strong></div>
      <div class="metric"><span>Impressoes</span><strong>${totals.impressions.toLocaleString('pt-PT')}</strong></div>
      <div class="metric"><span>Cliques</span><strong>${totals.clicks.toLocaleString('pt-PT')}</strong></div>
      <div class="metric"><span>CTR</span><strong>${totals.ctr.toFixed(2)}%</strong></div>
      <div class="metric"><span>CPC</span><strong>${formatCurrency(totals.cpc, params.currency)}</strong></div>
    </section>

    <h2>Analise automatica</h2>
    <div class="insight">${escapeHtml(insight)}</div>

    <h2>Campanhas principais</h2>
    <table>
      <thead>
        <tr>
          <th>Campanha</th>
          <th>Gasto</th>
          <th>Cliques</th>
          <th>CTR</th>
          <th>Compras</th>
          <th>Saude</th>
        </tr>
      </thead>
      <tbody>
        ${campaigns
          .map(
            (campaign) => `<tr>
              <td>${escapeHtml(campaign.name)}</td>
              <td>${formatCurrency(campaign.spend, params.currency)}</td>
              <td>${campaign.clicks}</td>
              <td>${campaign.ctr.toFixed(2)}%</td>
              <td>${campaign.purchases}</td>
              <td>${campaign.health}/100</td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </main>
</body>
</html>`
}
