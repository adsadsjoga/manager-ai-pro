'use client'

import { useEffect, useState } from 'react'

type DashboardMetrics = {
  spend: number
  revenue: number
  roas: number
  leads: number
  purchases: number
  clicks: number
  impressions: number
  conversionRate: number
  ctr: number
  cpc: number
  cpm: number
}

type Campaign = {
  name: string
  spend: number
  revenue: number
  leads: number
  purchases: number
  clicks: number
  impressions: number
  conversionRate: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
  frequency: number
  health: number
}

type PurchaseBreakdownItem = {
  date: string
  campaignName: string
  purchases: number
  revenue: number
}

interface AIAnalysis {
  health_score: number
  summary: string
  alerts: string[]
  opportunities: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    campaign: string
    expected_impact: string
  }>
  generatedAlerts?: Array<{
    severity: 'critical' | 'warning' | 'opportunity' | 'info'
    title: string
    campaignName: string
  }>
}

type DashboardResponse = {
  success: boolean
  metrics?: DashboardMetrics
  campaigns?: Campaign[]
  purchaseBreakdown?: PurchaseBreakdownItem[]
  account?: {
    currency: string
    dataSource?: string
    accountId: string | null
    accountName: string | null
    accounts?: Array<{
      accountId: string
      accountName: string | null
      currency: string
    }>
  }
  period?: {
    dateFrom: string | null
    dateTo: string | null
  }
}

type DateRange = {
  dateFrom: string
  dateTo: string
}

