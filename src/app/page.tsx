import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

const features = [
  'Dashboard Meta/Facebook com dados reais',
  'Alertas automaticos por email',
  'Diagnostico IA por campanha e criativo',
  'Relatorios compartilhaveis para clientes',
  'Multi-contas e area de clientes',
  'Planos com limites para vender como SaaS',
]

const plans = [
  { name: 'Starter', price: '97 €/mes', text: 'Para gestor solo com poucos clientes.' },
  { name: 'Pro', price: '197 €/mes', text: 'Para operacao recorrente com CRM e relatorios.' },
  { name: 'Agency', price: '397 €/mes', text: 'Para agencias com varios clientes.' },
]

export default async function Home() {
  const { userId } = await auth()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-300">⚡ Ads Manager AI Pro</div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/docs" className="text-gray-300 hover:text-white">
            Documentacao
          </Link>
          <Link
            href={userId ? '/dashboard' : '/sign-in'}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg"
          >
            {userId ? 'Abrir dashboard' : 'Entrar'}
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-[minmax(0,1fr)_420px] gap-10 items-center">
        <div>
          <p className="text-indigo-300 text-sm font-medium">SaaS para gestores e agencias</p>
          <h1 className="text-5xl font-bold mt-4 leading-tight">
            Venda analise de anuncios com IA, alertas e relatorios em minutos.
          </h1>
          <p className="text-gray-400 text-lg mt-5 leading-relaxed">
            Conecte contas Meta/Facebook, acompanhe performance, gere recomendacoes e entregue
            relatórios profissionais para clientes sem montar planilhas manualmente.
          </p>
          <div className="flex gap-3 mt-8">
            <Link href="/sign-up" className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-lg">
              Comecar agora
            </Link>
            <Link href="/onboarding" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-lg">
              Ver onboarding
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wide">Resumo operacional</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[
              ['Contas', '10+'],
              ['Alertas', '12 regras'],
              ['Relatorios', 'PDF/link'],
              ['IA', 'diagnostico'],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold mb-5">Planos para vender</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-3">{plan.price}</p>
              <p className="text-gray-400 text-sm mt-3">{plan.text}</p>
              <Link
                href="/sign-up"
                className="block text-center bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg mt-5"
              >
                Criar conta
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
