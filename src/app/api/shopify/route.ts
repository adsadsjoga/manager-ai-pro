import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'

type ShopifyBody = {
  action?: 'save' | 'disconnect' | 'delete'
  storeId?: string
  shopDomain?: string
  storeName?: string
  accessToken?: string
  adAccountId?: string
  currency?: string
}

function normalizeShopDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const stores = await prisma.shopifyStore.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      shopDomain: true,
      storeName: true,
      currency: true,
      syncStatus: true,
      syncError: true,
      lastSyncAt: true,
      adAccountId: true,
      adAccount: {
        select: {
          accountId: true,
          accountName: true,
        },
      },
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  })

  return NextResponse.json({
    success: true,
    stores,
    configured: stores.some((store) => store.syncStatus !== 'disconnected'),
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Usuario nao autenticado' },
      { status: 401 }
    )
  }

  const user = await ensureAppUser(userId)
  const body = (await req.json()) as ShopifyBody

  if (body.action === 'delete' && body.storeId) {
    const existingStore = await prisma.shopifyStore.findFirst({
      where: {
        id: body.storeId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingStore) {
      return NextResponse.json(
        { success: false, error: 'Loja Shopify nao encontrada' },
        { status: 404 }
      )
    }

    await prisma.shopifyStore.delete({
      where: {
        id: existingStore.id,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'disconnect' && body.shopDomain) {
    await prisma.shopifyStore.updateMany({
      where: {
        userId: user.id,
        shopDomain: normalizeShopDomain(body.shopDomain),
      },
      data: {
        syncStatus: 'disconnected',
        accessTokenEnc: null,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (!body.shopDomain) {
    return NextResponse.json(
      { success: false, error: 'Dominio da loja obrigatorio' },
      { status: 400 }
    )
  }

  const shopDomain = normalizeShopDomain(body.shopDomain)
  const adAccount = body.adAccountId
    ? await prisma.adAccount.findFirst({
        where: {
          userId: user.id,
          accountId: body.adAccountId,
        },
        select: {
          id: true,
          currency: true,
        },
      })
    : null

  if (body.storeId) {
    const existingStore = await prisma.shopifyStore.findFirst({
      where: {
        id: body.storeId,
        userId: user.id,
      },
      select: {
        id: true,
        accessTokenEnc: true,
      },
    })

    if (!existingStore) {
      return NextResponse.json(
        { success: false, error: 'Loja Shopify nao encontrada' },
        { status: 404 }
      )
    }

    const store = await prisma.shopifyStore.update({
      where: {
        id: body.storeId,
      },
      data: {
        shopDomain,
        storeName: body.storeName || shopDomain,
        currency: body.currency || adAccount?.currency || 'EUR',
        adAccountId: adAccount?.id || null,
        ...(body.accessToken ? { accessTokenEnc: body.accessToken } : {}),
        syncStatus: body.accessToken || existingStore.accessTokenEnc ? 'connected' : 'needs_token',
        syncError: null,
      },
      select: {
        id: true,
        shopDomain: true,
        storeName: true,
        currency: true,
        syncStatus: true,
        lastSyncAt: true,
        adAccountId: true,
      },
    })

    return NextResponse.json({ success: true, store })
  }

  const store = await prisma.shopifyStore.upsert({
    where: {
      userId_shopDomain: {
        userId: user.id,
        shopDomain,
      },
    },
    update: {
      storeName: body.storeName || shopDomain,
      currency: body.currency || adAccount?.currency || 'EUR',
      adAccountId: adAccount?.id || null,
      ...(body.accessToken ? { accessTokenEnc: body.accessToken } : {}),
      syncStatus: body.accessToken ? 'connected' : undefined,
      syncError: null,
    },
    create: {
      userId: user.id,
      adAccountId: adAccount?.id || null,
      shopDomain,
      storeName: body.storeName || shopDomain,
      currency: body.currency || adAccount?.currency || 'EUR',
      accessTokenEnc: body.accessToken || null,
      syncStatus: body.accessToken ? 'connected' : 'needs_token',
    },
    select: {
      id: true,
      shopDomain: true,
      storeName: true,
      currency: true,
      syncStatus: true,
      lastSyncAt: true,
      adAccountId: true,
    },
  })

  return NextResponse.json({ success: true, store })
}
