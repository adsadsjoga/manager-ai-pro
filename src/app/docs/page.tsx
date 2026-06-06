import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

const setupItems = [
  'Preencher Perfil do negocio para a IA entender oferta, publico, ticket e objetivo.',
  'Conectar ao menos uma conta Meta/Facebook e sincronizar dados reais.',
  'Configurar Vendas reais para usar Stripe/Payhip/manual como fonte financeira principal.',
  'Criar conta Stripe e ativar o modo live quando for vender.',
  'Criar produtos Starter, Pro e Agency no Stripe.',
  'Copiar os Price IDs para STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO e STRIPE_PRICE_AGENCY.',
  'Configurar STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET no servidor.',
  'Criar webhook no Stripe apontando para /api/billing/webhook.',
  'Configurar domínio e NEXT_PUBLIC_APP_URL com a URL final.',
  'Revisar textos de oferta, termos, política de privacidade e suporte.',
  'Testar compra real com cartão de teste antes de publicar.',
]

const productBlocks = [
  '1. Dados confiaveis: Meta para midia e vendas reais para receita.',
  '2. Perfil do negocio: base da IA para analisar cada cliente com contexto.',
  '3. Diagnostico IA: resumo do que esta bom, ruim e prioritario.',
  '4. Recomendacoes: acoes praticas por campanha e por negocio.',
  '5. Relatorios: modelos executivo, agencia e detalhado.',
  '6. Multi-cliente: cada cliente/conta separado por dados e limites.',
  '7. Billing e onboarding: planos, progresso de ativacao e checklist comercial.',
]

const stageStatus = [
  {
    title: 'Pronto para usar',
    items: [
      'Dashboard por conta de anuncio',
      'Vendas reais como fonte financeira',
      'Perfil do negocio para contexto da IA',
      'Diagnostico IA e recomendacoes',
      'Criativos Meta salvos no banco',
      'Relatorios HTML imprimiveis',
      'Onboarding de ativacao',
    ],
  },
  {
    title: 'Precisa configurar para vender',
    items: [
      'Stripe em modo live',
      'Planos com Price IDs reais',
      'Webhook de billing no Stripe',
      'Dominio final quando comprar',
      'Termos, privacidade e suporte',
    ],
  },
  {
    title: 'Deixar para depois',
    items: [
      'Shopify OAuth completo para clientes',
      'Templates visuais finais do Figma',
      'Token Meta permanente por cliente via OAuth',
      'PDF nativo em vez de impressao do navegador',
    ],
  },
]

const webhookEvents = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <DashboardSidebar active="onboarding" />
      <div className="ml-64 max-w-6xl p-8">
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

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Blocos do produto</h2>
          <div className="grid gap-2">
            {productBlocks.map((item) => (
              <div key={item} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 mb-6 md:grid-cols-3">
          {stageStatus.map((group) => (
            <div key={group.title} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h2 className="font-semibold mb-3">{group.title}</h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
