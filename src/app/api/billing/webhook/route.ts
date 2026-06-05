import { NextResponse } from 'next/server'
import { normalizePlan, planFromPriceId } from '@/lib/plans'
import { prisma } from '@/lib/prisma'
import {
  type StripeCheckoutSession,
  type StripeSubscription,
  verifyStripeSignature,
} from '@/lib/stripe-http'

type StripeEvent = {
  type: string
  data: {
    object: StripeCheckoutSession | StripeSubscription
  }
}

function periodEnd(subscription: StripeSubscription) {
  return subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null
}

async function handleCheckoutCompleted(session: StripeCheckoutSession) {
  const userId = session.metadata?.userId || ''
  const plan = normalizePlan(session.metadata?.plan)

  if (!userId) return

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      plan,
      stripeCustomerId: session.customer || undefined,
      stripeSubscriptionId: session.subscription || undefined,
    },
  })
}

async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  const userId = subscription.metadata?.userId || ''
  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = planFromPriceId(priceId) || normalizePlan(subscription.metadata?.plan)

  if (!userId) return

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      plan: subscription.status === 'active' || subscription.status === 'trialing' ? plan : 'free',
      stripeCustomerId: subscription.customer || undefined,
      stripeSubscriptionId: subscription.id,
      planExpiresAt: periodEnd(subscription),
    },
  })
}

async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  const userId = subscription.metadata?.userId || ''

  await prisma.user.updateMany({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        { stripeSubscriptionId: subscription.id },
      ],
    },
    data: {
      plan: 'free',
      stripeSubscriptionId: null,
      planExpiresAt: periodEnd(subscription),
    },
  })
}

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!verifyStripeSignature(payload, signature)) {
    return NextResponse.json({ success: false, error: 'Assinatura invalida' }, { status: 400 })
  }

  const event = JSON.parse(payload) as StripeEvent

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object as StripeCheckoutSession)
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    await handleSubscriptionUpdated(event.data.object as StripeSubscription)
  }

  if (event.type === 'customer.subscription.deleted') {
    await handleSubscriptionDeleted(event.data.object as StripeSubscription)
  }

  return NextResponse.json({ received: true })
}
