import crypto from 'crypto'

export const SHOPIFY_OAUTH_SCOPES = [
  'read_products',
  'read_orders',
  'read_customers',
  'read_inventory',
].join(',')

export type ShopifyOAuthState = {
  userId: string
  shopDomain: string
  storeName?: string
  adAccountId?: string
  currency?: string
}

function getSecret() {
  return process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_API_SECRET || ''
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function normalizeShopDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

export function isValidShopDomain(value: string) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalizeShopDomain(value))
}

export function signShopifyState(payload: ShopifyOAuthState) {
  const secret = getSecret()
  if (!secret) throw new Error('SHOPIFY_CLIENT_SECRET nao configurado')

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return `${body}.${sig}`
}

export function verifyShopifyState(state: string) {
  const secret = getSecret()
  if (!secret) throw new Error('SHOPIFY_CLIENT_SECRET nao configurado')

  const [body, sig] = state.split('.')
  if (!body || !sig) throw new Error('Estado Shopify invalido')

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (sig.length !== expected.length) throw new Error('Estado Shopify invalido')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Estado Shopify invalido')
  }

  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ShopifyOAuthState
}

export function verifyShopifyCallbackHmac(searchParams: URLSearchParams) {
  const secret = getSecret()
  if (!secret) throw new Error('SHOPIFY_CLIENT_SECRET nao configurado')

  const hmac = searchParams.get('hmac')
  if (!hmac) throw new Error('Retorno Shopify sem assinatura')

  const message = Array.from(searchParams.entries())
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex')

  if (hmac.length !== expected.length) throw new Error('Assinatura Shopify invalida')
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    throw new Error('Assinatura Shopify invalida')
  }
}

export async function exchangeShopifyCode(params: {
  shopDomain: string
  code: string
}) {
  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY
  const clientSecret = getSecret()

  if (!clientId) throw new Error('SHOPIFY_CLIENT_ID nao configurado')
  if (!clientSecret) throw new Error('SHOPIFY_CLIENT_SECRET nao configurado')

  const response = await fetch(`https://${params.shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
    }),
  })
  const data = (await response.json()) as {
    access_token?: string
    scope?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Shopify nao retornou token')
  }

  return data
}
