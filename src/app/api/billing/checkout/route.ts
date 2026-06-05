import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { normalizePlan, priceIdForPlan } from '@/lib/plans'
import { createCheckoutSession } from '@/lib/stripe-http'

type CheckoutBody = {
  plan?: string
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const body = (await req.json()) as CheckoutBody
  const plan = normalizePlan(body.plan)

  if (plan === 'free') {
    return NextResponse.json(
      { success: false, error: 'Plano Free nao precisa de checkout' },
      { status: 400 }
    )
  }

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.json(
      { success: false, error: `Price ID da Stripe nao configurado para ${plan}` },
      { status: 400 }
    )
  }

  const user = await ensureAppUser(userId)
  const session = await createCheckoutSession({
    priceId,
    userId: user.id,
    plan,
    email: user.email,
    customerId: user.stripeCustomerId,
    successUrl: `${appUrl()}/dashboard/billing?checkout=success`,
    cancelUrl: `${appUrl()}/dashboard/billing?checkout=cancelled`,
  })

  return NextResponse.json({
    success: true,
    url: session.url,
  })
}
