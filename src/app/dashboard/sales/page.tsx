'use client'

import { useEffect, useState } from 'react'
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

type RealSale = {
  id: string
  provider: string
  status: string
  amount: number
  currency: string
  customerEmail: string | null
  customerName: string | null
  productName: string | null
  campaignName: string | null
  paidAt: string
}

type RealSalesResponse = {
  success: boolean
  sales?: RealSale[]
  sale?: RealSale
  error?: string
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

function salesUrl(accountId?: string) {
  return accountId
    ? `/api/real-sales?accountId=${encodeURIComponent(accountId)}`
    : '/api/real-sales'
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function statusConfig(status: string) {
  if (status === 'paid') {
    return {
      label: 'Pago',
      className: 'bg-green-500/15 text-green-300 border-green-500/30',
      description: 'Pagamento aprovado e usado na receita real.',
    }
  }

  if (status === 'failed') {
    return {
      label: 'Falhou',
      className: 'bg-red-500/15 text-red-300 border-red-500/30',
      description: 'Tentativa recusada. Nao entra na receita real.',
    }
  }

  if (status === 'refunded') {
    return {
      label: 'Reembolsado',
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      description: 'Pagamento devolvido. Revise antes de contar como receita.',
    }
  }

  return {
    label: status || 'Outro',
    className: 'bg-gray-700 text-gray-300 border-gray-600',
    description: 'Status importado do provedor de pagamento.',
  }
}

function providerLabel(provider: string) {
  if (provider === 'stripe') return 'Stripe'
  if (provider === 'shopify') return 'Shopify'
  if (provider === 'payhip') return 'Payhip'
  if (provider === 'manual') return 'Manual'
  return provider
}

export default function SalesPage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [accountId, setAccountId] = useState('')
  const [sales, setSales] = useState<RealSale[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    provider: 'payhip',
    status: 'paid',
    amount: '13.97',
    currency: 'EUR',
    customerEmail: '',
    productName: '',
    campaignName: '',
    paidAt: '2025-06-25',
  })

  const paidSales = sales.filter((sale) => sale.status === 'paid')
  const failedSales = sales.filter((sale) => sale.status === 'failed')
  const revenue = paidSales.reduce((sum, sale) => sum + sale.amount, 0)
  const selectedCurrency =
    accounts.find((account) => account.accountId === accountId)?.currency || 'EUR'

  async function loadSales(nextAccountId: string) {
    const res = await fetch(salesUrl(nextAccountId))
    const data = (await res.json()) as RealSalesResponse
    if (data.success) setSales(data.sales || [])
  }

  useEffect(() => {
    let active = true

    fetch('/api/ad-accounts')
      .then((res) => res.json() as Promise<AdAccountsResponse>)
      .then(async (data) => {
        if (!active || !data.success || !data.accounts) return

        const connectedAccounts = data.accounts.filter((account) => account.windsorConnected)
        const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY)
        const selected =
          connectedAccounts.find((account) => account.accountId === savedAccountId) ||
          connectedAccounts[0]

        setAccounts(connectedAccounts)
        setAccountId(selected?.accountId || '')
        if (selected?.accountId) await loadSales(selected.accountId)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleAccountChange(nextAccountId: string) {
    setAccountId(nextAccountId)
    window.localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, nextAccountId)
    await loadSales(nextAccountId)
  }

  async function createSale() {
    setError(null)
    const res = await fetch('/api/real-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        adAccountId: accountId,
        ...form,
        amount: Number(form.amount),
      }),
    })
    const data = (await res.json()) as RealSalesResponse

    if (!data.success || !data.sale) {
      setError(data.error || 'Erro ao salvar venda')
      return
    }

    setSales((current) => [data.sale as RealSale, ...current])
  }

  async function syncStripe() {
    setSyncing(true)
    setError(null)

    try {
      const res = await fetch('/api/real-sales/sync-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, since: '2025-01-01' }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!data.success) {
        setError(data.error || 'Erro ao puxar Stripe')
        return
      }

      await loadSales(accountId)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando vendas...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="sales" />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Vendas reais</h1>
            <p className="text-gray-400 text-sm mt-1">
              Pagamentos aprovados usados para receita, ROAS e decisões financeiras.
            </p>
          </div>

          <div className="flex gap-2">
            {accounts.length > 1 && (
              <select
                value={accountId}
                onChange={(event) => handleAccountChange(event.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.accountName || account.accountId}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={syncStripe}
              disabled={syncing || !accountId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm"
            >
              {syncing ? 'Puxando Stripe...' : 'Puxar Stripe'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Vendas pagas</p>
            <p className="text-3xl font-bold mt-2 text-green-400">{paidSales.length}</p>
            <p className="text-xs text-gray-500 mt-2">Entram na receita real.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Receita real</p>
            <p className="text-3xl font-bold mt-2 text-green-400">
              {formatMoney(revenue, selectedCurrency)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Soma apenas pagamentos pagos.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Falhadas</p>
            <p className="text-3xl font-bold mt-2 text-red-300">{failedSales.length}</p>
            <p className="text-xs text-gray-500 mt-2">Nao entram na receita.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Fonte principal</p>
            <p className="text-xl font-bold mt-2">Checkout real</p>
            <p className="text-xs text-gray-500 mt-2">Stripe, Shopify, Payhip ou manual.</p>
          </div>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">Adicionar venda Payhip/manual</h2>
          <div className="grid grid-cols-4 gap-3">
            <input
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              type="number"
              step="0.01"
              placeholder="Valor"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.customerEmail}
              onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
              placeholder="Email do cliente"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.productName}
              onChange={(event) => setForm({ ...form, productName: event.target.value })}
              placeholder="Produto"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.paidAt}
              onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
              type="date"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={form.campaignName}
              onChange={(event) => setForm({ ...form, campaignName: event.target.value })}
              placeholder="Campanha, se souber"
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={createSale}
              disabled={!accountId}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium"
            >
              Salvar venda
            </button>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Histórico financeiro</h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['Data', 'Status', 'Fonte', 'Cliente', 'Produto', 'Valor'].map((heading) => (
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
              {sales.map((sale) => {
                const cfg = statusConfig(sale.status)

                return (
                <tr key={sale.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-3">{sale.paidAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span
                      title={cfg.description}
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{providerLabel(sale.provider)}</td>
                  <td className="px-4 py-3">{sale.customerEmail || '-'}</td>
                  <td className="px-4 py-3">{sale.productName || '-'}</td>
                  <td className={`px-4 py-3 font-semibold ${sale.status === 'paid' ? 'text-green-300' : 'text-gray-300'}`}>
                    {formatMoney(sale.amount, sale.currency)}
                  </td>
                </tr>
                )
              })}

              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Nenhuma venda real salva ainda.
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
