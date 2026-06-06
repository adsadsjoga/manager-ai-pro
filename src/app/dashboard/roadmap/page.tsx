'use client'

import { DashboardSidebar } from '@/components/dashboard-sidebar'

const phases = [
  {
    title: 'Fase 1 - Core MVP',
    status: 'feito',
    items: ['Dashboard', 'sync manual', 'metricas principais', 'campanhas'],
  },
  {
    title: 'Fase 2 - Alertas',
    status: 'feito',
    items: ['motor de regras', 'alertas no painel', 'email via Resend'],
  },
  {
    title: 'Fase 3 - Multi-contas e Meta',
    status: 'feito',
    items: ['multi-contas Facebook', 'Meta API', 'criativos', 'troca de conta'],
  },
  {
    title: 'Fase 4 - Diagnostico IA',
    status: 'feito',
    items: ['diagnostico geral', 'copy', 'video', 'retencao', 'acoes sugeridas'],
  },
  {
    title: 'Fase 5 - Recomendacoes por campanha',
    status: 'feito',
    items: ['pausar', 'reduzir', 'testar criativo', 'escalar', 'monitorar'],
  },
  {
    title: 'Fase 6 - Previsao de orcamento',
    status: 'feito',
    items: ['projecao mensal', 'orcamento sugerido', 'cliques estimados', 'compras estimadas'],
  },
  {
    title: 'Fase 7 - Relatorios e exportacao',
    status: 'feito',
    items: ['relatorio compartilhavel', 'HTML imprimivel em PDF', 'exportacao CSV para planilhas'],
  },
  {
    title: 'Fase 8 - CRM operacional',
    status: 'feito',
    items: ['Kanban', 'lead manual', 'valor estimado', 'origem da campanha', 'notas'],
  },
  {
    title: 'Proximas fases externas',
    status: 'pendente',
    items: ['vendas reais via checkout', 'Stripe Billing', 'Google Ads', 'Google Sheets OAuth', 'app mobile'],
  },
]

function statusTone(status: string) {
  return status === 'feito'
    ? 'bg-green-500/20 text-green-300'
    : 'bg-yellow-500/20 text-yellow-300'
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="onboarding" />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Roadmap</h1>
          <p className="text-gray-400 text-sm mt-1">
            Controle do que ja foi entregue e do que ainda depende de integrações externas.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {phases.map((phase) => (
            <section key={phase.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{phase.title}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${statusTone(phase.status)}`}>
                  {phase.status}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {phase.items.map((item) => (
                  <li key={item} className="text-sm text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
