'use client'
import { useState } from 'react'

const allAlerts = [
  { id: '1', type: 'critical', campaign: 'Retro - Tráfego - Blog', title: 'Frequência alta: 3.8', message: 'Seu público está vendo o anúncio muitas vezes. Risco de fadiga criativa e aumento de CPM.', metric: 'Frequência: 3.8', time: 'Há 12 minutos', read: false },
  { id: '2', type: 'opportunity', campaign: 'Retro - Remarketing', title: 'Oportunidade de escala! ROAS 5.2x', message: 'Esta campanha está performando muito bem. Considere aumentar o orçamento em 20-30%.', metric: 'ROAS: 5.2x', time: 'Há 1 hora', read: false },
  { id: '3', type: 'warning', campaign: 'Retro - Prospecting - Frio', title: 'CTR baixo: 0.9%', message: 'O CTR está abaixo do mínimo recomendado de 1%. Considere trocar o criativo ou revisar o público.', metric: 'CTR: 0.9%', time: 'Há 2 horas', read: false },
  { id: '4', type: 'warning', campaign: 'Retro - Tráfego - Blog', title: 'ROAS baixo: 1.2x', message: 'Para cada R$1 investido, está retornando apenas R$1.20. Revise o público e o criativo.', metric: 'ROAS: 1.2x | Gasto: R$640', time: 'Há 3 horas', read: true },
  { id: '5', type: 'critical', campaign: 'Retro - Prospecting - Frio', title: 'CPA subiu 45%', message: 'O custo por aquisição subiu 45% em relação à semana passada. Possível saturação de público.', metric: 'CPA: R$134 → R$194', time: 'Há 5 horas', read: true },
  { id: '6', type: 'info', campaign: 'Retro - Conversão - Camisetas', title: 'Conjunto vencedor — considere duplicar', message: 'ROAS 4.1x, 68 leads e frequência saudável de 2.1. Candidato ideal para duplicação.', metric: 'ROAS: 4.1x | Freq: 2.1', time: 'Há 8 horas', read: true },
  { id: '7', type: 'info', campaign: 'Retro - Remarketing', title: 'ROAS recuperou: +38%', message: 'O ROAS desta campanha subiu de 3.8x para 5.2x. Bom momento para reinvestir.', metric: 'ROAS: 3.8x → 5.2x', time: 'Ontem', read: true },
  { id: '8', type: 'warning', campaign: 'Retro - Tráfego - Blog', title: 'CPM alto: R$31.90', message: 'O CPM está acima da média. Pode indicar competição alta no leilão ou público muito pequeno.', metric: 'CPM: R$31.90', time: 'Ontem', read: true },
]

const typeConfig = {
  critical: { color: 'border-l-red-500', bg: 'bg-red-500/10', badge: 'bg-red-500/20 text-red-400', icon: '🚨', label: 'Crítico' },
  warning:  { color: 'border-l-yellow-500', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400', icon: '⚠️', label: 'Atenção' },
  opportunity: { color: 'border-l-green-500', bg: 'bg-green-500/10', badge: 'bg-green-500/20 text-green-400', icon: '🚀', label: 'Oportunidade' },
  info:     { color: 'border-l-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400', icon: '💡', label: 'Info' },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(allAlerts)
  const [filter, setFilter] = useState('all')

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.read
    if (filter === 'critical') return a.type === 'critical'
    if (filter === 'warning') return a.type === 'warning'
    if (filter === 'opportunity') return a.type === 'opportunity'
    return true
  })

  const unreadCount = alerts.filter(a => !a.read).length

  function markRead(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🔔 Alertas', href: '/dashboard/alerts', active: true },
            { label: '📄 Relatórios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configurações', href: '/dashboard/settings' },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${(item as any).active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item.label}
              {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <div className="font-medium text-white mb-1">Retro Mundial Ads</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Windsor.ai conectado
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Alertas
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">{unreadCount} novos</span>
              )}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{filtered.length} alertas</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                ✓ Marcar todos como lidos
              </button>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Críticos', count: alerts.filter(a=>a.type==='critical').length, color: 'text-red-400', bg: 'border-red-800' },
            { label: 'Atenção', count: alerts.filter(a=>a.type==='warning').length, color: 'text-yellow-400', bg: 'border-yellow-800' },
            { label: 'Oportunidades', count: alerts.filter(a=>a.type==='opportunity').length, color: 'text-green-400', bg: 'border-green-800' },
            { label: 'Informativos', count: alerts.filter(a=>a.type==='info').length, color: 'text-blue-400', bg: 'border-blue-800' },
          ].map(s => (
            <div key={s.label} className={`bg-gray-900 border ${s.bg} rounded-xl p-4`}>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'unread', label: `🔴 Não lidos (${unreadCount})` },
            { key: 'critical', label: '🚨 Críticos' },
            { key: 'warning', label: '⚠️ Atenção' },
            { key: 'opportunity', label: '🚀 Oportunidades' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista de alertas */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-medium">Nenhum alerta aqui!</p>
              <p className="text-sm mt-1">Suas campanhas estão saudáveis.</p>
            </div>
          )}
          {filtered.map(alert => {
            const cfg = typeConfig[alert.type as keyof typeof typeConfig]
            return (
              <div key={alert.id}
                className={`border-l-4 ${cfg.color} ${cfg.bg} rounded-xl p-5 border border-gray-800
                  ${!alert.read ? 'ring-1 ring-indigo-500/30' : 'opacity-75'} transition-all`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-gray-400 text-xs">{alert.campaign}</span>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-indigo-400 rounded-full inline-block"></span>
                        )}
                      </div>
                      <h3 className="font-semibold mt-1.5">{alert.title}</h3>
                      <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          📊 {alert.metric}
                        </span>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!alert.read && (
                      <button onClick={() => markRead(alert.id)}
                        className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
                        Marcar lido
                      </button>
                    )}
                    {alert.type === 'critical' && (
                      <button className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                        ⏸ Pausar campanha
                      </button>
                    )}
                    {alert.type === 'opportunity' && (
                      <button className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg transition-colors">
                        📈 Escalar
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
