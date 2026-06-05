import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { createBillingPortalSession } from '@/lib/stripe-http'

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const user = await ensureAppUser(userId)

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { success: false, error: 'Cliente Stripe ainda nao criado' },
      { status: 400 }
    )
  }

  const session = await createBillingPortalSession({
    customerId: user.stripeCustomerId,
    returnUrl: `${appUrl()}/dashboard/billing`,
  })

  return NextResponse.json({
    success: true,
    url: session.url,
  })
}
