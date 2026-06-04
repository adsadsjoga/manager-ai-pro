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
}

const typeConfig = {
  critical: {
    color: 'border-l-red-500',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400',
    icon: '🚨',
    label: 'Critico',
  },
  warning: {
    color: 'border-l-yellow-500',
    bg: 'bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-400',
    icon: '⚠️',
    label: 'Atencao',
  },
  opportunity: {
    color: 'border-l-green-500',
    bg: 'bg-green-500/10',
    badge: 'bg-green-500/20 text-green-400',
    icon: '🚀',
    label: 'Oportunidade',
  },
  info: {
    color: 'border-l-blue-500',
    bg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400',
    icon: '💡',
    label: 'Info',
  },
}

function formatMetricValue(value: number | string) {
  return typeof value === 'number' ? value.toFixed(2) : value
}

function formatMetrics(metrics: AlertItem['metrics']) {
  if (!metrics) return 'Sem metricas'

  return Object.entries(metrics)
    .map(([key, value]) => `${key}: ${formatMetricValue(value)}`)
    .join(' | ')
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
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
        if (!active) return

        if (data.success) {
          setAlerts(data.alerts)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
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

  async function markRead(id: string) {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, isRead: true } : alert))
    )

    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', id }),
    })
  }

  async function markAllRead() {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })))

    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' }),
    })
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
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>

        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🔔 Alertas', href: '/dashboard/alerts', active: true },
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
              {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <div className="font-medium text-white mb-1">Guia do Volante</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Windsor.ai conectado
            </div>
          </div>
        </div>
      </div>

      <div className="ml-64 p-8">
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
              {filtered.length} alertas inteligentes salvos
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              ✓ Marcar todos como lidos
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Criticos',
              count: alerts.filter((alert) => alert.severity === 'critical').length,
              color: 'text-red-400',
              bg: 'border-red-800',
            },
            {
              label: 'Atencao',
              count: alerts.filter((alert) => alert.severity === 'warning').length,
              color: 'text-yellow-400',
              bg: 'border-yellow-800',
            },
            {
              label: 'Oportunidades',
              count: alerts.filter((alert) => alert.severity === 'opportunity').length,
              color: 'text-green-400',
              bg: 'border-green-800',
            },
            {
              label: 'Informativos',
              count: alerts.filter((alert) => alert.severity === 'info').length,
              color: 'text-blue-400',
              bg: 'border-blue-800',
            },
          ].map((item) => (
            <div key={item.label} className={`bg-gray-900 border ${item.bg} rounded-xl p-4`}>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{item.label}</p>
              <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.count}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'unread', label: `🔴 Nao lidos (${unreadCount})` },
            { key: 'critical', label: '🚨 Criticos' },
            { key: 'warning', label: '⚠️ Atencao' },
            { key: 'opportunity', label: '🚀 Oportunidades' },
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

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-medium">Nenhum alerta aqui.</p>
              <p className="text-sm mt-1">
                Rode a analise no dashboard para gerar alertas automaticos.
              </p>
            </div>
          )}

          {filtered.map((alert) => {
            const cfg = typeConfig[alert.severity] || typeConfig.info

            return (
              <div
                key={alert.id}
                className={`border-l-4 ${cfg.color} ${cfg.bg} rounded-xl p-5 border border-gray-800 ${
                  !alert.isRead ? 'ring-1 ring-indigo-500/30' : 'opacity-75'
                } transition-all`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {alert.campaignName || 'Conta'}
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 bg-indigo-400 rounded-full inline-block"></span>
                        )}
                      </div>

                      <h3 className="font-semibold mt-1.5">{alert.title}</h3>
                      <p className="text-gray-300 text-sm mt-1">{alert.message}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          📊 {formatMetrics(alert.metrics)}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {!alert.isRead && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Marcar lido
                      </button>
                    )}

                    {alert.severity === 'critical' && (
                      <button className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                        Pausar campanha
                      </button>
                    )}

                    {alert.severity === 'opportunity' && (
                      <button className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg transition-colors">
                        Escalar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
