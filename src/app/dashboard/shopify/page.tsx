'use client'

import { useEffect, useState } from 'react'

type AdAccountItem = {
  accountId: string
  accountName: string | null
  currency: string
  windsorConnected: boolean
}

type ShopifyStore = {
  id: string
  shopDomain: string
  storeName: string | null
  currency: string
  syncStatus: string
  syncError: string | null
  lastSyncAt: string | null
  _count?: {
    products: number
    orders: number
  }
}

type ShopifyResponse = {
  success: boolean
  stores?: ShopifyStore[]
  store?: ShopifyStore
  error?: string
}

type ShopifySyncResponse = {
  success: boolean
  productsSaved?: number
  ordersSaved?: number
  realSalesSaved?: number
  warning?: string
  error?: string
}

type AccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function statusTone(status: string) {
  if (status === 'connected') return 'bg-green-500/20 text-green-400'
  if (status === 'needs_token') return 'bg-yellow-500/20 text-yellow-300'
  if (status === 'syncing') return 'bg-blue-500/20 text-blue-300'
  if (status === 'error') return 'bg-red-500/20 text-red-300'
  return 'bg-gray-800 text-gray-400'
}

function statusLabel(status: string) {
  if (status === 'connected') return 'conectada'
  if (status === 'needs_token') return 'precisa token'
  if (status === 'syncing') return 'sincronizando'
  if (status === 'error') return 'erro'
  if (status === 'disconnected') return 'desconectada'
  return 'nao conectada'
}

export default function ShopifyPage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [stores, setStores] = useState<ShopifyStore[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    shopDomain: '',
    storeName: '',
    accessToken: '',
    adAccountId: '',
    currency: 'EUR',
  })

  async function loadShopify() {
    const res = await fetch('/api/shopify')
    const data = (await res.json()) as ShopifyResponse
    if (data.success) setStores(data.stores || [])
  }

  useEffect(() => {
    let active = true

    Promise.all([
      fetch('/api/ad-accounts').then((res) => res.json() as Promise<AccountsResponse>),
      fetch('/api/shopify').then((res) => res.json() as Promise<ShopifyResponse>),
    ])
      .then(([accountsData, shopifyData]) => {
        if (!active) return

        const connectedAccounts =
          accountsData.accounts?.filter((account) => account.windsorConnected) || []
        const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY)
        const selected =
          connectedAccounts.find((account) => account.accountId === savedAccountId) ||
          connectedAccounts[0]

        setAccounts(connectedAccounts)
        setStores(shopifyData.stores || [])
        setForm((current) => ({
          ...current,
          adAccountId: selected?.accountId || '',
          currency: selected?.currency || 'EUR',
        }))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function saveStore() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          ...form,
        }),
      })
      const data = (await res.json()) as ShopifyResponse

      if (!data.success) {
        setError(data.error || 'Erro ao salvar Shopify')
        return
      }

      setMessage('Loja salva. Proximo passo: ativar sincronizacao de produtos e pedidos.')
      setForm((current) => ({ ...current, accessToken: '' }))
      await loadShopify()
    } finally {
      setSaving(false)
    }
  }

  async function syncStore(storeId: string) {
    setSyncingStoreId(storeId)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
        }),
      })
      const data = (await res.json()) as ShopifySyncResponse

      if (!data.success) {
        setError(data.error || 'Erro ao sincronizar Shopify')
        return
      }

      setMessage(
        `Shopify sincronizada: ${data.productsSaved || 0} produto(s), ${
          data.ordersSaved || 0
        } pedido(s), ${data.realSalesSaved || 0} venda(s) real(is).${
          data.warning ? ` ${data.warning}` : ''
        }`
      )
      await loadShopify()
    } finally {
      setSyncingStoreId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando Shopify...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Campanhas', href: '/dashboard/campaigns' },
            { label: 'Vendas reais', href: '/dashboard/sales' },
            { label: 'Criativos', href: '/dashboard/creatives' },
            { label: 'Shopify', href: '/dashboard/shopify', active: true },
            { label: 'Configuracoes', href: '/dashboard/settings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                item.active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Shopify</h1>
          <p className="text-gray-400 text-sm mt-1">
            Base para analisar loja, produtos, pedidos e receita junto com os anuncios.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[1fr_0.9fr] gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-2">Conectar loja</h2>
            <p className="text-sm text-gray-400 mb-5">
              Use o dominio myshopify.com e o token privado da loja quando formos ativar a
              sincronizacao.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Nome da loja</span>
                <input
                  value={form.storeName}
                  onChange={(event) => setForm({ ...form, storeName: event.target.value })}
                  placeholder="Ex: Guia do Volante"
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Dominio Shopify</span>
                <input
                  value={form.shopDomain}
                  onChange={(event) => setForm({ ...form, shopDomain: event.target.value })}
                  placeholder="sua-loja.myshopify.com"
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Conta de anuncio</span>
                <select
                  value={form.adAccountId}
                  onChange={(event) => {
                    const account = accounts.find(
                      (item) => item.accountId === event.target.value
                    )
                    setForm({
                      ...form,
                      adAccountId: event.target.value,
                      currency: account?.currency || form.currency,
                    })
                  }}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  {accounts.map((account) => (
                    <option key={account.accountId} value={account.accountId}>
                      {account.accountName || account.accountId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Moeda</span>
                <select
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  {['EUR', 'BRL', 'USD', 'GBP'].map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block col-span-2">
                <span className="text-xs text-gray-400 uppercase">Admin access token</span>
                <input
                  value={form.accessToken}
                  onChange={(event) => setForm({ ...form, accessToken: event.target.value })}
                  type="password"
                  placeholder="shpat_..."
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            <button
              onClick={saveStore}
              disabled={saving || !form.shopDomain}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg px-5 py-2 text-sm font-medium"
            >
              {saving ? 'Salvando...' : 'Salvar Shopify'}
            </button>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Proximo bloco</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">1. Produtos</strong>
                <p className="text-gray-400 mt-1">
                  Ja preparado para puxar titulo, preco, imagem, estoque e categoria.
                </p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">2. Pedidos</strong>
                <p className="text-gray-400 mt-1">
                  Pedidos pagos entram como vendas reais para comparar com Meta e Stripe.
                </p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">3. Diagnostico da loja</strong>
                <p className="text-gray-400 mt-1">
                  IA avaliando produtos, paginas, ticket medio, conversao e campanhas.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Lojas cadastradas</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['Loja', 'Dominio', 'Status', 'Produtos', 'Pedidos', 'Acoes'].map((heading) => (
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
              {stores.map((store) => (
                <tr key={store.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 font-medium">{store.storeName || store.shopDomain}</td>
                  <td className="px-4 py-3 text-gray-400">{store.shopDomain}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs ${statusTone(
                        store.syncStatus
                      )}`}
                    >
                      {statusLabel(store.syncStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{store._count?.products || 0}</td>
                  <td className="px-4 py-3">{store._count?.orders || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => syncStore(store.id)}
                      disabled={syncingStoreId === store.id || store.syncStatus === 'needs_token'}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {syncingStoreId === store.id ? 'Sincronizando...' : 'Sincronizar Shopify'}
                    </button>
                    {store.syncError && (
                      <p className="mt-2 text-xs text-red-300">{store.syncError}</p>
                    )}
                  </td>
                </tr>
              ))}

              {stores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Nenhuma loja Shopify cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
