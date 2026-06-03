'use client'
import { useState } from 'react'

const mockMetrics = {
  spend: 3842.50,
  revenue: 12650.00,
  roas: 3.29,
  leads: 147,
  ctr: 1.87,
  cpc: 2.14,
  cpm: 38.20,
  purchases: 43,
}

const mockCampaigns = [
  { name: 'Retro - Conversão - Camisetas', spend: 1820, revenue: 7462, roas: 4.1, ctr: 2.3, cpc: 1.80, cpm: 41.4, leads: 68, purchases: 21, frequency: 2.1, health: 85 },
  { name: 'Retro - Tráfego - Blog',         spend: 640,  revenue: 768,  roas: 1.2, ctr: 1.1, cpc: 2.90, cpm: 31.9, leads: 22, purchases: 4,  frequency: 3.8, health: 42 },
  { name: 'Retro - Remarketing',            spend: 980,  revenue: 5096, roas: 5.2, ctr: 3.1, cpc: 1.40, cpm: 43.4, leads: 41, purchases: 15, frequency: 2.8, health: 92 },
  { name: 'Retro - Prospecting - Frio',     spend: 402,  revenue: 723,  roas: 1.8, ctr: 0.9, cpc: 2.80, cpm: 25.2, leads: 16, purchases: 3,  frequency: 1.4, health: 58 },
]

interface AIAnalysis {
  health_score: number
  summary: string
  alerts: string[]
  opportunities: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    campaign: string
    expected_impact: string
  }>
}

export default function DashboardPage() {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    await fetch('/api/sync')
    setTimeout(() => { setSyncing(false); setSynced(true) }, 1500)
  }

  async function handleAnalyze() {
  const confirm = window.confirm(
    '🤖 Analisar com Claude AI?\n\n' +
    'Isso vai usar tokens da sua conta Anthropic.\n' +
    'Custo estimado: ~R$0,01 (muito barato)\n\n' +
    'Deseja continuar?'
  )
  if (!confirm) return

  setAnalyzing(true)
  setAiError(null)
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaigns: mockCampaigns }),
    })
    const data = await res.json()
    if (data.success) {
      setAnalysis(data.analysis)
    } else {
      setAiError(data.error)
    }
  } catch (e: any) {
    setAiError(e.message)
  } finally {
    setAnalyzing(false)
  }
}
  const healthBg = (s: number) =>
    s >= 70 ? 'bg-green-400/10 text-green-400' : s >= 50 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'

  const priorityColor = (p: string) =>
    p === 'high' ? 'bg-red-500/20 text-red-400' : p === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard', active: true },
            { label: '📣 Campanhas', href: '/dashboard/campaigns' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatórios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configurações', href: '/dashboard/settings' },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${(item as any).active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item.label}
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

      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Retro Mundial Ads · Últimos 30 dias</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAnalyze} disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <span className={analyzing ? 'animate-spin' : ''}>🤖</span>
              {analyzing ? 'Analisando com IA...' : 'Analisar com IA'}
            </button>
            <button onClick={handleSync}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <span className={syncing ? 'animate-spin' : ''}>🔄</span>
              {syncing ? 'Sincronizando...' : synced ? '✅ Sincronizado' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Investimento', value: `R$${mockMetrics.spend.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, color: 'text-white' },
            { label: 'Receita', value: `R$${mockMetrics.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, color: 'text-green-400' },
            { label: 'ROAS', value: `${mockMetrics.roas}x`, color: 'text-yellow-400' },
            { label: 'Leads', value: String(mockMetrics.leads), color: 'text-indigo-400' },
            { label: 'CTR', value: `${mockMetrics.ctr}%`, color: 'text-white' },
            { label: 'CPC', value: `R$${mockMetrics.cpc}`, color: 'text-white' },
            { label: 'CPM', value: `R$${mockMetrics.cpm}`, color: 'text-white' },
            { label: 'Compras', value: String(mockMetrics.purchases), color: 'text-green-400' },
          ].map((m) => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{m.label}</p>
              <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Análise de IA */}
        {!analysis && !analyzing && (
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/40 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-300">Análise de IA disponível</h3>
                <p className="text-gray-300 text-sm mt-1">Clique em "Analisar com IA" para obter insights automáticos das suas campanhas com Claude.</p>
              </div>
              <button onClick={handleAnalyze}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
                Analisar agora
              </button>
            </div>
          </div>
        )}

        {analyzing && (
          <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-6 mb-8 text-center">
            <div className="text-3xl mb-2 animate-pulse">🤖</div>
            <p className="text-purple-300 font-medium">Claude está analisando suas campanhas...</p>
            <p className="text-gray-400 text-sm mt-1">Isso leva apenas alguns segundos</p>
          </div>
        )}

        {aiError && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-8 text-red-300 text-sm">
            ❌ Erro na análise: {aiError}
          </div>
        )}

        {analysis && (
          <div className="bg-gray-900 border border-purple-700/40 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                🤖 Análise de IA — Claude
              </h2>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${scoreColor(analysis.health_score)}`}>
                  {analysis.health_score}/100
                </span>
                <span className="text-gray-400 text-xs">Score da conta</span>
                <button onClick={() => setAnalysis(null)} className="text-gray-500 hover:text-white text-xs ml-2">✕</button>
              </div>
            </div>

            <p className="text-gray-200 text-sm mb-4 bg-gray-800 rounded-lg p-3">{analysis.summary}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {analysis.alerts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">⚠️ Alertas</h4>
                  <ul className="space-y-1">
                    {analysis.alerts.map((a, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5 shrink-0">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.opportunities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">🚀 Oportunidades</h4>
                  <ul className="space-y-1">
                    {analysis.opportunities.map((o, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5 shrink-0">•</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">📋 Recomendações</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priorityColor(r.priority)}`}>
                        {r.priority === 'high' ? 'Urgente' : r.priority === 'medium' ? 'Médio' : 'Baixo'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.campaign} · {r.expected_impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabela de campanhas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold">📣 Campanhas</h2>
            <a href="/dashboard/campaigns" className="text-indigo-400 hover:text-indigo-300 text-sm">Ver todas →</a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['Campanha','Gasto','ROAS','CTR','Leads','Freq.','Saúde'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCampaigns.map((c, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[220px] truncate">{c.name}</td>
                  <td className="px-4 py-3">R${c.spend.toLocaleString('pt-BR')}</td>
                  <td className={`px-4 py-3 font-semibold ${c.roas >= 3 ? 'text-green-400' : c.roas >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>{c.roas}x</td>
                  <td className="px-4 py-3">{c.ctr}%</td>
                  <td className="px-4 py-3">{c.leads}</td>
                  <td className={`px-4 py-3 ${c.frequency > 3.5 ? 'text-red-400' : c.frequency > 2.5 ? 'text-yellow-400' : 'text-gray-300'}`}>{c.frequency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthBg(c.health)}`}>{c.health}/100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
