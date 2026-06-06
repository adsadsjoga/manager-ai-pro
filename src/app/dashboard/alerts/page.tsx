'use client'

import { useEffect, useState } from 'react'

type AlertSeverity = 'critical' | 'warning' | 'opportunity' | 'info'

type AlertItem = {
  id: string
  alertType: string
  severity: AlertSeverity
  title: string | null
  message: string | null
  metrics: Record<string, number | string> | null
  campaignName: string | null
  isRead: boolean
  createdAt: string
  adAccount?: {
    accountName: string | null
    accountId: string
  }
}

const typeConfig = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-300',
    label: 'Critico',
  },
  warning: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-300',
    label: 'Atencao',
  },
  opportunity: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/10',
    badge: 'bg-green-500/20 text-green-300',
    label: 'Oportunidade',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-300',
    label: 'Info',
  },
}

function formatMetricValue(value: number | string) {
  return typeof value === 'number' ? value.toFixed(2) : value
}

function formatMetrics(metrics: AlertItem['metrics']) {
  if (!metrics) return 'Sem metricas'

  return Object.entries(metrics)
    .filter(([key]) => !['notifyEmail', 'emailSent', 'emailStatus'].includes(key))
    .map(([key, value]) => `${key}: ${formatMetricValue(value)}`)
    .join(' | ')
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function dayLabel(date: string) {
  const alertDate = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const dayKey = alertDate.toISOString().slice(0, 10)
  if (dayKey === today.toISOString().slice(0, 10)) return 'Hoje'
  if (dayKey === yesterday.toISOString().slice(0, 10)) return 'Ontem'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(alertDate)
}

function alertGroupLabel(alert: AlertItem) {
  const accountName = alert.adAccount?.accountName || alert.adAccount?.accountId || 'Conta'
  const campaignName = alert.campaignName || 'Conta geral'
  return `${accountName} / ${campaignName}`
}

function groupAlerts(alerts: AlertItem[]) {
  return alerts.reduce<Record<string, Record<string, AlertItem[]>>>((acc, alert) => {
    const day = dayLabel(alert.createdAt)
    const group = alertGroupLabel(alert)

    acc[day] ||= {}
    acc[day][group] ||= []
    acc[day][group].push(alert)

    return acc
  }, {})
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) setAlerts(data.alerts)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.isRead
    if (filter === 'critical') return alert.severity === 'critical'
    if (filter === 'warning') return alert.severity === 'warning'
    if (filter === 'opportunity') return alert.severity === 'opportunity'
    return true
  })
  const unreadCount = alerts.filter((alert) => !alert.isRead).length
  const groupedAlerts = groupAlerts(filtered)

  async function patchAlerts(action: string, id?: string) {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
  }

  async function markRead(id: string) {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, isRead: true } : alert))
    )
    await patchAlerts('mark-read', id)
  }

  async function markAllRead() {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })))
    await patchAlerts('mark-all-read')
  }

  async function resolveAlert(id: string) {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
    await patchAlerts('resolve', id)
  }

  async function resolveAll() {
    setAlerts([])
    await patchAlerts('resolve-all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando alertas...
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
            { label: 'Shopify', href: '/dashboard/shopify' },
            { label: 'Diagnostico IA', href: '/dashboard/diagnosis' },
            { label: 'Recomendacoes', href: '/dashboard/recommendations' },
            { label: 'Alertas', href: '/dashboard/alerts', active: true },
            { label: 'Relatorios', href: '/dashboard/reports' },
            { label: 'CRM', href: '/dashboard/crm' },
            { label: 'Configuracoes', href: '/dashboard/settings' },
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
              {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Alertas
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
                  {unreadCount} novos
                </span>
              )}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Agrupados por dia, empresa e campanha para facilitar a acao.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="border border-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50"
            >
              Marcar todos como lidos
            </button>
            <button
              onClick={resolveAll}
              disabled={alerts.length === 0}
              className="bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50"
            >
              Resolver todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            ['Criticos', 'critical', 'text-red-400', 'border-red-800'],
            ['Atencao', 'warning', 'text-yellow-400', 'border-yellow-800'],
            ['Oportunidades', 'opportunity', 'text-green-400', 'border-green-800'],
            ['Informativos', 'info', 'text-blue-400', 'border-blue-800'],
          ].map(([label, severity, color, border]) => (
            <div key={label} className={`bg-gray-900 border ${border} rounded-xl p-4`}>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>
                {alerts.filter((alert) => alert.severity === severity).length}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'unread', label: `Nao lidos (${unreadCount})` },
            { key: 'critical', label: 'Criticos' },
            { key: 'warning', label: 'Atencao' },
            { key: 'opportunity', label: 'Oportunidades' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === item.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 py-16 text-center text-gray-400">
            <p className="font-medium">Nenhum alerta aqui.</p>
            <p className="text-sm mt-1">Rode a analise no dashboard para gerar alertas automaticos.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAlerts).map(([day, groups]) => (
              <section key={day} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{day}</h2>
                  <span className="h-px flex-1 bg-gray-800" />
                </div>

                {Object.entries(groups).map(([group, groupAlerts]) => (
                  <div key={group} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/40 px-5 py-3">
                      <div>
                        <h3 className="font-semibold">{group}</h3>
                        <p className="text-xs text-gray-400">
                          {groupAlerts.length} alerta(s) nesta empresa/campanha
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-950 px-3 py-1 text-xs text-gray-300">
                        {groupAlerts.filter((alert) => !alert.isRead).length} novo(s)
                      </span>
                    </div>

                    <div className="divide-y divide-gray-800">
                      {groupAlerts.map((alert) => {
                        const cfg = typeConfig[alert.severity] || typeConfig.info

                        return (
                          <div
                            key={alert.id}
                            className={`border-l-4 ${cfg.border} ${cfg.bg} p-5 ${
                              !alert.isRead ? 'ring-1 ring-indigo-500/20' : 'opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                                    {cfg.label}
                                  </span>
                                  {!alert.isRead && (
                                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200">
                                      novo
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">{formatTime(alert.createdAt)}</span>
                                </div>

                                <h4 className="font-semibold">{alert.title}</h4>
                                <p className="mt-1 text-sm text-gray-300">{alert.message}</p>
                                <p className="mt-3 inline-flex rounded-lg bg-gray-950/70 px-3 py-1 text-xs text-gray-400">
                                  {formatMetrics(alert.metrics)}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-col gap-2">
                                {!alert.isRead && (
                                  <button
                                    onClick={() => markRead(alert.id)}
                                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-500 hover:text-white"
                                  >
                                    Marcar lido
                                  </button>
                                )}
                                <button
                                  onClick={() => resolveAlert(alert.id)}
                                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700"
                                >
                                  Resolver
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
