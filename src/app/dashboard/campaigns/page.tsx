'use client'

import { useEffect, useMemo, useState } from 'react'
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
  }
}

type HealthFilter = 'all' | 'healthy' | 'attention' | 'critical'
type SortKey = 'spend' | 'purchases' | 'ctr' | 'cpc' | 'health'

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

  useEffect(() => {
    let active = true

    fetch('/api/dashboard')
      .then((res) => res.json() as Promise<DashboardResponse>)
      .then((data) => {
        if (!active) return

        if (data.success && data.campaigns) {
          setCampaigns(data.campaigns)
          setCurrency(data.account?.currency || 'EUR')
          setSelectedName(data.campaigns[0]?.name || null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

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
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>

        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns', active: true },
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

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-gray-400 text-sm mt-1">
              Analise performance, gargalos e oportunidades por campanha.
            </p>
          </div>

          <a
            href="/dashboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Dashboard
          </a>
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
