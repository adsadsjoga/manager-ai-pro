'use client'

const steps = [
  {
    title: 'Conectar conta Meta',
    text: 'Adicione ou busque as contas de anuncio nas configuracoes.',
    href: '/dashboard/settings',
  },
  {
    title: 'Sincronizar dados',
    text: 'Use o botao de sincronizar no dashboard para puxar metricas reais.',
    href: '/dashboard',
  },
  {
    title: 'Criar clientes',
    text: 'Separe cada empresa em um cliente e vincule as contas certas.',
    href: '/dashboard/clients',
  },
  {
    title: 'Ativar plano',
    text: 'Escolha Starter, Pro ou Agency para liberar limites comerciais.',
    href: '/dashboard/billing',
  },
]

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-indigo-300 text-sm font-medium">Ads Manager AI Pro</p>
          <h1 className="text-3xl font-bold mt-2">Configure sua conta para vender</h1>
          <p className="text-gray-400 mt-2">
            Siga estes passos para sair de teste interno e operar com clientes reais.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {steps.map((step, index) => (
            <a
              key={step.title}
              href={step.href}
              className="bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl p-6 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <h2 className="font-semibold mt-4">{step.title}</h2>
              <p className="text-gray-400 text-sm mt-2">{step.text}</p>
            </a>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <a href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-lg">
            Ir para dashboard
          </a>
          <a href="/docs" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-lg">
            Ver documentação
          </a>
        </div>
      </div>
    </main>
  )
}
