'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import {
  ArrowDownUp,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react'

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

type DashboardResponse = {
  success: boolean
  campaigns?: Campaign[]
  account?: {
    currency: string
    accountId: string | null
    accountName: string | null
    accounts?: Array<{
      accountId: string
      accountName: string | null
      currency: string
    }>
  }
}

type MetaAdItem = {
  campaignName: string | null
  adName: string | null
  effectiveStatus: string | null
  status: string | null
}

type MetaAdsResponse = {
  success: boolean
  ads?: MetaAdItem[]
}

type HealthFilter = 'all' | 'healthy' | 'attention' | 'critical'
type SortKey = 'spend' | 'purchases' | 'ctr' | 'cpc' | 'health'

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function dashboardUrl(accountId?: string) {
  return accountId
    ? `/api/dashboard?accountId=${encodeURIComponent(accountId)}`
    : '/api/dashboard'
}

function metaAdsUrl(accountId?: string) {
  return accountId
    ? `/api/meta-ads?accountId=${encodeURIComponent(accountId)}`
    : '/api/meta-ads'
}

function emptyCampaign(name: string): Campaign {
  return {
    name,
    spend: 0,
    revenue: 0,
    leads: 0,
    purchases: 0,
    clicks: 0,
    impressions: 0,
    conversionRate: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    roas: 0,
    frequency: 0,
    health: 50,
  }
}

