import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { PLANS, planFor } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const user = await ensureAppUser(userId)
  const [accountsCount, clientsCount] = await Promise.all([
    prisma.adAccount.count({ where: { userId: user.id, windsorConnected: true } }),
    prisma.client.count({ where: { userId: user.id } }),
  ])
  const currentPlan = planFor(user.plan)

  return NextResponse.json({
    success: true,
    plan: currentPlan,
    plans: Object.values(PLANS).map((plan) => ({
      ...plan,
      stripeConfigured: plan.key === 'free' || Boolean(
        plan.stripePriceEnv ? process.env[plan.stripePriceEnv] : ''
      ),
    })),
    usage: {
      accounts: accountsCount,
      clients: clientsCount,
    },
    stripe: {
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      hasCustomer: Boolean(user.stripeCustomerId),
      subscriptionId: user.stripeSubscriptionId,
      planExpiresAt: user.planExpiresAt,
    },
  })
}
