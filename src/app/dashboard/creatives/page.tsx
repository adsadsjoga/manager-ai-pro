'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Video,
} from 'lucide-react'

type AdAccountItem = {
  accountId: string
  accountName: string | null
  windsorConnected: boolean
}

type AdAccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
}

type MetaAdItem = {
  id: string
  metaAdId: string
  campaignName: string | null
  adsetName: string | null
  adName: string | null
  status: string | null
  effectiveStatus: string | null
  primaryText: string | null
  headline: string | null
  description: string | null
  callToAction: string | null
  imageUrl: string | null
  videoId: string | null
  permalinkUrl: string | null
  thumbnailUrl: string | null
  videoMetrics: Record<string, number> | null
  lastFetchedAt: string
}

type MetaAdsResponse = {
  success: boolean
  metaConfigured?: boolean
  ads?: MetaAdItem[]
  error?: string
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function metaAdsUrl(accountId?: string) {
  return accountId
    ? `/api/meta-ads?accountId=${encodeURIComponent(accountId)}`
    : '/api/meta-ads'
}

function statusTone(status?: string | null) {
  if (status === 'ACTIVE') return 'bg-green-500/20 text-green-400'
  if (status === 'PAUSED') return 'bg-yellow-500/20 text-yellow-400'
  if (status === 'WITH_ISSUES' || status === 'DISAPPROVED') {
    return 'bg-red-500/20 text-red-400'
  }
  return 'bg-gray-800 text-gray-400'
}

function metricValue(ad: MetaAdItem, key: string) {
  const value = ad.videoMetrics?.[key]
  return typeof value === 'number' ? value : 0
}

function retentionPoints(ad: MetaAdItem) {
  return [
    { label: '25%', key: 'p25' },
    { label: '50%', key: 'p50' },
    { label: '75%', key: 'p75' },
    { label: '95%', key: 'p95' },
    { label: '100%', key: 'p100' },
  ].map((item) => ({
    label: item.label,
    value: metricValue(ad, item.key),
  }))
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text()

  if (!text) {
    throw new Error('Resposta vazia do servidor')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Resposta invalida do servidor')
  }
}

export default function CreativesPage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [accountId, setAccountId] = useState('')
  const [ads, setAds] = useState<MetaAdItem[]>([])
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [metaConfigured, setMetaConfigured] = useState(false)

  const selectedAd = ads.find((ad) => ad.id === selectedAdId) || ads[0] || null
  const selectedAccountName =
    accounts.find((account) => account.accountId === accountId)?.accountName ||
    'Conta Facebook'

  const filteredAds = useMemo(() => {
    const needle = query.toLowerCase()
    return ads.filter((ad) =>
      [
        ad.adName,
        ad.campaignName,
        ad.adsetName,
        ad.primaryText,
        ad.headline,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    )
  }, [ads, query])

  const loadAds = useCallback(async (nextAccountId: string) => {
    setError(null)
    try {
      const res = await fetch(metaAdsUrl(nextAccountId))
      const data = await readJsonResponse<MetaAdsResponse>(res)

      if (!data.success) {
        setError(data.error || 'Erro ao carregar criativos')
        setMetaConfigured(Boolean(data.metaConfigured))
        return
      }

      setMetaConfigured(Boolean(data.metaConfigured))
      setAds(data.ads || [])
      setSelectedAdId(data.ads?.[0]?.id || null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar criativos')
    }
  }, [])

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
          await loadAds(selectedAccount.accountId)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadAds])

  async function handleAccountChange(nextAccountId: string) {
    setLoading(true)
    setAccountId(nextAccountId)
    setAds([])
    setSelectedAdId(null)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)
    await loadAds(nextAccountId)
    setLoading(false)
  }

  async function syncMetaAds() {
    if (!accountId) return

    setSyncing(true)
    setError(null)

    try {
      const res = await fetch('/api/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const data = await readJsonResponse<MetaAdsResponse>(res)

      if (!data.success) {
        setError(data.error || 'Erro ao sincronizar criativos da Meta')
        return
      }

      setAds(data.ads || [])
      setSelectedAdId(data.ads?.[0]?.id || null)
      setMetaConfigured(true)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando criativos...
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
            { label: '🎬 Criativos', href: '/dashboard/creatives', active: true },
            { label: '🧠 Diagnóstico IA', href: '/dashboard/diagnosis' },
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

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Criativos Meta</h1>
            <p className="text-gray-400 text-sm mt-1">
              {selectedAccountName} · anuncios, copies, videos e status direto da Meta.
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
              onClick={syncMetaAds}
              disabled={syncing || !accountId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Meta'}
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

        {!metaConfigured && (
          <div className="mb-6 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">
            Configure META_ACCESS_TOKEN no servidor para buscar criativos direto da Meta.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Anuncios', value: String(ads.length), color: 'text-white' },
            {
              label: 'Ativos',
              value: String(ads.filter((ad) => ad.effectiveStatus === 'ACTIVE').length),
              color: 'text-green-400',
            },
            {
              label: 'Com video',
              value: String(ads.filter((ad) => ad.videoId).length),
              color: 'text-indigo-400',
            },
            {
              label: 'Com copy',
              value: String(ads.filter((ad) => ad.primaryText || ad.headline).length),
              color: 'text-yellow-400',
            },
          ].map((metric) => (
            <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{metric.label}</p>
              <p className={`text-2xl font-bold mt-2 ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por anuncio, campanha, copy ou headline"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              <h2 className="font-semibold">Anuncios e criativos</h2>
            </div>

            <div className="divide-y divide-gray-800">
              {filteredAds.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setSelectedAdId(ad.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedAd?.id === ad.id ? 'bg-indigo-500/10' : 'hover:bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{ad.adName || ad.metaAdId}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {ad.campaignName || 'Sem campanha'} · {ad.adsetName || 'Sem conjunto'}
                      </p>
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                        {ad.headline || ad.primaryText || 'Sem copy capturada'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusTone(
                          ad.effectiveStatus
                        )}`}
                      >
                        {ad.effectiveStatus || ad.status || 'sem status'}
                      </span>
                      {ad.videoId ? (
                        <Video size={18} className="text-indigo-400" />
                      ) : (
                        <ImageIcon size={18} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredAds.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                  Nenhum criativo salvo ainda. Clique em Sincronizar Meta.
                </div>
              )}
            </div>
          </section>

          <aside className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
            {selectedAd ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Detalhe</p>
                    <h2 className="font-semibold mt-1 leading-snug">
                      {selectedAd.adName || selectedAd.metaAdId}
                    </h2>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusTone(
                      selectedAd.effectiveStatus
                    )}`}
                  >
                    {selectedAd.effectiveStatus || selectedAd.status || 'sem status'}
                  </span>
                </div>

                {(selectedAd.imageUrl || selectedAd.thumbnailUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedAd.thumbnailUrl || selectedAd.imageUrl || ''}
                    alt={selectedAd.adName || 'Criativo'}
                    className="w-full aspect-video object-cover rounded-lg border border-gray-800 mb-4 bg-gray-800"
                  />
                )}

                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Texto principal', value: selectedAd.primaryText },
                    { label: 'Headline', value: selectedAd.headline },
                    { label: 'Descricao', value: selectedAd.description },
                    { label: 'CTA', value: selectedAd.callToAction },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {item.value || 'Nao capturado'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">
                    Grafico de atencao do video
                  </p>
                  <div className="space-y-2 mb-4">
                    {retentionPoints(selectedAd).map((point) => {
                      const maxValue = Math.max(
                        ...retentionPoints(selectedAd).map((item) => item.value),
                        1
                      )
                      const width = Math.max(4, (point.value / maxValue) * 100)

                      return (
                        <div key={point.label} className="grid grid-cols-[44px_1fr_42px] gap-2 items-center">
                          <span className="text-xs text-gray-400">{point.label}</span>
                          <div className="h-2 rounded-full bg-gray-900 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-right text-gray-300">{point.value}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Tempo medio', value: `${metricValue(selectedAd, 'avgWatchTime')}s` },
                      { label: 'ThruPlay', value: metricValue(selectedAd, 'thruplay') },
                      { label: '25%', value: metricValue(selectedAd, 'p25') },
                      { label: '50%', value: metricValue(selectedAd, 'p50') },
                      { label: '75%', value: metricValue(selectedAd, 'p75') },
                      { label: '100%', value: metricValue(selectedAd, 'p100') },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-300">Pronto para IA</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Estes dados podem ser combinados com CTR, CPC, compras e ROAS para explicar
                    performance por criativo.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Selecione um criativo para ver os detalhes.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
