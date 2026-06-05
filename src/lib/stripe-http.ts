import { createHmac, timingSafeEqual } from 'node:crypto'

type CheckoutParams = {
  priceId: string
  userId: string
  plan: string
  email: string
  customerId?: string | null
  successUrl: string
  cancelUrl: string
}

export type StripeCheckoutSession = {
  id: string
  url: string | null
  customer?: string | null
  subscription?: string | null
  metadata?: Record<string, string>
}

export type StripeSubscription = {
  id: string
  customer?: string | null
  status?: string
  current_period_end?: number
  metadata?: Record<string, string>
  items?: {
    data?: Array<{
      price?: {
        id?: string
      }
    }>
  }
}

export type StripeCharge = {
  id: string
  amount: number
  currency: string
  status: string
  paid: boolean
  created: number
  description?: string | null
  billing_details?: {
    email?: string | null
    name?: string | null
  }
  payment_intent?: string | null
  metadata?: Record<string, string>
}

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY nao configurada')
  return key
}

export async function createCheckoutSession(params: CheckoutParams) {
  const body = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    'metadata[userId]': params.userId,
    'metadata[plan]': params.plan,
    'subscription_data[metadata][userId]': params.userId,
    'subscription_data[metadata][plan]': params.plan,
  })

  if (params.customerId) {
    body.set('customer', params.customerId)
  } else {
    body.set('customer_email', params.email)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = (await response.json()) as StripeCheckoutSession & {
    error?: { message?: string }
  }

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Erro ao criar checkout Stripe')
  }

  return data
}

export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const body = new URLSearchParams({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = (await response.json()) as { url?: string; error?: { message?: string } }

  if (!response.ok || data.error || !data.url) {
    throw new Error(data.error?.message || 'Erro ao abrir portal Stripe')
  }

  return data
}

export async function listStripeCharges(params: { createdGte?: number; limit?: number }) {
  const query = new URLSearchParams({
    limit: String(params.limit || 100),
  })

  if (params.createdGte) {
    query.set('created[gte]', String(params.createdGte))
  }

  const response = await fetch(`https://api.stripe.com/v1/charges?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
    },
  })
  const data = (await response.json()) as {
    data?: StripeCharge[]
    error?: { message?: string }
  }

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Erro ao buscar pagamentos Stripe')
  }

  return data.data || []
}

export function verifyStripeSignature(payload: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET nao configurado')
  if (!signature) return false

  const parts = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key, value]
    })
  )
  const timestamp = parts.t
  const v1 = parts.v1
  if (!timestamp || !v1) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(v1)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}
