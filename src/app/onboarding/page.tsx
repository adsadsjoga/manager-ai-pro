'use client'

import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

type OnboardingStatus = {
  success: boolean
  completed?: number
  total?: number
  progress?: number
  checks?: Record<string, boolean>
  counts?: Record<string, number>
  error?: string
}

type Step = {
  id: string
  title: string
  text: string
  href: string
  action: string
  countLabel?: (counts: Record<string, number>) => string
}

const setupSteps: Step[] = [
  {
    id: 'adAccount',
    title: 'Conta de anuncios',
    text: 'Conecte uma conta Meta/Facebook para separar dados por empresa.',
    href: '/dashboard/settings',
    action: 'Conectar conta',
    countLabel: (counts) => `${counts.connectedAccounts || 0} conta(s)`,
  },
  {
    id: 'syncedMetrics',
    title: 'Metricas de campanhas',
    text: 'Sincronize investimento, cliques, impressoes, CTR, CPC e eventos da Meta.',
    href: '/dashboard',
    action: 'Sincronizar dashboard',
    countLabel: (counts) => `${counts.syncedAccounts || 0} sincronizada(s)`,
  },
  {
    id: 'businessProfile',
    title: 'Perfil do negocio',
    text: 'Descreva oferta, publico, ticket, margem e objetivo para a IA analisar melhor.',
    href: '/dashboard/business',
    action: 'Preencher perfil',
    countLabel: (counts) => `${counts.businessProfiles || 0} perfil(is)`,
  },
  {
    id: 'realSales',
    title: 'Vendas reais',
    text: 'Use Stripe, Payhip ou vendas manuais como fonte financeira confiavel.',
    href: '/dashboard/sales',
    action: 'Configurar vendas',
    countLabel: (counts) => `${counts.realSales || 0} venda(s)`,
  },
  {
    id: 'shopify',
    title: 'Shopify',
    text: 'Conecte loja, produtos e pedidos para a IA entender oferta e receita.',
    href: '/dashboard/shopify',
    action: 'Conectar Shopify',
    countLabel: (counts) => `${counts.shopifyStores || 0} loja(s)`,
  },
  {
    id: 'shopifySynced',
    title: 'Produtos e pedidos',
    text: 'Sincronize produtos, pedidos pagos, origem e ticket medio.',
    href: '/dashboard/shopify',
    action: 'Sincronizar Shopify',
    countLabel: (counts) =>
      `${counts.shopifyProducts || 0} produto(s), ${counts.shopifyOrders || 0} pedido(s)`,
  },
  {
    id: 'metaCreatives',
    title: 'Criativos Meta',
    text: 'Puxe anuncios, copies, videos e thumbnails para analise criativa.',
    href: '/dashboard/creatives',
    action: 'Ver criativos',
    countLabel: (counts) => `${counts.metaAds || 0} criativo(s)`,
  },
  {
    id: 'reports',
    title: 'Relatorio',
    text: 'Gere o primeiro relatorio com metricas, vendas reais e analise automatica.',
    href: '/dashboard/reports',
    action: 'Gerar relatorio',
    countLabel: (counts) => `${counts.reports || 0} relatorio(s)`,
  },
]

const systemChecks: Step[] = [
  {
    id: 'database',
    title: 'Banco de dados',
    text: 'Conexao com Supabase ativa em producao.',
    href: '/dashboard',
    action: 'Abrir dashboard',
  },
  {
    id: 'aiConfigured',
    title: 'IA configurada',
    text: 'Chave da IA pronta para diagnosticos e recomendacoes.',
    href: '/dashboard/diagnosis',
    action: 'Abrir diagnostico',
  },
  {
    id: 'stripeConfigured',
    title: 'Stripe configurado',
    text: 'Base pronta para checkout, billing e vendas reais.',
    href: '/dashboard/sales',
    action: 'Abrir vendas',
  },
  {
    id: 'metaConfigured',
    title: 'Meta API configurada',
    text: 'Token da Meta pronto para criativos e dados diretos.',
    href: '/dashboard/creatives',
    action: 'Abrir Meta',
  },
]

function StepCard({
  step,
  ready,
  counts,
}: {
  step: Step
  ready: boolean
  counts: Record<string, number>
}) {
  return (
    <a
      href={step.href}
      className="block rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-indigo-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                ready ? 'bg-green-400' : 'bg-yellow-300'
              }`}
            />
            <h2 className="font-semibold">{step.title}</h2>
          </div>
          <p className="mt-2 text-sm text-gray-400">{step.text}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${
            ready ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-200'
          }`}
        >
          {ready ? 'pronto' : 'pendente'}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-indigo-300">{step.action}</span>
        {step.countLabel && (
          <span className="text-xs text-gray-500">{step.countLabel(counts)}</span>
        )}
      </div>
    </a>
  )
}

export default function OnboardingPage() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('/api/onboarding/status')
      .then((res) => res.json() as Promise<OnboardingStatus>)
      .then((data) => {
        if (active) setStatus(data)
      })
      .catch((error) => {
        if (active) {
          setStatus({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao carregar onboarding',
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const checks = status?.checks || {}
  const counts = status?.counts || {}
  const progress = status?.progress || 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="onboarding" />
      <div className="ml-64 p-8">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-indigo-300">Ads Manager AI Pro</p>
            <h1 className="mt-2 text-3xl font-bold">Ativacao do cliente</h1>
            <p className="mt-2 max-w-2xl text-gray-400">
              Conecte as fontes principais para a IA analisar campanhas, vendas, criativos,
              produtos e relatorios com mais precisao.
            </p>
          </div>
          <a
            href="/dashboard"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
          >
            Ir para dashboard
          </a>
        </div>

        <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          {loading ? (
            <p className="text-gray-400">Carregando progresso...</p>
          ) : status?.success ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Progresso de ativacao</p>
                  <p className="mt-1 text-3xl font-bold">{progress}% pronto</p>
                </div>
                <p className="text-sm text-gray-400">
                  {status.completed || 0} de {status.total || 0} itens concluidos
                </p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-100">
              {status?.error || 'Nao foi possivel carregar o onboarding.'}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Passos do cliente</h2>
            <div className="grid gap-3">
              {setupSteps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  ready={Boolean(checks[step.id])}
                  counts={counts}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Sistema</h2>
            <div className="grid gap-3">
              {systemChecks.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  ready={Boolean(checks[step.id])}
                  counts={counts}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
