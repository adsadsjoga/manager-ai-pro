import { auth } from '@clerk/nextjs/server'
import { ArrowRight, BarChart3, Bell, Brain, FileText, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    title: 'Dashboard por conta',
    text: 'Separe cada cliente ou empresa e acompanhe investimento, cliques, CTR, CPC e vendas reais.',
    icon: BarChart3,
  },
  {
    title: 'IA com contexto',
    text: 'A IA usa o perfil do negocio, criativos, campanhas e receita real para gerar diagnosticos melhores.',
    icon: Brain,
  },
  {
    title: 'Alertas acionaveis',
    text: 'Receba sinais de ROAS baixo, CPC alto, campanhas paradas e oportunidades de escala.',
    icon: Bell,
  },
  {
    title: 'Relatorios profissionais',
    text: 'Gere links e paginas imprimiveis para apresentar resultados sem montar planilhas.',
    icon: FileText,
  },
]

const stats = [
  ['Fontes', 'Meta + Stripe'],
  ['IA', 'Diagnostico'],
  ['Alertas', 'Por campanha'],
  ['Relatorios', 'PDF/link'],
]

const planCards = [
  { name: 'Starter', price: '97 EUR/mes', text: 'Para gestor solo validando os primeiros clientes.' },
  { name: 'Pro', price: '197 EUR/mes', text: 'Para operacao recorrente com relatorios e alertas.' },
  { name: 'Agency', price: '397 EUR/mes', text: 'Para agencias com multi-clientes e limites maiores.' },
]

export default async function Home() {
  const { userId } = await auth()

  return (
    <main className="min-h-screen overflow-hidden bg-[#060b18] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(109,93,252,0.20),transparent_32rem),radial-gradient(circle_at_85%_15%,rgba(36,215,255,0.12),transparent_30rem)]" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-violet-600">
            <Zap className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-bold">Ads Manager AI Pro</span>
            <span className="text-xs text-slate-400">AI performance workspace</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/docs" className="hidden text-slate-300 transition-colors hover:text-white sm:inline">
            Documentacao
          </Link>
          <Link
            href={userId ? '/dashboard' : '/sign-in'}
            className="dashboard-button inline-flex items-center gap-2 px-5 py-3 font-semibold"
          >
            {userId ? 'Abrir dashboard' : 'Entrar'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-[minmax(0,1fr)_520px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#263551] bg-[#111a2d]/80 px-4 py-2 text-sm text-[#8ea2ff]">
            <ShieldCheck className="h-4 w-4" />
            SaaS para gestores, agencias e e-commerce
          </div>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Venda analise de anuncios com IA, vendas reais e relatorios claros.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Conecte Meta/Facebook, Stripe e o perfil do negocio para entender o que esta gerando
            resultado de verdade e entregar uma leitura profissional para cada cliente.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/sign-up" className="dashboard-button inline-flex items-center gap-2 px-6 py-3 font-semibold">
              Comecar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl border border-[#263551] bg-[#182338] px-6 py-3 font-semibold text-slate-100 transition-colors hover:bg-[#22304b]"
            >
              Ver onboarding
            </Link>
          </div>
        </div>

        <div className="dashboard-card rounded-[28px] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">Resumo operacional</p>
              <h2 className="mt-1 text-2xl font-bold">Command center</h2>
            </div>
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-300">
              Online
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(([label, value]) => (
              <div key={label} className="dashboard-card-subtle rounded-2xl p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
            <p className="font-semibold">Diferencial principal</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A IA nao olha so metricas soltas. Ela cruza objetivo, oferta, ticket, campanhas,
              criativos, vendas reais e alertas para sugerir proximas acoes.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article key={feature.title} className="dashboard-card rounded-3xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22314d] text-[#8ea2ff]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8ea2ff]">Billing pronto</p>
            <h2 className="mt-2 text-3xl font-bold">Planos para vender</h2>
          </div>
          <Link href="/docs" className="text-sm text-slate-300 hover:text-white">
            Ver checklist
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {planCards.map((plan) => (
            <article key={plan.name} className="dashboard-card rounded-3xl p-6">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-4 text-3xl font-bold">{plan.price}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.text}</p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#22314d] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#2c3c5b]"
              >
                Criar conta
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
