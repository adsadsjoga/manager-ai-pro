'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Brain, RefreshCw, Sparkles } from 'lucide-react'

type AdAccountItem = {
  accountId: string
  accountName: string | null
  windsorConnected: boolean
}

type AdAccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
}

type DiagnosisAction = {
  priority: 'high' | 'medium' | 'low'
  title: string
  target: string
  reason: string
}

type CampaignDiagnosis = {
  name: string
  spend: number
  purchases: number
  ctr: number
  cpc: number
  roas: number
  health: number
}

type CreativeDiagnosis = {
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
  videoMetrics: Record<string, number>
}

type AccountDiagnosis = {
  healthScore: number
  summary: string
  campaignDiagnosis: CampaignDiagnosis[]
  creativeDiagnosis: CreativeDiagnosis[]
  actions: DiagnosisAction[]
}

type DiagnosisResponse = {
  success: boolean
  diagnosis?: {
    analysis: AccountDiagnosis | null
  } | AccountDiagnosis | null
  error?: string
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function scoreColor(score: number) {
  if (score >= 75) return 'text-green-400'
  if (score >= 55) return 'text-yellow-400'
  return 'text-red-400'
}

function priorityTone(priority: string) {
  if (priority === 'high') return 'bg-red-500/20 text-red-400'
  if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-green-500/20 text-green-400'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function videoMetric(creative: CreativeDiagnosis, key: string) {
  const value = creative.videoMetrics?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function retentionPoints(creative: CreativeDiagnosis) {
  return [
    { label: '25%', value: videoMetric(creative, 'p25') },
    { label: '50%', value: videoMetric(creative, 'p50') },
    { label: '75%', value: videoMetric(creative, 'p75') },
    { label: '100%', value: videoMetric(creative, 'p100') },
  ]
}

function normalizeDiagnosis(data: DiagnosisResponse) {
  if (!data.diagnosis) return null
  if ('analysis' in data.diagnosis) return data.diagnosis.analysis
  return data.diagnosis
}

export default function DiagnosisPage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [accountId, setAccountId] = useState('')
  const [diagnosis, setDiagnosis] = useState<AccountDiagnosis | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAccountName =
    accounts.find((account) => account.accountId === accountId)?.accountName ||
    'Conta Facebook'

  useEffect(() => {
    let active = true

    fetch('/api/ad-accounts')
      .then((res) => res.json() as Promise<AdAccountsResponse>)
      .then(async (data) => {
        if (!active || !data.success || !data.accounts) return

        const connectedAccounts = data.accounts.filter((account) => account.windsorConnected)
        const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY)
        const selectedAccount =
          connectedAccounts.find((account) => account.accountId === savedAccountId) ||
          connectedAccounts[0]

        setAccounts(connectedAccounts)
        setAccountId(selectedAccount?.accountId || '')

        if (selectedAccount?.accountId) {
          window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, selectedAccount.accountId)
          await loadDiagnosis(selectedAccount.accountId)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function loadDiagnosis(nextAccountId: string) {
    const res = await fetch(`/api/diagnosis?accountId=${encodeURIComponent(nextAccountId)}`)
    const data = (await res.json()) as DiagnosisResponse
    if (data.success) setDiagnosis(normalizeDiagnosis(data))
  }

  async function generateDiagnosis() {
    if (!accountId) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const data = (await res.json()) as DiagnosisResponse

      if (!data.success) {
        setError(data.error || 'Erro ao gerar diagnostico')
        return
      }

      setDiagnosis(normalizeDiagnosis(data))
    } finally {
      setGenerating(false)
    }
  }

  async function handleAccountChange(nextAccountId: string) {
    setAccountId(nextAccountId)
    setDiagnosis(null)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)
    await loadDiagnosis(nextAccountId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando diagnostico...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🎬 Criativos', href: '/dashboard/creatives' },
            { label: '🧠 Diagnostico IA', href: '/dashboard/diagnosis', active: true },
            { label: '✅ Recomendações', href: '/dashboard/recommendations' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatorios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configuracoes', href: '/dashboard/settings' },
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
      </div>

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Diagnostico IA</h1>
            <p className="text-gray-400 text-sm mt-1">
              {selectedAccountName} · campanhas, criativos, copy e retencao em uma analise.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {accounts.length > 1 && (
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
              onClick={generateDiagnosis}
              disabled={generating || !accountId}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Gerando...' : 'Gerar diagnostico'}
            </button>
            <a
              href="/dashboard"
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Dashboard
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!diagnosis ? (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <Brain className="mx-auto text-purple-400 mb-4" size={36} />
            <h2 className="text-xl font-semibold">Nenhum diagnostico gerado ainda</h2>
            <p className="text-gray-400 text-sm mt-2">
              Gere um diagnostico para cruzar campanhas, criativos, copy e retencao.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-[280px_minmax(0,1fr)] gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Score geral</p>
                <p className={`text-5xl font-bold mt-3 ${scoreColor(diagnosis.healthScore)}`}>
                  {diagnosis.healthScore}
                </p>
                <p className="text-gray-500 text-sm mt-2">de 100</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-purple-400" />
                  <h2 className="font-semibold">Resumo</h2>
                </div>
                <p className="text-gray-200 leading-relaxed">{diagnosis.summary}</p>
              </div>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Plano de acao</h2>
              <div className="grid grid-cols-3 gap-4">
                {diagnosis.actions.map((action) => (
                  <div key={`${action.title}-${action.target}`} className="bg-gray-800 rounded-lg p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityTone(action.priority)}`}>
                      {action.priority}
                    </span>
                    <h3 className="font-semibold mt-3">{action.title}</h3>
                    <p className="text-sm text-indigo-300 mt-1">{action.target}</p>
                    <p className="text-sm text-gray-300 mt-3">{action.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold">Campanhas</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {diagnosis.campaignDiagnosis.slice(0, 6).map((campaign) => (
                    <div key={campaign.name} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium truncate">{campaign.name}</p>
                        <span className={scoreColor(campaign.health)}>{campaign.health}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatMoney(campaign.spend)} · CTR {campaign.ctr.toFixed(2)}% · CPC{' '}
                        {formatMoney(campaign.cpc)} · ROAS {campaign.roas.toFixed(2)}x
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold">Criativos</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {diagnosis.creativeDiagnosis.slice(0, 6).map((creative) => (
                    <div key={creative.adId} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium truncate">{creative.adName}</p>
                        <span className={scoreColor(creative.score)}>{creative.score}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {creative.format} · {creative.status} · {creative.campaignName}
                      </p>
                      <p className="text-sm text-gray-300 mt-2">{creative.issue}</p>
                      <p className="text-sm text-indigo-300 mt-2">{creative.recommendation}</p>

                      {creative.format === 'video' && (
                        <div className="mt-3 space-y-2">
                          {retentionPoints(creative).map((point) => {
                            const maxValue = Math.max(
                              ...retentionPoints(creative).map((item) => item.value),
                              1
                            )
                            const width = Math.max(4, (point.value / maxValue) * 100)

                            return (
                              <div
                                key={point.label}
                                className="grid grid-cols-[40px_1fr_38px] items-center gap-2"
                              >
                                <span className="text-xs text-gray-500">{point.label}</span>
                                <div className="h-1.5 rounded-full bg-gray-950 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-indigo-400"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                                <span className="text-xs text-right text-gray-400">
                                  {point.value}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
