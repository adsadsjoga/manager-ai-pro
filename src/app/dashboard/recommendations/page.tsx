'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Brain, TrendingUp } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

type AdAccountItem = {
  accountId: string
  accountName: string | null
  currency: string
  windsorConnected: boolean
}

type AdAccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
}

type Recommendation = {
  campaign: string
  priority: 'high' | 'medium' | 'low'
  action: 'pause' | 'reduce' | 'test_creative' | 'scale' | 'monitor'
  title: string
  reason: string
  suggestedBudgetChangePct: number
}

type Forecast = {
  currentSpend: number
  projectedMonthlySpend: number
  suggestedMonthlyBudget: number
  expectedClicks: number
  expectedPurchases: number
  note: string
}

type BusinessRecommendation = {
  priority: 'high' | 'medium' | 'low'
  title: string
  reason: string
  action: string
}

type RecommendationsResponse = {
  success: boolean
  recommendations?: Recommendation[]
  businessRecommendations?: BusinessRecommendation[]
  forecast?: Forecast | null
  account?: {
    accountId: string
    accountName: string | null
    currency: string
  } | null
  error?: string
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function recommendationsUrl(accountId?: string) {
  return accountId
    ? `/api/recommendations?accountId=${encodeURIComponent(accountId)}`
    : '/api/recommendations'
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function priorityTone(priority: Recommendation['priority']) {
  if (priority === 'high') return 'bg-red-500/20 text-red-300'
  if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-300'
  return 'bg-gray-700 text-gray-300'
}

function actionLabel(action: Recommendation['action']) {
  const labels = {
    pause: 'Pausar',
    reduce: 'Reduzir',
    test_creative: 'Testar criativo',
    scale: 'Escalar',
    monitor: 'Monitorar',
  }
  return labels[action]
}

function MetricLabel({ label, help }: { label: string; help?: string }) {
  return (
    <div className="flex items-center gap-1">
      <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
      {help && (
        <span
          title={help}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-[10px] text-gray-400 cursor-help"
        >
          ?
        </span>
      )}
    </div>
  )
}

const forecastHelp: Record<string, string> = {
  'Gasto atual': 'Investimento ja registrado no periodo usado pela previsao.',
  'ProjeÃ§Ã£o mensal': 'Estimativa simples: ritmo atual de gasto projetado ate o fim do mes.',
  'OrÃ§amento sugerido':
    'Sugestao baseada no gasto atual, volume de dados e sinais de performance. Nao e garantia de resultado; serve como referencia para testar com cuidado.',
  'Compras estimadas':
    'Estimativa calculada a partir do historico atual de compras por euro investido.',
}

export default function RecommendationsPage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('Conta Facebook')
  const [currency, setCurrency] = useState('EUR')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [businessRecommendations, setBusinessRecommendations] = useState<BusinessRecommendation[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadRecommendations(nextAccountId: string) {
    setError(null)
    const res = await fetch(recommendationsUrl(nextAccountId))
    const data = (await res.json()) as RecommendationsResponse

    if (!data.success) {
      setError(data.error || 'Erro ao carregar recomendacoes')
      return
    }

    setRecommendations(data.recommendations || [])
    setBusinessRecommendations(data.businessRecommendations || [])
    setForecast(data.forecast || null)
    setAccountName(data.account?.accountName || 'Conta Facebook')
    setCurrency(data.account?.currency || 'EUR')
  }

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
          await loadRecommendations(selectedAccount.accountId)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleAccountChange(nextAccountId: string) {
    setLoading(true)
    setAccountId(nextAccountId)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)
    await loadRecommendations(nextAccountId)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando recomendações...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="recommendations" />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Recomendações</h1>
            <p className="text-gray-400 text-sm mt-1">
              {accountName} · ações práticas e previsão simples de orçamento.
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

        {forecast && (
          <section className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Gasto atual',
                value: formatMoney(forecast.currentSpend, currency),
                color: 'text-white',
              },
              {
                label: 'Projeção mensal',
                value: formatMoney(forecast.projectedMonthlySpend, currency),
                color: 'text-indigo-300',
              },
              {
                label: 'Orçamento sugerido',
                value: formatMoney(forecast.suggestedMonthlyBudget, currency),
                color: 'text-green-300',
              },
              {
                label: 'Compras estimadas',
                value: String(forecast.expectedPurchases),
                color: 'text-yellow-300',
              },
            ].map((metric) => (
              <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <MetricLabel label={metric.label} help={forecastHelp[metric.label]} />
                <p className={`text-2xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </section>
        )}

        {forecast && (
          <div className="mb-6 bg-indigo-900/20 border border-indigo-700/40 rounded-xl p-4 flex gap-3">
            <TrendingUp size={20} className="text-indigo-300 mt-0.5" />
            <p className="text-sm text-indigo-100">{forecast.note}</p>
          </div>
        )}

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-purple-300" />
              <h2 className="font-semibold">Acoes do negocio</h2>
            </div>
            <a href="/dashboard/business" className="text-sm text-indigo-300 hover:text-indigo-200">
              Editar perfil
            </a>
          </div>

          <div className="divide-y divide-gray-800">
            {businessRecommendations.map((item) => (
              <div key={`${item.title}-${item.action}`} className="p-5 grid grid-cols-[140px_minmax(0,1fr)] gap-4">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityTone(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{item.reason}</p>
                  <p className="text-sm text-gray-200 mt-3">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <Brain size={18} className="text-purple-300" />
            <h2 className="font-semibold">Ações por campanha</h2>
          </div>

          <div className="divide-y divide-gray-800">
            {recommendations.map((item) => (
              <div key={item.campaign} className="p-5 grid grid-cols-[180px_minmax(0,1fr)_120px] gap-4 items-center">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityTone(item.priority)}`}>
                    {item.priority}
                  </span>
                  <p className="text-sm text-gray-400 mt-2">{actionLabel(item.action)}</p>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{item.campaign}</h3>
                  <p className="text-sm text-gray-300 mt-1">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-2">{item.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Orçamento</p>
                  <p className={item.suggestedBudgetChangePct > 0 ? 'text-green-300 font-bold' : item.suggestedBudgetChangePct < 0 ? 'text-red-300 font-bold' : 'text-gray-300 font-bold'}>
                    {item.suggestedBudgetChangePct > 0 ? '+' : ''}
                    {item.suggestedBudgetChangePct}%
                  </p>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="p-10 text-center text-gray-400">
                Sem dados suficientes para recomendar ações.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