type LatestAnalysisResponse = {
  success: boolean
  insight?: {
    createdAt: string
    analysis: AIAnalysis | null
  } | null
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function dashboardUrl(range: DateRange, accountId?: string) {
  const params = new URLSearchParams()

  if (range.dateFrom) params.set('dateFrom', range.dateFrom)
  if (range.dateTo) params.set('dateTo', range.dateTo)
  if (accountId) params.set('accountId', accountId)

  const query = params.toString()
  return query ? `/api/dashboard?${query}` : '/api/dashboard'
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [purchaseBreakdown, setPurchaseBreakdown] = useState<PurchaseBreakdownItem[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analysisSavedAt, setAnalysisSavedAt] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [dataSource, setDataSource] = useState('meta')
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('Guia do Volante')
  const [accounts, setAccounts] = useState<
    NonNullable<DashboardResponse['account']>['accounts']
  >([])
  const [activePeriodLabel, setActivePeriodLabel] = useState('Todo período')

  async function loadDashboard(range?: DateRange, nextAccountId = accountId) {
    setLoadingDashboard(true)
    const res = await fetch(dashboardUrl(range || { dateFrom, dateTo }, nextAccountId))
    const data = (await res.json()) as DashboardResponse

    if (data.success && data.metrics && data.campaigns) {
      setMetrics(data.metrics)
      setCampaigns(data.campaigns)
      setPurchaseBreakdown(data.purchaseBreakdown || [])
      setCurrency(data.account?.currency || 'EUR')
      setDataSource(data.account?.dataSource || 'meta')
      setAccountId(data.account?.accountId || '')
      setAccountName(data.account?.accountName || 'Conta Facebook')
      setAccounts(data.account?.accounts || [])
      if (data.account?.accountId) {
        window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, data.account.accountId)
      }
      setAnalysis(null)
      setAnalysisSavedAt(null)
    }

    setLoadingDashboard(false)
  }

  useEffect(() => {
    let active = true
    const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY) || ''

    fetch(dashboardUrl({ dateFrom: '', dateTo: '' }, savedAccountId))
      .then((res) => res.json() as Promise<DashboardResponse>)
      .then((data) => {
        if (!active) return

        if (data.success && data.metrics && data.campaigns) {
          setMetrics(data.metrics)
          setCampaigns(data.campaigns)
          setPurchaseBreakdown(data.purchaseBreakdown || [])
          setCurrency(data.account?.currency || 'EUR')
          setDataSource(data.account?.dataSource || 'meta')
          setAccountId(data.account?.accountId || '')
          setAccountName(data.account?.accountName || 'Conta Facebook')
          setAccounts(data.account?.accounts || [])
          if (data.account?.accountId) {
            window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, data.account.accountId)
          }
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDashboard(false)
        }
      })

    fetch('/api/analyze')
      .then((res) => res.json() as Promise<LatestAnalysisResponse>)
      .then((data) => {
        if (!active) return

        if (data.success && data.insight?.analysis) {
          setAnalysis(data.insight.analysis)
          setAnalysisSavedAt(data.insight.createdAt)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncMessage(null)
    setSyncError(null)

    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom || '2025-01-01',
        dateTo: dateTo || new Date().toISOString().slice(0, 10),
      })
      if (accountId) params.set('accountId', accountId)
      const res = await fetch(`/api/sync?${params.toString()}`)
      const data = await res.json()

      if (!data.success) {
        setSyncError(data.error || 'Erro ao sincronizar')
        return
      }

      setSyncMessage(
        data.warning ||
          `Sincronizado via ${data.source === 'meta' ? 'Meta API' : 'Windsor.ai'}: ${data.rowsInserted} linhas de ${data.dateFrom} ate ${data.dateTo}.`
      )
      await loadDashboard(undefined, accountId)
      setSynced(true)
    } catch (error: unknown) {
      setSyncError(error instanceof Error ? error.message : 'Erro inesperado')
    } finally {
      setSyncing(false)
    }
  }

  async function applyPeriod(label: string, range: DateRange) {
    setDateFrom(range.dateFrom)
    setDateTo(range.dateTo)
    setActivePeriodLabel(label)
    await loadDashboard(range, accountId)
  }

  async function handleAccountChange(nextAccountId: string) {
    setAccountId(nextAccountId)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)
    setActivePeriodLabel('Todo período')
    setDateFrom('')
    setDateTo('')
    await loadDashboard({ dateFrom: '', dateTo: '' }, nextAccountId)
  }

  async function handleAnalyze() {
    const confirm = window.confirm('🤖 Analisar com IA?')
    if (!confirm) return

    setAnalyzing(true)
    setAiError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns }),
      })

      const data = await res.json()

      if (data.success) {
        setAnalysis(data.analysis)
        setAnalysisSavedAt(new Date().toISOString())
      } else {
        setAiError(data.error)
      }
    } catch (error: unknown) {
      setAiError(error instanceof Error ? error.message : 'Erro inesperado')
    } finally {
      setAnalyzing(false)
    }
  }

  const healthBg = (s: number) =>
    s >= 70
      ? 'bg-green-400/10 text-green-400'
      : s >= 50
      ? 'bg-yellow-400/10 text-yellow-400'
      : 'bg-red-400/10 text-red-400'

  const priorityColor = (p: string) =>
    p === 'high'
      ? 'bg-red-500/20 text-red-400'
      : p === 'medium'
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-gray-500/20 text-gray-400'

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  if (loadingDashboard || !metrics) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando dashboard...
      </div>
    )
  }

  const bestCampaign = campaigns.length
    ? [...campaigns].sort((a, b) => b.ctr - a.ctr)[0]
    : null

  const worstCampaign = campaigns.length
    ? [...campaigns].sort((a, b) => a.health - b.health)[0]
    : null

  const totalCampaigns = campaigns.length
  const healthyCampaigns = campaigns.filter((c) => c.health >= 70).length
  const attentionCampaigns = campaigns.filter((c) => c.health < 60).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>

        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard', active: true },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🎬 Criativos', href: '/dashboard/creatives' },
            { label: '🧠 Diagnóstico IA', href: '/dashboard/diagnosis' },
            { label: '✅ Recomendações', href: '/dashboard/recommendations' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatórios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configurações', href: '/dashboard/settings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <div className="font-medium text-white mb-1">{accountName}</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              {dataSource === 'meta' ? 'Meta API conectada' : 'Windsor.ai conectado'}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              {accountName} · Dados reais via {dataSource === 'meta' ? 'Meta API' : 'Windsor.ai'}
            </p>
          </div>

          <div className="flex gap-2">
            {accounts && accounts.length > 1 && (
              <select
                value={accountId}
                onChange={(event) => handleAccountChange(event.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.accountName || account.accountId}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing || campaigns.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className={analyzing ? 'animate-spin' : ''}>🤖</span>
              {analyzing ? 'Analisando com IA...' : 'Analisar com IA'}
            </button>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className={syncing ? 'animate-spin' : ''}>🔄</span>
              {syncing ? 'Sincronizando...' : synced ? '✅ Sincronizado' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {(syncMessage || syncError) && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              syncError
                ? 'border-red-700/50 bg-red-900/20 text-red-300'
                : 'border-green-700/50 bg-green-900/20 text-green-300'
            }`}
          >
            {syncError || syncMessage}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Período ativo
              </p>
              <p className="text-white font-semibold mt-1">{activePeriodLabel}</p>
              <p className="text-gray-500 text-xs mt-1">
                Use o mesmo recorte do Facebook para conferir compras.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-gray-400 text-xs block mb-1">De</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Até</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() =>
                  applyPeriod('Período personalizado', { dateFrom, dateTo })
                }
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { label: 'Todo período', range: { dateFrom: '', dateTo: '' } },
              {
                label: '22/06/2025',
                range: { dateFrom: '2025-06-22', dateTo: '2025-06-22' },
              },
              {
                label: 'Junho/2025',
                range: { dateFrom: '2025-06-01', dateTo: '2025-06-30' },
              },
              {
                label: 'Outubro/2025',
                range: { dateFrom: '2025-10-01', dateTo: '2025-10-31' },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => applyPeriod(item.label, item.range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activePeriodLabel === item.label
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Investimento',
              value: formatCurrency(metrics.spend, currency),
              color: 'text-white',
            },
            {
              label: 'Impressões',
              value: metrics.impressions.toLocaleString('pt-BR'),
              color: 'text-white',
            },
            {
              label: 'Cliques',
              value: metrics.clicks.toLocaleString('pt-BR'),
              color: 'text-indigo-400',
            },
            {
              label: 'CTR',
              value: `${metrics.ctr.toFixed(2)}%`,
              color:
                metrics.ctr >= 4
                  ? 'text-green-400'
                  : metrics.ctr >= 2
                  ? 'text-yellow-400'
                  : 'text-red-400',
            },
            {
              label: 'Compras',
              value: metrics.purchases.toLocaleString('pt-BR'),
              color: metrics.purchases > 0 ? 'text-green-400' : 'text-red-400',
            },
            {
              label: 'Conversão',
              value: `${metrics.conversionRate.toFixed(2)}%`,
              color:
                metrics.conversionRate >= 1
                  ? 'text-green-400'
                  : metrics.conversionRate >= 0.5
                  ? 'text-yellow-400'
                  : 'text-red-400',
            },
            {
              label: 'CPC',
              value: formatCurrency(metrics.cpc, currency),
              color:
                metrics.cpc <= 0.15
                  ? 'text-green-400'
                  : metrics.cpc <= 0.30
                  ? 'text-yellow-400'
                  : 'text-red-400',
            },
            {
              label: 'CPM',
              value: formatCurrency(metrics.cpm, currency),
              color:
                metrics.cpm <= 6
                  ? 'text-green-400'
                  : metrics.cpm <= 12
                  ? 'text-yellow-400'
                  : 'text-red-400',
            },
            {
              label: 'Receita',
              value: formatCurrency(metrics.revenue, currency),
              color: metrics.revenue > 0 ? 'text-green-400' : 'text-gray-400',
            },
            {
              label: 'ROAS',
              value: `${metrics.roas.toFixed(2)}x`,
              color:
                metrics.roas >= 3
                  ? 'text-green-400'
                  : metrics.roas >= 1.5
                  ? 'text-yellow-400'
                  : 'text-gray-400',
            },
            { label: 'Campanhas', value: String(totalCampaigns), color: 'text-white' },
            { label: 'Saudáveis', value: String(healthyCampaigns), color: 'text-green-400' },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
            >
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{m.label}</p>
              <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {metrics.purchases > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Auditoria de compras</h2>
                <p className="text-gray-400 text-xs mt-1">
                  O total de {metrics.purchases} compras vem da soma destas linhas no período ativo.
                </p>
              </div>

              <button
                onClick={() =>
                  applyPeriod('22/06/2025', {
                    dateFrom: '2025-06-22',
                    dateTo: '2025-06-22',
                  })
                }
                className="bg-gray-800 border border-gray-700 hover:border-indigo-500 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
              >
                Ver só 22/06/2025
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  {['Data', 'Campanha', 'Compras', 'Receita'].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {purchaseBreakdown.map((item, index) => (
                  <tr
                    key={`${item.date}-${item.campaignName}-${index}`}
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300">{item.date}</td>
                    <td className="px-4 py-3 font-medium">{item.campaignName}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">{item.purchases}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(item.revenue, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Melhor CTR</p>
            <p className="text-lg font-bold mt-2 truncate">{bestCampaign?.name || 'Sem dados'}</p>
            <p className="text-green-400 text-sm mt-1">
              {bestCampaign ? `${bestCampaign.ctr.toFixed(2)}%` : '-'}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Precisa de atenção</p>
            <p className="text-lg font-bold mt-2 truncate">{worstCampaign?.name || 'Sem dados'}</p>
            <p className="text-red-400 text-sm mt-1">
              {worstCampaign ? `${worstCampaign.health}/100` : '-'}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Campanhas em alerta</p>
            <p className="text-2xl font-bold mt-2 text-yellow-400">{attentionCampaigns}</p>
            <p className="text-gray-400 text-sm mt-1">Score abaixo de 60</p>
          </div>
        </div>

        {!analysis && !analyzing && (
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/40 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-300">Análise de IA disponível</h3>
                <p className="text-gray-300 text-sm mt-1">
                  Clique em &quot;Analisar com IA&quot; para obter insights automáticos das suas campanhas.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                Analisar agora
              </button>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-6 mb-8 text-center">
            <div className="text-3xl mb-2 animate-pulse">🤖</div>
            <p className="text-purple-300 font-medium">IA analisando suas campanhas...</p>
          </div>
        )}

        {aiError && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-8 text-red-300 text-sm">
            ❌ Erro na análise: {aiError}
          </div>
        )}

        {analysis && (
          <div className="bg-gray-900 border border-purple-700/40 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">🤖 Análise de IA</h2>
                {analysisSavedAt && (
                  <p className="text-gray-500 text-xs mt-1">
                    Última análise salva em{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(analysisSavedAt))}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${scoreColor(analysis.health_score)}`}>
                  {analysis.health_score}/100
                </span>
                <p className="text-gray-500 text-xs">score geral</p>
              </div>
            </div>

            <p className="text-gray-200 text-sm mb-4 bg-gray-800 rounded-lg p-3">
              {analysis.summary}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                  ⚠️ Alertas
                </h4>
                <ul className="space-y-1">
                  {analysis.alerts.map((a, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                  🚀 Oportunidades
                </h4>
                <ul className="space-y-1">
                  {analysis.opportunities.map((o, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.generatedAlerts && analysis.generatedAlerts.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  {
                    label: 'Críticos',
                    count: analysis.generatedAlerts.filter((item) => item.severity === 'critical')
                      .length,
                    color: 'text-red-400',
                  },
                  {
                    label: 'Atenção',
                    count: analysis.generatedAlerts.filter((item) => item.severity === 'warning')
                      .length,
                    color: 'text-yellow-400',
                  },
                  {
                    label: 'Oportunidades',
                    count: analysis.generatedAlerts.filter((item) => item.severity === 'opportunity')
                      .length,
                    color: 'text-green-400',
                  },
                  {
                    label: 'Info',
                    count: analysis.generatedAlerts.filter((item) => item.severity === 'info')
                      .length,
                    color: 'text-blue-400',
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">{item.label}</p>
                    <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.count}</p>
                  </div>
                ))}
              </div>
            )}

            {analysis.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-lg p-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priorityColor(r.priority)}`}>
                  {r.priority}
                </span>
                <div>
                  <p className="text-sm font-medium">{r.action}</p>
                  <p className="text-xs text-gray-400">
                    {r.campaign} · {r.expected_impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">📣 Campanhas</h2>
            <a href="/dashboard/campaigns" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Ver todas →
            </a>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {[
                  'Campanha',
                  'Gasto',
                  'Cliques',
                  'Impressões',
                  'CTR',
                  'CPC',
                  'Compras',
                  'Conv.',
                  'Saúde',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {campaigns.slice(0, 5).map((c, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[260px] truncate">{c.name}</td>
                  <td className="px-4 py-3">{formatCurrency(c.spend, currency)}</td>
                  <td className="px-4 py-3">{c.clicks}</td>
                  <td className="px-4 py-3">{c.impressions}</td>
                  <td className="px-4 py-3">{c.ctr.toFixed(2)}%</td>
                  <td className="px-4 py-3">{formatCurrency(c.cpc, currency)}</td>
                  <td className="px-4 py-3">{c.purchases}</td>
                  <td className="px-4 py-3">{c.conversionRate?.toFixed(2) || '0.00'}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthBg(c.health)}`}>
                      {c.health}/100
                    </span>
                  </td>
                </tr>
              ))}

              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    Nenhuma campanha encontrada neste período. Tente outro recorte ou sincronize novamente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