function campaignsFromMetaAds(ads: MetaAdItem[]) {
  const names = new Map<string, Campaign>()

  for (const ad of ads) {
    const name = ad.campaignName || ad.adName
    if (!name) continue

    if (!names.has(name)) {
      names.set(name, emptyCampaign(name))
    }

    const campaign = names.get(name)
    if (!campaign) continue

    if (ad.effectiveStatus === 'ACTIVE') campaign.health = Math.max(campaign.health, 60)
    if (ad.effectiveStatus === 'PENDING_REVIEW') campaign.health = Math.max(campaign.health, 55)
  }

  return Array.from(names.values())
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function healthTone(score: number) {
  if (score >= 70) return 'bg-green-400/10 text-green-400 border-green-500/30'
  if (score >= 50) return 'bg-yellow-400/10 text-yellow-400 border-yellow-500/30'
  return 'bg-red-400/10 text-red-400 border-red-500/30'
}

function statusLabel(score: number) {
  if (score >= 70) return 'Saudavel'
  if (score >= 50) return 'Atencao'
  return 'Critica'
}

function primaryRecommendation(campaign: Campaign) {
  if (campaign.clicks === 0) return 'Sem volume suficiente. Verifique entrega e publico.'
  if (campaign.ctr < 2) return 'CTR baixo. Priorize novos criativos e uma promessa mais direta.'
  if (campaign.cpc > 0.3) return 'CPC alto. Revise publico, criativo e posicionamentos.'
  if (campaign.purchases > 0 && campaign.cpc <= 0.2) {
    return 'Boa eficiencia. Pode testar aumento gradual de orcamento.'
  }
  return 'Performance estavel. Continue monitorando CTR, CPC e compras.'
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [currency, setCurrency] = useState('EUR')
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('Conta Facebook')
  const [accounts, setAccounts] = useState<
    NonNullable<DashboardResponse['account']>['accounts']
  >([])

  const getCampaignsData = useCallback(async (nextAccountId?: string) => {
    const res = await fetch(dashboardUrl(nextAccountId))
    const data = (await res.json()) as DashboardResponse

    if (!data.success) return null

    let nextCampaigns = data.campaigns || []

    if (nextCampaigns.length === 0) {
      const metaRes = await fetch(metaAdsUrl(data.account?.accountId || nextAccountId))
      const metaData = (await metaRes.json()) as MetaAdsResponse
      if (metaData.success) {
        nextCampaigns = campaignsFromMetaAds(metaData.ads || [])
      }
    }

    return { data, nextCampaigns, nextAccountId }
  }, [])

  const applyCampaignsData = useCallback((result: Awaited<ReturnType<typeof getCampaignsData>>) => {
    if (!result) return

    setCampaigns(result.nextCampaigns)
    setCurrency(result.data.account?.currency || 'EUR')
    setAccountId(result.data.account?.accountId || result.nextAccountId || '')
    setAccountName(result.data.account?.accountName || 'Conta Facebook')
    setAccounts(result.data.account?.accounts || [])
    if (result.data.account?.accountId) {
      window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, result.data.account.accountId)
    }
    setSelectedName(result.nextCampaigns[0]?.name || null)
  }, [])

  useEffect(() => {
    let active = true
    const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY) || ''

    getCampaignsData(savedAccountId)
      .then((result) => {
        if (active) applyCampaignsData(result)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [applyCampaignsData, getCampaignsData])

  async function handleAccountChange(nextAccountId: string) {
    setLoading(true)
    setAccountId(nextAccountId)
    setQuery('')
    setSelectedName(null)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)

    try {
      const result = await getCampaignsData(nextAccountId)
      applyCampaignsData(result)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((campaign) => {
        const matchesQuery = campaign.name.toLowerCase().includes(query.toLowerCase())
        const matchesHealth =
          healthFilter === 'all' ||
          (healthFilter === 'healthy' && campaign.health >= 70) ||
          (healthFilter === 'attention' && campaign.health >= 50 && campaign.health < 70) ||
          (healthFilter === 'critical' && campaign.health < 50)

        return matchesQuery && matchesHealth
      })
      .sort((a, b) => b[sortKey] - a[sortKey])
  }, [campaigns, healthFilter, query, sortKey])

  const selectedCampaign =
    filteredCampaigns.find((campaign) => campaign.name === selectedName) ||
    filteredCampaigns[0] ||
    null

  const totalSpend = filteredCampaigns.reduce((acc, campaign) => acc + campaign.spend, 0)
  const totalPurchases = filteredCampaigns.reduce(
    (acc, campaign) => acc + campaign.purchases,
    0
  )
  const totalClicks = filteredCampaigns.reduce((acc, campaign) => acc + campaign.clicks, 0)
  const totalImpressions = filteredCampaigns.reduce(
    (acc, campaign) => acc + campaign.impressions,
    0
  )
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando campanhas...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="campaigns" />

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-gray-400 text-sm mt-1">
              {accountName} · Analise performance, gargalos e oportunidades por campanha.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            <a
              href={`/api/export/campaigns?accountId=${encodeURIComponent(accountId)}`}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Exportar CSV
            </a>

            <a
              href="/dashboard"
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Dashboard
            </a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Campanhas', value: String(filteredCampaigns.length), color: 'text-white' },
            { label: 'Investimento', value: formatMoney(totalSpend, currency), color: 'text-white' },
            { label: 'Compras', value: String(totalPurchases), color: 'text-green-400' },
            { label: 'CTR medio', value: `${avgCtr.toFixed(2)}%`, color: 'text-indigo-400' },
          ].map((metric) => (
            <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{metric.label}</p>
              <p className={`text-2xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar campanha"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <Filter size={16} />
              <select
                value={healthFilter}
                onChange={(event) => setHealthFilter(event.target.value as HealthFilter)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas</option>
                <option value="healthy">Saudaveis</option>
                <option value="attention">Atencao</option>
                <option value="critical">Criticas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <ArrowDownUp size={16} />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="spend">Maior gasto</option>
                <option value="purchases">Mais compras</option>
                <option value="ctr">Maior CTR</option>
                <option value="cpc">Maior CPC</option>
                <option value="health">Maior saude</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-400" />
              <h2 className="font-semibold">Lista de campanhas</h2>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  {['Campanha', 'Gasto', 'Cliques', 'CTR', 'CPC', 'Compras', 'Conv.', 'Saude'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.name}
                    onClick={() => setSelectedName(campaign.name)}
                    className={`border-t border-gray-800 cursor-pointer transition-colors ${
                      selectedCampaign?.name === campaign.name
                        ? 'bg-indigo-500/10'
                        : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium max-w-[280px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{campaign.name}</span>
                        <ChevronRight size={14} className="text-gray-600 shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatMoney(campaign.spend, currency)}</td>
                    <td className="px-4 py-3">{campaign.clicks}</td>
                    <td className="px-4 py-3">{campaign.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3">{formatMoney(campaign.cpc, currency)}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">{campaign.purchases}</td>
                    <td className="px-4 py-3">{campaign.conversionRate.toFixed(2)}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full border text-xs font-medium ${healthTone(campaign.health)}`}>
                        {campaign.health}/100
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      Nenhuma campanha encontrada para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
            {selectedCampaign ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Detalhe</p>
                    <h2 className="font-semibold mt-1 leading-snug">{selectedCampaign.name}</h2>
                  </div>
                  <span className={`px-2 py-1 rounded-full border text-xs font-medium ${healthTone(selectedCampaign.health)}`}>
                    {statusLabel(selectedCampaign.health)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Gasto', value: formatMoney(selectedCampaign.spend, currency) },
                    { label: 'Compras', value: String(selectedCampaign.purchases) },
                    { label: 'CTR', value: `${selectedCampaign.ctr.toFixed(2)}%` },
                    { label: 'CPC', value: formatMoney(selectedCampaign.cpc, currency) },
                    { label: 'CPM', value: formatMoney(selectedCampaign.cpm, currency) },
                    { label: 'ROAS', value: `${selectedCampaign.roas.toFixed(2)}x` },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">{item.label}</p>
                      <p className="font-bold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Recomendacao</p>
                  <p className="text-sm text-gray-200 mt-2">{primaryRecommendation(selectedCampaign)}</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Impressoes', value: selectedCampaign.impressions.toLocaleString('pt-BR') },
                    { label: 'Cliques', value: selectedCampaign.clicks.toLocaleString('pt-BR') },
                    { label: 'Taxa de conversao', value: `${selectedCampaign.conversionRate.toFixed(2)}%` },
                    { label: 'Frequencia', value: selectedCampaign.frequency.toFixed(2) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Selecione uma campanha para ver os detalhes.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
