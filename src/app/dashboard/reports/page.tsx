'use client'
import { useState } from 'react'

const reports = [
  { id: '1', name: 'Relatório Semanal — Semana 22', type: 'weekly', period: '26/05 – 01/06/2026', status: 'ready', size: '1.2 MB', createdAt: 'Hoje, 08:00' },
  { id: '2', name: 'Relatório Mensal — Maio 2026', type: 'monthly', period: '01/05 – 31/05/2026', status: 'ready', size: '3.8 MB', createdAt: 'Ontem, 07:00' },
  { id: '3', name: 'Relatório Diário — 02/06/2026', type: 'daily', period: '02/06/2026', status: 'ready', size: '0.4 MB', createdAt: '02/06, 23:59' },
  { id: '4', name: 'Relatório Semanal — Semana 21', type: 'weekly', period: '19/05 – 25/05/2026', status: 'ready', size: '1.1 MB', createdAt: '26/05, 08:00' },
  { id: '5', name: 'Relatório Mensal — Abril 2026', type: 'monthly', period: '01/04 – 30/04/2026', status: 'ready', size: '4.1 MB', createdAt: '01/05, 07:00' },
]

const metrics = {
  spend: 3842.50,
  revenue: 12650.00,
  roas: 3.29,
  leads: 147,
  purchases: 43,
  ctr: 1.87,
  cpc: 2.14,
  cpm: 38.20,
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  daily:   { label: 'Diário',   color: 'text-blue-400',   bg: 'bg-blue-500/20',   icon: '📅' },
  weekly:  { label: 'Semanal',  color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '📆' },
  monthly: { label: 'Mensal',   color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: '🗓️' },
  custom:  { label: 'Customizado', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '⚙️' },
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedType, setSelectedType] = useState('weekly')
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo] = useState('2026-06-03')

  function handleGenerate() {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 2000)
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
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatórios', href: '/dashboard/reports', active: true },
            { label: '👥 CRM', href: '/dashboard/crm' },
            { label: '⚙️ Configurações', href: '/dashboard/settings' },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                {item.active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
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

      {/* Main */}
      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-gray-400 text-sm mt-1">Gere e exporte relatórios das suas campanhas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Gerador de relatório */}
          <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              ⚡ Gerar Relatório
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {['daily','weekly','monthly','custom'].map(t => (
                    <button key={t} onClick={() => setSelectedType(t)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border
                        ${selectedType === t
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                      {typeConfig[t].icon} {typeConfig[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Período</label>
                <div className="space-y-2">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Formato</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { fmt: 'PDF', icon: '📕' },
                    { fmt: 'Excel', icon: '📗' },
                    { fmt: 'Link', icon: '🔗' },
                  ].map(f => (
                    <button key={f.fmt}
                      className="py-2 px-2 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                      {f.icon} {f.fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {generating ? (
                  <><span className="animate-spin">⏳</span> Gerando...</>
                ) : generated ? (
                  <><span>✅</span> Gerado com sucesso!</>
                ) : (
                  <><span>📄</span> Gerar Relatório</>
                )}
              </button>

              {generated && (
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-sm text-green-300 text-center">
                  Relatório pronto! Clique em baixar.
                  <button className="block w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-medium transition-colors">
                    ⬇️ Baixar PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview do relatório */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">📊 Preview — Maio 2026</h2>

            {/* Header do relatório */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/30 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Retro Mundial Ads</h3>
                  <p className="text-gray-400 text-sm">Relatório de Performance — Maio 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Gerado em</p>
                  <p className="text-sm font-medium">03/06/2026</p>
                </div>
              </div>
            </div>

            {/* Métricas do relatório */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Investimento', value: `€${metrics.spend.toLocaleString('pt-PT', {minimumFractionDigits:2})}` },
                { label: 'Receita', value: `€${metrics.revenue.toLocaleString('pt-PT', {minimumFractionDigits:2})}` },
                { label: 'ROAS', value: `${metrics.roas}x` },
                { label: 'Leads', value: String(metrics.leads) },
              ].map(m => (
                <div key={m.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">{m.label}</p>
                  <p className="font-bold mt-1">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'CTR', value: `${metrics.ctr}%` },
                { label: 'CPC', value: `€${metrics.cpc}` },
                { label: 'CPM', value: `€${metrics.cpm}` },
                { label: 'Compras', value: String(metrics.purchases) },
              ].map(m => (
                <div key={m.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">{m.label}</p>
                  <p className="font-bold mt-1">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Análise IA no relatório */}
            <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span>🤖</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-300">Análise de IA</p>
                  <p className="text-xs text-gray-300 mt-1">
                    A conta teve ROAS geral de 3.29x no período, acima da média do setor (2.5x).
                    A campanha de Remarketing foi a grande destaque com ROAS 5.2x.
                    Recomenda-se pausar &quot;Tráfego - Blog&quot; e realocar o budget para Remarketing.
                    Potencial de aumentar receita em ~€3.200/mês com os ajustes sugeridos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de relatórios */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">📁 Histórico de Relatórios</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                {['Nome', 'Tipo', 'Período', 'Tamanho', 'Gerado em', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const cfg = typeConfig[r.type]
                return (
                  <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.period}</td>
                    <td className="px-4 py-3 text-gray-400">{r.size}</td>
                    <td className="px-4 py-3 text-gray-400">{r.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 px-3 py-1 rounded text-xs transition-colors">
                          ⬇️ PDF
                        </button>
                        <button className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1 rounded text-xs transition-colors">
                          📊 Excel
                        </button>
                        <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs transition-colors">
                          🔗 Link
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
