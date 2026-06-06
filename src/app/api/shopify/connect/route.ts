import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  getAppUrl,
  isValidShopDomain,
  normalizeShopDomain,
  SHOPIFY_OAUTH_SCOPES,
  signShopifyState,
} from '@/lib/shopify-oauth'

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const url = new URL(req.url)
  const shopDomain = normalizeShopDomain(url.searchParams.get('shop') || '')

  if (!isValidShopDomain(shopDomain)) {
    return NextResponse.redirect(
      new URL('/dashboard/shopify?error=shop_domain', getAppUrl())
    )
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_API_KEY
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/dashboard/shopify?error=shopify_env', getAppUrl())
    )
  }

  const state = signShopifyState({
    userId,
    shopDomain,
    storeName: url.searchParams.get('storeName') || undefined,
    adAccountId: url.searchParams.get('adAccountId') || undefined,
    currency: url.searchParams.get('currency') || undefined,
  })
  const redirectUri = `${getAppUrl()}/api/shopify/callback`
  const installUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`)

  installUrl.searchParams.set('client_id', clientId)
  installUrl.searchParams.set('scope', SHOPIFY_OAUTH_SCOPES)
  installUrl.searchParams.set('redirect_uri', redirectUri)
  installUrl.searchParams.set('state', state)

  return NextResponse.redirect(installUrl)
}
