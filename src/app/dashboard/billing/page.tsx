'use client'

import { useEffect, useState } from 'react'

type Plan = {
  key: string
  name: string
  priceLabel: string
  stripeConfigured: boolean
  limits: {
    accounts: number
    clients: number
    syncIntervalMinutes: number | null
    reports: boolean
    whiteLabel: boolean
  }
}

type BillingStatus = {
  success: boolean
  plan?: Plan
  plans?: Plan[]
  usage?: {
    accounts: number
    clients: number
  }
  stripe?: {
    configured: boolean
    hasCustomer: boolean
  }
  error?: string
}

function limitLabel(value: number) {
  if (value === -1) return 'Ilimitado'
  return String(value)
}

function usagePercent(current: number, limit: number) {
  if (limit === -1) return 12
  if (limit <= 0) return current > 0 ? 100 : 0
  return Math.min(100, Math.round((current / limit) * 100))
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/billing/status')
      .then((res) => res.json() as Promise<BillingStatus>)
      .then(setStatus)
  }, [])

  async function checkout(plan: string) {
    if (plan === 'free') return
    setLoadingPlan(plan)
    setError(null)

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { success: boolean; url?: string; error?: string }

      if (!data.success || !data.url) {
        setError(data.error || 'Erro ao abrir checkout')
        return
      }

      window.location.href = data.url
    } finally {
      setLoadingPlan(null)
    }
  }

  async function openPortal() {
    setError(null)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = (await res.json()) as { success: boolean; url?: string; error?: string }

    if (!data.success || !data.url) {
      setError(data.error || 'Erro ao abrir portal')
      return
    }

    window.location.href = data.url
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando planos...
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
            { label: '👥 Clientes', href: '/dashboard/clients' },
            { label: '💳 Planos', href: '/dashboard/billing', active: true },
            { label: '⚙️ Configurações', href: '/dashboard/settings' },
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
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Planos e cobrança</h1>
            <p className="text-gray-400 text-sm mt-1">
              Plano atual: {status.plan?.name}. Uso: {status.usage?.accounts || 0} contas e{' '}
              {status.usage?.clients || 0} clientes.
            </p>
          </div>
          {status.stripe?.hasCustomer && (
            <button
              onClick={openPortal}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Gerenciar cobrança
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!status.stripe?.configured && (
          <div className="mb-6 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">
            Configure STRIPE_SECRET_KEY e os Price IDs para ativar checkout real.
          </div>
        )}

        {status.plan && status.usage && (
          <section className="mb-6 grid grid-cols-2 gap-4">
            {[
              {
                label: 'Contas de anuncio',
                current: status.usage.accounts,
                limit: status.plan.limits.accounts,
              },
              {
                label: 'Clientes',
                current: status.usage.clients,
                limit: status.plan.limits.clients,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="font-semibold">
                    {item.current} / {limitLabel(item.limit)}
                  </p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${usagePercent(item.current, item.limit)}%` }}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-4 gap-4">
          {(status.plans || []).map((plan) => {
            const isCurrent = status.plan?.key === plan.key
            const disabled = plan.key !== 'free' && (!status.stripe?.configured || !plan.stripeConfigured)

            return (
              <section
                key={plan.key}
                className={`bg-gray-900 border rounded-xl p-5 ${
                  isCurrent ? 'border-indigo-500' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{plan.name}</h2>
                    <p className="text-2xl font-bold mt-2">{plan.priceLabel}</p>
                  </div>
                  {isCurrent && (
                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
                      atual
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-300">
                  <p>{limitLabel(plan.limits.accounts)} contas de anúncio</p>
                  <p>{limitLabel(plan.limits.clients)} clientes</p>
                  <p>
                    Sync:{' '}
                    {plan.limits.syncIntervalMinutes
                      ? `${plan.limits.syncIntervalMinutes} min`
                      : 'manual'}
                  </p>
                  <p>{plan.limits.reports ? 'Relatórios inclusos' : 'Sem relatórios'}</p>
                  <p>{plan.limits.whiteLabel ? 'White label' : 'Marca padrão'}</p>
                </div>

                <button
                  onClick={() => checkout(plan.key)}
                  disabled={isCurrent || disabled || loadingPlan === plan.key}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2 rounded-lg text-sm font-medium"
                >
                  {isCurrent ? 'Plano atual' : loadingPlan === plan.key ? 'Abrindo...' : 'Escolher'}
                </button>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
