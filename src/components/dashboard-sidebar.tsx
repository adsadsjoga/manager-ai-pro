import {
  BarChart3,
  Bell,
  Brain,
  BriefcaseBusiness,
  CheckSquare,
  Clapperboard,
  CreditCard,
  FileText,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

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

type NavigationItem = {
  key: DashboardSidebarProps['active']
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const navigation: NavigationItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'campaigns', label: 'Campanhas', href: '/dashboard/campaigns', icon: Megaphone },
  { key: 'sales', label: 'Vendas reais', href: '/dashboard/sales', icon: CreditCard },
  { key: 'creatives', label: 'Criativos', href: '/dashboard/creatives', icon: Clapperboard },
  { key: 'shopify', label: 'Shopify', href: '/dashboard/shopify', icon: ShoppingCart },
  { key: 'business', label: 'Perfil do negocio', href: '/dashboard/business', icon: BriefcaseBusiness },
  { key: 'diagnosis', label: 'Diagnostico IA', href: '/dashboard/diagnosis', icon: Brain },
  { key: 'recommendations', label: 'Recomendacoes', href: '/dashboard/recommendations', icon: CheckSquare },
  { key: 'onboarding', label: 'Onboarding', href: '/onboarding', icon: Rocket },
  { key: 'alerts', label: 'Alertas', href: '/dashboard/alerts', icon: Bell },
  { key: 'reports', label: 'Relatorios', href: '/dashboard/reports', icon: FileText },
  { key: 'crm', label: 'CRM', href: '/dashboard/crm', icon: Users },
  { key: 'billing', label: 'Planos', href: '/dashboard/billing', icon: Store },
  { key: 'settings', label: 'Configuracoes', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar({ active, unreadAlerts = 0 }: DashboardSidebarProps) {
  const primaryMobileItems = navigation.filter((item) =>
    ['dashboard', 'campaigns', 'sales', 'creatives', 'alerts'].includes(item.key)
  )

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 hidden h-full w-[280px] overflow-y-auto border-r border-[#1c2940] bg-[#0b1324]/95 px-5 py-6 text-white shadow-2xl shadow-black/30 backdrop-blur md:block">
        <a href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-violet-600 shadow-lg shadow-violet-900/30">
            <Zap className="h-6 w-6 text-white" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">Ads Manager AI</span>
            <span className="text-xs text-slate-400">Performance command center</span>
          </span>
        </a>

        <div className="mb-4 rounded-2xl border border-[#22314d] bg-[#111a2d] p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
            <BarChart3 className="h-4 w-4" />
            Workspace
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100">Conta ativa</p>
          <p className="mt-0.5 text-xs text-slate-400">Meta, vendas, IA e relatorios</p>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.key === active
            const Icon = item.icon

            return (
              <a
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6d5dfc] to-[#8b5cf6] text-white shadow-lg shadow-violet-950/30'
                    : 'text-slate-400 hover:bg-[#172238] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isActive ? 'bg-white/14' : 'bg-[#172238] text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </span>
                {item.key === 'alerts' && unreadAlerts > 0 && (
                  <span className="rounded-full bg-[#ff4d61] px-2 py-0.5 text-xs font-bold text-white">
                    {unreadAlerts}
                  </span>
                )}
              </a>
            )
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-30 flex gap-2 overflow-x-auto rounded-3xl border border-[#22314d] bg-[#0b1324]/95 p-2 text-white shadow-2xl shadow-black/40 backdrop-blur md:hidden">
        {primaryMobileItems.map((item) => {
          const isActive = item.key === active
          const Icon = item.icon

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] ${
                isActive ? 'bg-[#6d5dfc] text-white' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label.split(' ')[0]}</span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
