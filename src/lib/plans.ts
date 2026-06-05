export type PlanKey = 'free' | 'starter' | 'pro' | 'agency'

export type PlanLimits = {
  accounts: number
  clients: number
  syncIntervalMinutes: number | null
  reports: boolean
  whiteLabel: boolean
}

export type PlanDefinition = {
  key: PlanKey
  name: string
  priceLabel: string
  stripePriceEnv?: string
  limits: PlanLimits
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: 'free',
    name: 'Free',
    priceLabel: '0 €/mes',
    limits: {
      accounts: 1,
      clients: 0,
      syncIntervalMinutes: null,
      reports: false,
      whiteLabel: false,
    },
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceLabel: '97 €/mes',
    stripePriceEnv: 'STRIPE_PRICE_STARTER',
    limits: {
      accounts: 3,
      clients: 1,
      syncIntervalMinutes: 60,
      reports: true,
      whiteLabel: false,
    },
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceLabel: '197 €/mes',
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    limits: {
      accounts: 10,
      clients: 5,
      syncIntervalMinutes: 15,
      reports: true,
      whiteLabel: false,
    },
  },
  agency: {
    key: 'agency',
    name: 'Agency',
    priceLabel: '397 €/mes',
    stripePriceEnv: 'STRIPE_PRICE_AGENCY',
    limits: {
      accounts: -1,
      clients: -1,
      syncIntervalMinutes: 5,
      reports: true,
      whiteLabel: true,
    },
  },
}

export function normalizePlan(plan?: string | null): PlanKey {
  if (plan === 'starter' || plan === 'pro' || plan === 'agency') return plan
  return 'free'
}

export function planFor(plan?: string | null) {
  return PLANS[normalizePlan(plan)]
}

export function priceIdForPlan(plan: PlanKey) {
  const envName = PLANS[plan].stripePriceEnv
  return envName ? process.env[envName] || '' : ''
}

export function planFromPriceId(priceId?: string | null): PlanKey | null {
  if (!priceId) return null

  return (Object.values(PLANS).find((plan) => {
    if (!plan.stripePriceEnv) return false
    return process.env[plan.stripePriceEnv] === priceId
  })?.key || null) as PlanKey | null
}

export function isWithinLimit(limit: number, currentCount: number) {
  return limit === -1 || currentCount < limit
}
