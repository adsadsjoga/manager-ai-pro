'use client'
import { useState, Fragment } from 'react'

const campaigns = [
  { id: '1', name: 'Retro - Conversão - Camisetas', objective: 'CONVERSIONS', status: 'ACTIVE', spend: 1820, revenue: 7462, roas: 4.1, ctr: 2.3, cpc: 1.80, cpm: 41.4, leads: 68, purchases: 21, frequency: 2.1, health: 85 },
  { id: '2', name: 'Retro - Tráfego - Blog', objective: 'TRAFFIC', status: 'ACTIVE', spend: 640, revenue: 768, roas: 1.2, ctr: 1.1, cpc: 2.90, cpm: 31.9, leads: 22, purchases: 4, frequency: 3.8, health: 42 },
  { id: '3', name: 'Retro - Remarketing', objective: 'CONVERSIONS', status: 'ACTIVE', spend: 980, revenue: 5096, roas: 5.2, ctr: 3.1, cpc: 1.40, cpm: 43.4, leads: 41, purchases: 15, frequency: 2.8, health: 92 },
  { id: '4', name: 'Retro - Prospecting - Frio', objective: 'CONVERSIONS', status: 'PAUSED', spend: 402, revenue: 723.6, roas: 1.8, ctr: 0.9, cpc: 2.80, cpm: 25.2, leads: 16, purchases: 3, frequency: 1.4, health: 58 },
]

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-gray-500/20 text-gray-400',
}

const objectiveLabel: Record<string, string> = {
  CONVERSIONS: 'Conversão',
  TRAFFIC: 'Tráfego',
  LEAD_GENERATION: 'Leads',
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = campaigns.filter(c => {
    if (filter === 'active' && c.status !== 'ACTIVE') return false
    if (filter === 'paused' && c.status !== 'PAUSED') return false
    if (filter === 'low_roas' && c.roas >= 2) return false
    if (filter === 'opportunity' && c.roas < 4) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const healthBg = (s: number) =>
    s >= 70 ? 'bg-green-400/10 text-green-400' : s >= 50 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'

  const roasColor = (r: number) =>
    r >= 3 ? 'text-green-400' : r >= 1.5 ? 'text-yellow-400' : 'text-red-400'

  const selectedCampaign = campaigns.find(c => c.id === selected)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="text-xl font-bold text-indigo-400 mb-8">⚡ Ads Manager AI</div>
        <nav className="space-y-1">
          {[
            { label: '📊 Dashboard', href: '/dashboard' },
            { label: '📣 Campanhas', href: '/dashboard/campaigns', active: true },
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-gray-400 text-sm mt-1">{filtered.length} campanhas encontradas</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            🔄 Sincronizar
          </button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Buscar campanha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-64"
          />
          {[
            { key: 'all', label: 'Todas' },
            { key: 'active', label: '🟢 Ativas' },
            { key: 'paused', label: '⏸ Pausadas' },
            { key: 'low_roas', label: '🔴 ROAS Baixo' },
            { key: 'opportunity', label: '🚀 Oportunidade' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total investido', value: `R$${campaigns.reduce((s,c)=>s+c.spend,0).toLocaleString('pt-BR')}` },
            { label: 'Receita total', value: `R$${campaigns.reduce((s,c)=>s+c.revenue,0).toLocaleString('pt-BR', {minimumFractionDigits:2})}` },
            { label: 'ROAS médio', value: `${(campaigns.reduce((s,c)=>s+c.roas,0)/campaigns.length).toFixed(2)}x` },
            { label: 'Total de leads', value: String(campaigns.reduce((s,c)=>s+c.leads,0)) },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{m.label}</p>
              <p className="text-xl font-bold mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr>
                {['Campanha', 'Status', 'Gasto', 'Receita', 'ROAS', 'CTR', 'Leads', 'Freq.', 'Saúde', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(selected === c.id ? null : c.id)}>
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[180px] truncate">{c.name}</div>
                      <div className="text-xs text-gray-500">{objectiveLabel[c.objective] || c.objective}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                        {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">R${c.spend.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-green-400">R${c.revenue.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                    <td className={`px-4 py-3 font-bold ${roasColor(c.roas)}`}>{c.roas}x</td>
                    <td className="px-4 py-3">{c.ctr}%</td>
                    <td className="px-4 py-3">{c.leads}</td>
                    <td className={`px-4 py-3 font-medium ${c.frequency > 3.5 ? 'text-red-400' : c.frequency > 2.5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {c.frequency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${healthBg(c.health)}`}>{c.health}/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1 rounded text-xs transition-colors">
                          ⏸ Pausar
                        </button>
                        <button className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-2 py-1 rounded text-xs transition-colors">
                          📈 Escalar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selected === c.id && (
                    <tr className="border-t border-indigo-700/30">
                      <td colSpan={10} className="px-4 py-4 bg-indigo-900/10">
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { label: 'CPC', value: `R$${c.cpc}` },
                            { label: 'CPM', value: `R$${c.cpm}` },
                            { label: 'Compras', value: String(c.purchases) },
                            { label: 'Custo/Lead', value: `R$${(c.spend / c.leads).toFixed(2)}` },
                            { label: 'Custo/Compra', value: `R$${(c.spend / (c.purchases || 1)).toFixed(2)}` },
                          ].map(m => (
                            <div key={m.label} className="bg-gray-800 rounded-lg p-3 text-center">
                              <p className="text-gray-400 text-xs">{m.label}</p>
                              <p className="font-bold mt-1 text-sm">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
