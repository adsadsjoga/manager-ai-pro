import Link from 'next/link'

const setupItems = [
  'Criar conta Stripe e ativar o modo live quando for vender.',
  'Criar produtos Starter, Pro e Agency no Stripe.',
  'Copiar os Price IDs para STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO e STRIPE_PRICE_AGENCY.',
  'Configurar STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET no servidor.',
  'Criar webhook no Stripe apontando para /api/billing/webhook.',
  'Configurar domínio e NEXT_PUBLIC_APP_URL com a URL final.',
  'Revisar textos de oferta, termos, política de privacidade e suporte.',
  'Testar compra real com cartão de teste antes de publicar.',
]

const webhookEvents = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-300 text-sm">
            Ads Manager AI Pro
          </Link>
          <h1 className="text-3xl font-bold mt-3">Documentação de venda</h1>
          <p className="text-gray-400 mt-2">
            Checklist para colocar multi-cliente, billing e onboarding em produção.
          </p>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">O que voce precisa fazer</h2>
          <div className="space-y-3">
            {setupItems.map((item) => (
              <label key={item} className="flex gap-3 text-sm text-gray-300">
                <input type="checkbox" className="mt-1" />
                {item}
              </label>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Variaveis Stripe</h2>
            <pre className="text-xs bg-gray-950 rounded-lg p-4 overflow-x-auto text-gray-300">{`STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com`}</pre>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Eventos do webhook</h2>
            <div className="space-y-2">
              {webhookEvents.map((event) => (
                <div key={event} className="bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  {event}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
