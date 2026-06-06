type DashboardSidebarProps = {
  active:
    | 'dashboard'
    | 'campaigns'
    | 'sales'
    | 'creatives'
    | 'shopify'
    | 'business'
    | 'diagnosis'
    | 'recommendations'
    | 'onboarding'
    | 'alerts'
    | 'reports'
    | 'crm'
    | 'billing'
    | 'settings'
  unreadAlerts?: number
}

const navigation = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { key: 'campaigns', label: 'Campanhas', href: '/dashboard/campaigns', icon: '📣' },
  { key: 'sales', label: 'Vendas reais', href: '/dashboard/sales', icon: '💵' },
  { key: 'creatives', label: 'Criativos', href: '/dashboard/creatives', icon: '🎬' },
  { key: 'shopify', label: 'Shopify', href: '/dashboard/shopify', icon: '🛒' },
  { key: 'business', label: 'Perfil do negocio', href: '/dashboard/business', icon: '🧭' },
  { key: 'diagnosis', label: 'Diagnostico IA', href: '/dashboard/diagnosis', icon: '🧠' },
  { key: 'recommendations', label: 'Recomendacoes', href: '/dashboard/recommendations', icon: '✅' },
  { key: 'onboarding', label: 'Onboarding', href: '/onboarding', icon: '🚀' },
  { key: 'alerts', label: 'Alertas', href: '/dashboard/alerts', icon: '🔔' },
  { key: 'reports', label: 'Relatorios', href: '/dashboard/reports', icon: '📄' },
  { key: 'crm', label: 'CRM', href: '/dashboard/crm', icon: '👥' },
  { key: 'billing', label: 'Planos', href: '/dashboard/billing', icon: '💳' },
  { key: 'settings', label: 'Configuracoes', href: '/dashboard/settings', icon: '⚙️' },
] as const

export function DashboardSidebar({ active, unreadAlerts = 0 }: DashboardSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 overflow-y-auto border-r border-gray-800 bg-gray-900 p-6">
      <a href="/dashboard" className="mb-8 flex items-center gap-3 text-xl font-bold text-indigo-400">
        <span className="text-2xl">⚡</span>
        <span>Ads Manager AI</span>
      </a>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = item.key === active

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                {item.label}
              </span>
              {item.key === 'alerts' && unreadAlerts > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {unreadAlerts}
                </span>
              )}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}
