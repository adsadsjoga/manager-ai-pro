'use client'

import { useEffect, useState } from 'react'

type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

type Lead = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  sourceCampaignName: string | null
  sourcePlatform: string | null
  estimatedValue: number | null
  stage: string
  extraData: { notes?: string } | null
  createdAt: string
  updatedAt: string
}

type LeadsResponse = {
  success: boolean
  leads?: Lead[]
  lead?: Lead
  error?: string
}

const stages: { key: Stage; label: string; color: string; bg: string; border: string }[] = [
  { key: 'new', label: 'Novo lead', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { key: 'contacted', label: 'Contactado', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { key: 'qualified', label: 'Qualificado', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'proposal', label: 'Proposta', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { key: 'won', label: 'Fechado', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { key: 'lost', label: 'Perdido', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function leadNotes(lead: Lead) {
  return lead.extraData?.notes || ''
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Lead | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    sourceCampaignName: '',
    sourcePlatform: 'Facebook',
    estimatedValue: '0',
    notes: '',
  })

  useEffect(() => {
    let active = true

    fetch('/api/crm/leads')
      .then((res) => res.json() as Promise<LeadsResponse>)
      .then((data) => {
        if (!active) return
        if (data.success) setLeads(data.leads || [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const getLeads = (stage: Stage) => leads.filter((lead) => lead.stage === stage)
  const totalValue = leads
    .filter((lead) => lead.stage === 'won')
    .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
  const pipelineValue = leads
    .filter((lead) => !['won', 'lost'].includes(lead.stage))
    .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)

  async function createLead() {
    const res = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        ...form,
        estimatedValue: Number(form.estimatedValue),
      }),
    })
    const data = (await res.json()) as LeadsResponse

    if (data.success && data.lead) {
      setLeads((current) => [data.lead as Lead, ...current])
      setSelected(data.lead)
      setShowForm(false)
      setForm({
        name: '',
        email: '',
        phone: '',
        sourceCampaignName: '',
        sourcePlatform: 'Facebook',
        estimatedValue: '0',
        notes: '',
      })
    }
  }

  async function updateLead(id: string, update: Partial<Lead> & { notes?: string }) {
    const previous = leads
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              ...update,
              extraData:
                update.notes !== undefined
                  ? { ...(lead.extraData || {}), notes: update.notes }
                  : lead.extraData,
            }
          : lead
      )
    )

    const res = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, ...update }),
    })
    const data = (await res.json()) as LeadsResponse

    if (data.success && data.lead) {
      setLeads((current) =>
        current.map((lead) => (lead.id === id ? (data.lead as Lead) : lead))
      )
      setSelected((current) => (current?.id === id ? (data.lead as Lead) : current))
    } else {
      setLeads(previous)
    }
  }

  async function deleteLead(id: string) {
    setLeads((current) => current.filter((lead) => lead.id !== id))
    setSelected(null)

    await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
  }

  function onDrop(stage: Stage) {
    if (!dragging) return
    void updateLead(dragging, { stage })
    setDragging(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Carregando CRM...
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
            { label: '🎬 Criativos', href: '/dashboard/creatives' },
            { label: '🧠 Diagnóstico IA', href: '/dashboard/diagnosis' },
            { label: '✅ Recomendações', href: '/dashboard/recommendations' },
            { label: '🔔 Alertas', href: '/dashboard/alerts' },
            { label: '📄 Relatorios', href: '/dashboard/reports' },
            { label: '👥 CRM', href: '/dashboard/crm', active: true },
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
            </a>
          ))}
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">CRM de Leads</h1>
            <p className="text-gray-400 text-sm mt-1">{leads.length} leads no pipeline</p>
          </div>
          <button
            onClick={() => setShowForm((current) => !current)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Novo Lead
          </button>
        </div>

        {showForm && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-4 gap-3">
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Nome"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="Email"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="Telefone"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.estimatedValue}
                onChange={(event) => setForm({ ...form, estimatedValue: event.target.value })}
                placeholder="Valor"
                type="number"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.sourceCampaignName}
                onChange={(event) =>
                  setForm({ ...form, sourceCampaignName: event.target.value })
                }
                placeholder="Campanha de origem"
                className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.sourcePlatform}
                onChange={(event) => setForm({ ...form, sourcePlatform: event.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Messenger">Messenger</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
              <button
                onClick={createLead}
                className="bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
              >
                Criar lead
              </button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total de leads', value: String(leads.length), color: 'text-white' },
            {
              label: 'Em negociacao',
              value: String(leads.filter((lead) => !['won', 'lost'].includes(lead.stage)).length),
              color: 'text-indigo-400',
            },
            { label: 'Valor no pipeline', value: formatMoney(pipelineValue), color: 'text-yellow-400' },
            { label: 'Receita fechada', value: formatMoney(totalValue), color: 'text-green-400' },
          ].map((metric) => (
            <div key={metric.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{metric.label}</p>
              <p className={`text-xl font-bold mt-1 ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className="flex-shrink-0 w-64"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(stage.key)}
            >
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${stage.bg} border ${stage.border}`}>
                <span className={`text-sm font-medium ${stage.color}`}>{stage.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                  {getLeads(stage.key).length}
                </span>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {getLeads(stage.key).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                    className={`bg-gray-900 border rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-all ${
                      selected?.id === lead.id
                        ? 'border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {(lead.name || '?').charAt(0)}
                      </div>
                      <span className="text-xs text-gray-500">{lead.sourcePlatform || 'Meta'}</span>
                    </div>
                    <p className="font-medium text-sm">{lead.name || 'Sem nome'}</p>
                    <p className="text-gray-400 text-xs truncate">{lead.email || '-'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-green-400 text-xs font-medium">
                        {formatMoney(lead.estimatedValue || 0)}
                      </span>
                      <span className="text-gray-500 text-xs">{formatDate(lead.createdAt)}</span>
                    </div>
                    {leadNotes(lead) && (
                      <p className="text-xs text-gray-500 mt-1 italic truncate">
                        &quot;{leadNotes(lead)}&quot;
                      </p>
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

        {selected && (
          <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Detalhes do Lead</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">
                Fechar
              </button>
            </div>

            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {(selected.name || '?').charAt(0)}
            </div>
            <p className="text-center font-semibold text-lg">{selected.name}</p>
            <p className="text-center text-gray-400 text-sm">{selected.email || '-'}</p>
            {selected.phone && <p className="text-center text-gray-400 text-sm">{selected.phone}</p>}

            <div className="mt-6 space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Origem</p>
                <p className="text-sm font-medium mt-1">
                  {selected.sourceCampaignName || 'Origem manual'}
                </p>
                <p className="text-xs text-gray-500">{selected.sourcePlatform || 'Meta'}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Valor estimado</p>
                <p className="text-green-400 font-bold text-lg">
                  {formatMoney(selected.estimatedValue || 0)}
                </p>
              </div>
              <textarea
                value={leadNotes(selected)}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    extraData: { ...(selected.extraData || {}), notes: event.target.value },
                  })
                }
                onBlur={(event) => updateLead(selected.id, { notes: event.target.value })}
                placeholder="Notas"
                className="w-full min-h-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6">
              <p className="text-gray-400 text-xs mb-2">Mover para:</p>
              <div className="grid grid-cols-2 gap-2">
                {stages
                  .filter((stage) => stage.key !== selected.stage)
                  .map((stage) => (
                    <button
                      key={stage.key}
                      onClick={() => updateLead(selected.id, { stage: stage.key })}
                      className={`text-xs px-2 py-2 rounded-lg border ${stage.border} ${stage.bg} ${stage.color} hover:opacity-80`}
                    >
                      {stage.label}
                    </button>
                  ))}
              </div>
            </div>

            <button
              onClick={() => deleteLead(selected.id)}
              className="mt-6 w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2 text-sm"
            >
              Excluir lead
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
