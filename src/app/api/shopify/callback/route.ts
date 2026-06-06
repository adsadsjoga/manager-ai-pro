import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import {
  exchangeShopifyCode,
  getAppUrl,
  isValidShopDomain,
  normalizeShopDomain,
  verifyShopifyCallbackHmac,
  verifyShopifyState,
} from '@/lib/shopify-oauth'

export async function GET(req: Request) {
  const appUrl = getAppUrl()

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', appUrl))
    }

    const url = new URL(req.url)
    verifyShopifyCallbackHmac(url.searchParams)

    const code = url.searchParams.get('code')
    const shop = normalizeShopDomain(url.searchParams.get('shop') || '')
    const state = url.searchParams.get('state') || ''

    if (!code || !isValidShopDomain(shop) || !state) {
      throw new Error('Retorno Shopify incompleto')
    }

    const stateData = verifyShopifyState(state)
    if (stateData.userId !== userId || stateData.shopDomain !== shop) {
      throw new Error('Retorno Shopify nao pertence a esta sessao')
    }

    const user = await ensureAppUser(userId)
    const tokenData = await exchangeShopifyCode({
      shopDomain: shop,
      code,
    })
    const adAccount = stateData.adAccountId
      ? await prisma.adAccount.findFirst({
          where: {
            userId: user.id,
            accountId: stateData.adAccountId,
          },
          select: {
            id: true,
            currency: true,
          },
        })
      : null

    await prisma.shopifyStore.upsert({
      where: {
        userId_shopDomain: {
          userId: user.id,
          shopDomain: shop,
        },
      },
      update: {
        accessTokenEnc: tokenData.access_token,
        storeName: stateData.storeName || shop,
        currency: stateData.currency || adAccount?.currency || 'EUR',
        adAccountId: adAccount?.id || null,
        syncStatus: 'connected',
        syncError: null,
      },
      create: {
        userId: user.id,
        adAccountId: adAccount?.id || null,
        shopDomain: shop,
        storeName: stateData.storeName || shop,
        currency: stateData.currency || adAccount?.currency || 'EUR',
        accessTokenEnc: tokenData.access_token,
        syncStatus: 'connected',
      },
    })

    return NextResponse.redirect(new URL('/dashboard/shopify?connected=1', appUrl))
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error ? error.message : 'Erro ao conectar Shopify'
    )
    return NextResponse.redirect(new URL(`/dashboard/shopify?error=${message}`, appUrl))
  }
}
