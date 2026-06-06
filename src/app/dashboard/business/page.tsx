'use client'

import { useEffect, useState } from 'react'

type AdAccountItem = {
  accountId: string
  accountName: string | null
  currency: string
  windsorConnected: boolean
}

type BusinessProfile = {
  businessName: string
  offer: string | null
  targetAudience: string | null
  country: string | null
  language: string
  averageTicket: number | null
  marginPercent: number | null
  monthlyGoal: number | null
  mainObjective: string | null
  brandTone: string | null
  websiteUrl: string | null
  notes: string | null
}

type AccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
}

type ProfileResponse = {
  success: boolean
  profile?: BusinessProfile | null
  error?: string
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'ads-manager:selected-account-id'

const emptyForm = {
  businessName: '',
  offer: '',
  targetAudience: '',
  country: 'Portugal',
  language: 'pt-BR',
  averageTicket: '',
  marginPercent: '',
  monthlyGoal: '',
  mainObjective: '',
  brandTone: '',
  websiteUrl: '',
  notes: '',
}

export default function BusinessProfilePage() {
  const [accounts, setAccounts] = useState<AdAccountItem[]>([])
  const [accountId, setAccountId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadProfile(nextAccountId: string) {
    const res = await fetch(`/api/business-profile?accountId=${encodeURIComponent(nextAccountId)}`)
    const data = (await res.json()) as ProfileResponse

    if (!data.success) {
      setError(data.error || 'Erro ao carregar perfil')
      return
    }

    if (data.profile) {
      setForm({
        businessName: data.profile.businessName || '',
        offer: data.profile.offer || '',
        targetAudience: data.profile.targetAudience || '',
        country: data.profile.country || 'Portugal',
        language: data.profile.language || 'pt-BR',
        averageTicket: data.profile.averageTicket?.toString() || '',
        marginPercent: data.profile.marginPercent?.toString() || '',
        monthlyGoal: data.profile.monthlyGoal?.toString() || '',
        mainObjective: data.profile.mainObjective || '',
        brandTone: data.profile.brandTone || '',
        websiteUrl: data.profile.websiteUrl || '',
        notes: data.profile.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
  }

  useEffect(() => {
    let active = true

    fetch('/api/ad-accounts')
      .then((res) => res.json() as Promise<AccountsResponse>)
      .then(async (data) => {
        if (!active) return

        const connectedAccounts = data.accounts?.filter((account) => account.windsorConnected) || []
        const savedAccountId = window.localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY)
        const selected =
          connectedAccounts.find((account) => account.accountId === savedAccountId) ||
          connectedAccounts[0]

        setAccounts(connectedAccounts)
        setAccountId(selected?.accountId || '')
        if (selected?.accountId) await loadProfile(selected.accountId)
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
    setMessage(null)
    setError(null)
    await loadProfile(nextAccountId)
  }

  async function saveProfile() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, ...form }),
      })
      const data = (await res.json()) as ProfileResponse

      if (!data.success) {
        setError(data.error || 'Erro ao salvar perfil')
        return
      }

      setMessage('Perfil salvo. A proxima analise de IA ja usa este contexto.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando perfil...
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
            { label: 'Perfil do negocio', href: '/dashboard/business', active: true },
            { label: 'Diagnostico IA', href: '/dashboard/diagnosis' },
            { label: 'Recomendacoes', href: '/dashboard/recommendations' },
            { label: 'Relatorios', href: '/dashboard/reports' },
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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Perfil do negocio</h1>
            <p className="text-gray-400 text-sm mt-1">
              Contexto comercial usado pela IA para diagnosticar campanhas, criativos e relatorios.
            </p>
          </div>

          <select
            value={accountId}
            onChange={(event) => handleAccountChange(event.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {accounts.map((account) => (
              <option key={account.accountId} value={account.accountId}>
                {account.accountName || account.accountId}
              </option>
            ))}
          </select>
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

        <section className="grid grid-cols-[1fr_380px] gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['businessName', 'Nome do negocio', 'Ex: Retro Mundial'],
                ['offer', 'Oferta principal', 'Ex: Camisas retro de futebol'],
                ['targetAudience', 'Publico-alvo', 'Ex: Homens 25-44 apaixonados por futebol'],
                ['country', 'Pais/mercado', 'Portugal'],
                ['averageTicket', 'Ticket medio', '13.97'],
                ['marginPercent', 'Margem (%)', '45'],
                ['monthlyGoal', 'Meta mensal de receita', '3000'],
                ['websiteUrl', 'Site', 'https://...'],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="block">
                  <span className="text-xs text-gray-400 uppercase">{label}</span>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    placeholder={placeholder}
                    className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Objetivo principal</span>
                <select
                  value={form.mainObjective}
                  onChange={(event) => setForm({ ...form, mainObjective: event.target.value })}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="vendas">Vendas</option>
                  <option value="leads">Leads</option>
                  <option value="reconhecimento">Reconhecimento</option>
                  <option value="remarketing">Remarketing</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-400 uppercase">Tom da marca</span>
                <input
                  value={form.brandTone}
                  onChange={(event) => setForm({ ...form, brandTone: event.target.value })}
                  placeholder="Direto, premium, educativo..."
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </label>

              <label className="block col-span-2">
                <span className="text-xs text-gray-400 uppercase">Observacoes para a IA</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Produtos campeoes, objeções, diferenciais, promessas que nao pode usar..."
                  rows={5}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving || !accountId}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>

          <aside className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
            <h2 className="font-semibold mb-4">Como a IA usa isso</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">Diagnostico</strong>
                <p className="mt-1 text-gray-400">
                  Cruza campanhas e criativos com oferta, publico e objetivo.
                </p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">Recomendacoes</strong>
                <p className="mt-1 text-gray-400">
                  Sugere acoes baseadas em meta, ticket, margem e performance.
                </p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4">
                <strong className="text-white">Relatorios</strong>
                <p className="mt-1 text-gray-400">
                  Deixa o resumo mais consultivo para cliente final.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
