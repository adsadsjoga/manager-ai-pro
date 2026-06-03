'use client'
import { useState } from 'react'

type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  campaign: string
  platform: string
  value: number
  stage: Stage
  date: string
  notes?: string
}

const initialLeads: Lead[] = [
  { id: '1', name: 'Carlos Mendes', email: 'carlos@gmail.com', phone: '(11) 99999-1111', campaign: 'Retro - Conversão - Camisetas', platform: 'Instagram', value: 350, stage: 'new', date: 'Hoje, 14:32' },
  { id: '2', name: 'Ana Paula Silva', email: 'ana@hotmail.com', phone: '(21) 98888-2222', campaign: 'Retro - Remarketing', platform: 'Facebook', value: 520, stage: 'new', date: 'Hoje, 12:15' },
  { id: '3', name: 'Roberto Costa', email: 'roberto@empresa.com', phone: '(31) 97777-3333', campaign: 'Retro - Conversão - Camisetas', platform: 'Instagram', value: 280, stage: 'contacted', date: 'Ontem, 16:40' },
  { id: '4', name: 'Fernanda Lima', email: 'fernanda@gmail.com', campaign: 'Retro - Remarketing', platform: 'Facebook', value: 890, stage: 'contacted', date: 'Ontem, 10:20' },
  { id: '5', name: 'Marcos Oliveira', email: 'marcos@outlook.com', phone: '(41) 96666-5555', campaign: 'Retro - Conversão - Camisetas', platform: 'Instagram', value: 420, stage: 'qualified', date: '2 dias atrás' },
  { id: '6', name: 'Juliana Santos', email: 'juliana@gmail.com', phone: '(51) 95555-6666', campaign: 'Retro - Remarketing', platform: 'Facebook', value: 1200, stage: 'qualified', date: '2 dias atrás', notes: 'Interesse em kit completo' },
  { id: '7', name: 'Pedro Alves', email: 'pedro@empresa.com', campaign: 'Retro - Conversão - Camisetas', platform: 'Instagram', value: 650, stage: 'proposal', date: '3 dias atrás', notes: 'Proposta enviada: R$650' },
  { id: '8', name: 'Beatriz Rocha', email: 'beatriz@gmail.com', phone: '(62) 94444-7777', campaign: 'Retro - Remarketing', platform: 'Facebook', value: 980, stage: 'won', date: '4 dias atrás' },
  { id: '9', name: 'Diego Ferreira', email: 'diego@hotmail.com', campaign: 'Retro - Prospecting - Frio', platform: 'Facebook', value: 200, stage: 'lost', date: '5 dias atrás', notes: 'Achou caro' },
]

const stages: { key: Stage; label: string; color: string; bg: string; border: string }[] = [
  { key: 'new',       label: '🆕 Novo Lead',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  { key: 'contacted', label: '📞 Contactado',       color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { key: 'qualified', label: '✅ Qualificado',      color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'proposal',  label: '📄 Proposta Enviada', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { key: 'won',       label: '🏆 Fechado',          color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  { key: 'lost',      label: '❌ Perdido',          color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
]

const platformIcon: Record<string, string> = {
  Facebook: '🔵',
  Instagram: '🟣',
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const getLeads = (stage: Stage) => leads.filter(l => l.stage === stage)
  const totalValue = leads.filter(l => l.stage === 'won').reduce((s, l) => s + l.value, 0)
  const pipelineValue = leads.filter(l => !['won','lost'].includes(l.stage)).reduce((s, l) => s + l.value, 0)

  function moveLead(id: string, newStage: Stage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l))
    setSelected(prev => prev?.id === id ? { ...prev, stage: newStage } : prev)
  }

  function onDragStart(id: string) { setDragging(id) }
  function onDrop(stage: Stage) {
    if (dragging) { moveLead(dragging, stage); setDragging(null) }
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
            { label: '📄 Relatórios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm', active: true },
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

      {/* Main */}
      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">CRM de Leads</h1>
            <p className="text-gray-400 text-sm mt-1">{leads.length} leads no pipeline</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Novo Lead
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total de leads', value: String(leads.length), color: 'text-white' },
            { label: 'Em negociação', value: String(leads.filter(l=>!['won','lost'].includes(l.stage)).length), color: 'text-indigo-400' },
            { label: 'Valor no pipeline', value: `R$${pipelineValue.toLocaleString('pt-BR')}`, color: 'text-yellow-400' },
            { label: 'Receita fechada', value: `R$${totalValue.toLocaleString('pt-BR')}`, color: 'text-green-400' },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{m.label}</p>
              <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <div key={stage.key}
              className="flex-shrink-0 w-64"
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(stage.key)}>
              {/* Header da coluna */}
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${stage.bg} border ${stage.border}`}>
                <span className={`text-sm font-medium ${stage.color}`}>{stage.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                  {getLeads(stage.key).length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[200px]">
                {getLeads(stage.key).map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => onDragStart(lead.id)}
                    onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                    className={`bg-gray-900 border rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-all
                      ${selected?.id === lead.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-gray-800'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-500">{platformIcon[lead.platform]} {lead.platform}</span>
                    </div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-gray-400 text-xs truncate">{lead.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-green-400 text-xs font-medium">R${lead.value.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-500 text-xs">{lead.date}</span>
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic truncate">"{lead.notes}"</p>
                    )}
                  </div>
                ))}

                {getLeads(stage.key).length === 0 && (
                  <div className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center text-gray-600 text-xs">
                    Arraste leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Painel de detalhes do lead */}
        {selected && (
          <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Detalhes do Lead</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {selected.name.charAt(0)}
            </div>
            <p className="text-center font-semibold text-lg">{selected.name}</p>
            <p className="text-center text-gray-400 text-sm">{selected.email}</p>
            {selected.phone && <p className="text-center text-gray-400 text-sm">{selected.phone}</p>}

            <div className="mt-6 space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Origem</p>
                <p className="text-sm font-medium mt-1">{selected.campaign}</p>
                <p className="text-xs text-gray-500">{platformIcon[selected.platform]} {selected.platform}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Valor estimado</p>
                <p className="text-green-400 font-bold text-lg">R${selected.value.toLocaleString('pt-BR')}</p>
              </div>
              {selected.notes && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Notas</p>
                  <p className="text-sm mt-1">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-gray-400 text-xs mb-2">Mover para:</p>
              <div className="grid grid-cols-2 gap-2">
                {stages.filter(s => s.key !== selected.stage).map(s => (
                  <button key={s.key} onClick={() => moveLead(selected.id, s.key)}
                    className={`text-xs px-2 py-2 rounded-lg border ${s.border} ${s.bg} ${s.color} hover:opacity-80 transition-opacity`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
