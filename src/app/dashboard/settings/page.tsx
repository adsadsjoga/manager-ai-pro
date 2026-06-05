'use client'

import { useEffect, useState } from 'react'

type SettingsResponse = {
  success: boolean
  settings?: {
    accountId: string
    accountName: string
    currency: string
    timezone: string
    integrations?: {
      windsorConfigured: boolean
      anthropicConfigured: boolean
      metaConfigured?: boolean
    }
  }
  error?: string
}

type AlertRule = {
  id: string
  name: string | null
  metric: string | null
  threshold: number | null
  severity: string
  cooldownHours: number
  notifyEmail: boolean
  isActive: boolean
}

type AlertRulesResponse = {
  success: boolean
  rules?: AlertRule[]
  error?: string
}

type AdAccountItem = {
  id: string
  platform: string
  accountId: string
  accountName: string | null
  currency: string
  timezone: string
  windsorConnected: boolean
  syncStatus: string
  lastSyncAt: string | null
}

type AdAccountsResponse = {
  success: boolean
  accounts?: AdAccountItem[]
  account?: AdAccountItem
  error?: string
}

export default function SettingsPage() {
  const [windsorConfigured, setWindsorConfigured] = useState(false)
  const [anthropicConfigured, setAnthropicConfigured] = useState(false)
  const [metaConfigured, setMetaConfigured] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('Guia do Volante')
  const [currency, setCurrency] = useState('EUR')
  const [timezone, setTimezone] = useState('Europe/Lisbon')
  const [syncInterval, setSyncInterval] = useState('15')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [emailReport, setEmailReport] = useState(true)
  const [reportDay, setReportDay] = useState('monday')
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccountItem[]>([])
  const [discoveringAccounts, setDiscoveringAccounts] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountId: '',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
  })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetch('/api/settings')
      .then((res) => res.json() as Promise<SettingsResponse>)
      .then((data) => {
        if (!active || !data.success || !data.settings) return

        setAccountId(data.settings.accountId)
        setAccountName(data.settings.accountName)
        setCurrency(data.settings.currency)
        setTimezone(data.settings.timezone)
        setWindsorConfigured(Boolean(data.settings.integrations?.windsorConfigured))
        setAnthropicConfigured(Boolean(data.settings.integrations?.anthropicConfigured))
        setMetaConfigured(Boolean(data.settings.integrations?.metaConfigured))
      })

    fetch('/api/alert-rules')
      .then((res) => res.json() as Promise<AlertRulesResponse>)
      .then((data) => {
        if (!active || !data.success || !data.rules) return

        setAlertRules(data.rules)
      })

    fetch('/api/ad-accounts')
      .then((res) => res.json() as Promise<AdAccountsResponse>)
      .then((data) => {
        if (!active || !data.success || !data.accounts) return

        setAdAccounts(data.accounts)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    setSaveError(null)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName, currency, timezone }),
    })
    const data = (await res.json()) as SettingsResponse

    if (!data.success) {
      setSaveError(data.error || 'Erro ao salvar configuracoes')
      return
    }

    const rulesRes = await fetch('/api/alert-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rules: alertRules.map((rule) => ({
          id: rule.id,
          isActive: rule.isActive,
          threshold: rule.threshold ?? 0,
          notifyEmail: rule.notifyEmail,
          cooldownHours: rule.cooldownHours,
        })),
      }),
    })
    const rulesData = (await rulesRes.json()) as AlertRulesResponse

    if (!rulesData.success) {
      setSaveError(rulesData.error || 'Erro ao salvar regras de alerta')
      return
    }

    setAlertRules(rulesData.rules || alertRules)

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function updateRule(id: string, update: Partial<AlertRule>) {
    setAlertRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, ...update } : rule))
    )
  }

  const severityTone = (severity: string) => {
    if (severity === 'critical') return 'bg-red-500/20 text-red-400'
    if (severity === 'warning') return 'bg-yellow-500/20 text-yellow-400'
    if (severity === 'opportunity') return 'bg-green-500/20 text-green-400'
    return 'bg-blue-500/20 text-blue-400'
  }

  const accountStatus = (account: AdAccountItem) => {
    if (!account.windsorConnected || account.syncStatus === 'disconnected') {
      return {
        label: 'desconectada',
        className: 'bg-gray-900 text-gray-500',
      }
    }
    if (account.syncStatus === 'success') {
      return {
        label: 'conectada',
        className: 'bg-green-500/20 text-green-400',
      }
    }
    if (account.syncStatus === 'discovered') {
      return {
        label: 'disponivel',
        className: 'bg-blue-500/20 text-blue-400',
      }
    }

    return {
      label: account.syncStatus || 'pendente',
      className: 'bg-yellow-500/20 text-yellow-400',
    }
  }

  async function addAdAccount() {
    setSaveError(null)

    const res = await fetch('/api/ad-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        ...newAccount,
      }),
    })
    const data = (await res.json()) as AdAccountsResponse

    if (!data.success || !data.account) {
      setSaveError(data.error || 'Erro ao adicionar conta')
      return
    }

    setAdAccounts((current) => [data.account as AdAccountItem, ...current])
    setNewAccount({
      accountName: '',
      accountId: '',
      currency: 'EUR',
      timezone: 'Europe/Lisbon',
    })
  }

  async function discoverAdAccounts() {
    setSaveError(null)
    setDiscoveringAccounts(true)

    try {
      const res = await fetch('/api/ad-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'discover',
          currency: newAccount.currency,
          timezone: newAccount.timezone,
        }),
      })
      const data = (await res.json()) as AdAccountsResponse

      if (!data.success || !data.accounts) {
        setSaveError(data.error || 'Erro ao buscar contas na Windsor')
        return
      }

      setAdAccounts(data.accounts)
    } finally {
      setDiscoveringAccounts(false)
    }
  }

  async function syncAdAccount(accountId: string) {
    setSaveError(null)
    setSyncingAccountId(accountId)

    try {
      const res = await fetch(`/api/sync?accountId=${encodeURIComponent(accountId)}`)
      const data = await res.json()

      if (!data.success) {
        setSaveError(data.error || 'Erro ao sincronizar conta')
        return
      }

      const accountsRes = await fetch('/api/ad-accounts')
      const accountsData = (await accountsRes.json()) as AdAccountsResponse
      if (accountsData.success && accountsData.accounts) {
        setAdAccounts(accountsData.accounts)
      }
    } finally {
      setSyncingAccountId(null)
    }
  }

  async function disconnectAdAccount(id: string) {
    const res = await fetch('/api/ad-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', id }),
    })
    const data = (await res.json()) as AdAccountsResponse

    if (!data.success) {
      setSaveError(data.error || 'Erro ao desconectar conta')
      return
    }

    setAdAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? { ...account, windsorConnected: false, syncStatus: 'disconnected' }
          : account
      )
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
            { label: '🧠 Diagnóstico IA', href: '/dashboard/diagnosis' },
            { label: '✅ Recomendações', href: '/dashboard/recommendations' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatorios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configuracoes', href: '/dashboard/settings', active: true },
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
              Windsor.ai conectado
            </div>
          </div>
        </div>
      </div>

      <div className="ml-64 p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Configuracoes</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gerencie conta, moeda, integracoes, alertas e preferencias.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saved ? '✓ Salvo' : 'Salvar alteracoes'}
          </button>
        </div>

        {saveError && (
          <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {saveError}
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-blue-400">●</span> Conta de anuncio
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Nome da conta
                </label>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Account ID
                </label>
                <input
                  value={accountId}
                  disabled
                  className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Moeda
                </label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EUR">Euro (EUR)</option>
                  <option value="BRL">Real brasileiro (BRL)</option>
                  <option value="USD">Dolar americano (USD)</option>
                  <option value="GBP">Libra esterlina (GBP)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Fuso horario
                </label>
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Europe/Lisbon">Portugal continental</option>
                  <option value="Europe/Dublin">Irlanda/Reino Unido</option>
                  <option value="America/Sao_Paulo">Brasil</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Conta conectada e sincronizando
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold">Multi-contas Facebook</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Busque as contas disponiveis na Windsor.ai ou adicione um Account ID manualmente.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
                  {adAccounts.filter((account) => account.windsorConnected).length} conectadas
                </span>
                <button
                  type="button"
                  onClick={discoverAdAccounts}
                  disabled={discoveringAccounts}
                  className="bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  {discoveringAccounts ? 'Buscando...' : 'Buscar contas'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_160px_110px] gap-3 mb-4">
              <input
                value={newAccount.accountName}
                onChange={(event) =>
                  setNewAccount({ ...newAccount, accountName: event.target.value })
                }
                placeholder="Nome da conta"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={newAccount.accountId}
                onChange={(event) =>
                  setNewAccount({ ...newAccount, accountId: event.target.value })
                }
                placeholder="Account ID"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addAdAccount}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
              >
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {adAccounts.map((account, index) => (
                <div
                  key={`${account.id}-${account.accountId}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_110px_120px_96px_110px] gap-3 items-center bg-gray-800 rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {account.accountName || account.accountId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {account.platform} · {account.accountId}
                    </p>
                  </div>
                  <span className="text-sm text-gray-300">{account.currency}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full text-center ${
                      accountStatus(account).className
                    }`}
                  >
                    {accountStatus(account).label}
                  </span>
                  <button
                    type="button"
                    onClick={() => syncAdAccount(account.accountId)}
                    disabled={!account.windsorConnected || syncingAccountId === account.accountId}
                    className="bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-40 text-indigo-300 rounded-lg py-2 text-xs"
                  >
                    {syncingAccountId === account.accountId ? 'Sync...' : 'Sync'}
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnectAdAccount(account.id)}
                    className="bg-gray-900 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-xs"
                  >
                    Desconectar
                  </button>
                </div>
              ))}

              {adAccounts.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
                  Nenhuma conta adicionada ainda.
                </div>
              )}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              Windsor.ai
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  windsorConfigured
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {windsorConfigured ? 'Conectado' : 'Pendente'}
              </span>
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                A chave da Windsor fica protegida no servidor. Esta tela mostra apenas o status
                da integracao.
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                  Intervalo de sincronizacao
                </label>
                <select
                  value={syncInterval}
                  onChange={(event) => setSyncInterval(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="5">A cada 5 minutos (Pro)</option>
                  <option value="15">A cada 15 minutos</option>
                  <option value="60">A cada 1 hora</option>
                  <option value="1440">1x por dia</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              Meta Marketing API
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  metaConfigured
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {metaConfigured ? 'Conectado' : 'Pendente'}
              </span>
            </h2>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
              Use META_ACCESS_TOKEN para puxar anuncios, copies, criativos, status e metricas de
              video direto da Meta.
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              Claude AI (Anthropic)
              {anthropicConfigured ? (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">
                  Conectado
                </span>
              ) : (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full ml-1">
                  Nao configurado
                </span>
              )}
            </h2>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
              A analise usa regras internas do MVP e pode usar Claude quando a chave Anthropic
              estiver configurada no servidor.
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold">Regras de alertas</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Motor inicial da Fase 2 com 12 regras automáticas.
                </p>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
                {alertRules.filter((rule) => rule.isActive).length}/{alertRules.length} ativas
              </span>
            </div>

            <div className="space-y-3">
              {alertRules.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
                  Carregando regras de alerta...
                </div>
              )}

              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_110px_96px_64px] gap-3 items-center bg-gray-800 rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{rule.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${severityTone(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{rule.metric}</p>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Limite
                    </label>
                    <input
                      type="number"
                      value={rule.threshold ?? 0}
                      onChange={(event) =>
                        updateRule(rule.id, { threshold: Number(event.target.value) })
                      }
                      step="0.1"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Cooldown
                    </label>
                    <input
                      type="number"
                      value={rule.cooldownHours}
                      onChange={(event) =>
                        updateRule(rule.id, { cooldownHours: Number(event.target.value) })
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => updateRule(rule.id, { notifyEmail: !rule.notifyEmail })}
                    className={`h-10 rounded-lg text-xs font-medium transition-colors ${
                      rule.notifyEmail
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-900 text-gray-500'
                    }`}
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() => updateRule(rule.id, { isActive: !rule.isActive })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      rule.isActive ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                    aria-label={`Alternar regra ${rule.name}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        rule.isActive ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Notificacoes e relatorios</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm font-medium">Alertas criticos por email</p>
                  <p className="text-xs text-gray-400">Receba emails quando houver alertas criticos</p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    emailAlerts ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      emailAlerts ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm font-medium">Relatorio semanal automatico</p>
                  <p className="text-xs text-gray-400">Envio automatico toda semana por email</p>
                </div>
                <button
                  onClick={() => setEmailReport(!emailReport)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    emailReport ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      emailReport ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {emailReport && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">
                    Dia do relatorio semanal
                  </label>
                  <select
                    value={reportDay}
                    onChange={(event) => setReportDay(event.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="monday">Segunda-feira</option>
                    <option value="tuesday">Terca-feira</option>
                    <option value="friday">Sexta-feira</option>
                    <option value="sunday">Domingo</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Outras configuracoes uteis</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
              <div className="bg-gray-800 rounded-lg p-3">Janela padrao do dashboard</div>
              <div className="bg-gray-800 rounded-lg p-3">Metas de CPA, ROAS e compras</div>
              <div className="bg-gray-800 rounded-lg p-3">Mapeamento de eventos/purchases</div>
              <div className="bg-gray-800 rounded-lg p-3">Permissoes por cliente/equipe</div>
              <div className="bg-gray-800 rounded-lg p-3">Conexoes multi-conta Facebook</div>
              <div className="bg-gray-800 rounded-lg p-3">Preferencias de relatorio PDF</div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/40 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Plano Atual: <span className="text-indigo-300">Free</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  1 conta de anuncio · Sync manual · 7 dias de historico
                </p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shrink-0">
                Upgrade para Pro
                <br />
                <span className="text-indigo-200 font-normal text-xs">€39/mes</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
