import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureAppUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import { fetchShopifySnapshot, shopifyNodeId } from '@/lib/shopify-http'

type SyncBody = {
  storeId?: string
  since?: string
}

function parseAmount(value?: string | null) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDate(value?: string | null) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function isPaidShopifyOrder(status?: string | null) {
  const normalized = (status || '').toLowerCase()
  return normalized === 'paid' || normalized === 'partially_paid'
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
  const body = (await req.json()) as SyncBody
  const store = body.storeId
    ? await prisma.shopifyStore.findFirst({
        where: { id: body.storeId, userId: user.id },
        include: { adAccount: true },
      })
    : await prisma.shopifyStore.findFirst({
        where: { userId: user.id, syncStatus: { not: 'disconnected' } },
        include: { adAccount: true },
        orderBy: { updatedAt: 'desc' },
      })

  if (!store) {
    return NextResponse.json(
      { success: false, error: 'Nenhuma loja Shopify cadastrada' },
      { status: 404 }
    )
  }

  if (!store.accessTokenEnc) {
    return NextResponse.json(
      { success: false, error: 'Token da Shopify nao configurado nesta loja' },
      { status: 400 }
    )
  }

  await prisma.shopifyStore.update({
    where: { id: store.id },
    data: { syncStatus: 'syncing', syncError: null },
  })

  try {
    const snapshot = await fetchShopifySnapshot({
      shopDomain: store.shopDomain,
      accessToken: store.accessTokenEnc,
      since: body.since || '2025-01-01',
    })
    let productsSaved = 0
    let ordersSaved = 0
    let realSalesSaved = 0

    for (const product of snapshot.products) {
      const firstVariant = product.variants?.nodes?.[0]
      const inventoryQty = product.variants?.nodes?.reduce(
        (sum, variant) => sum + Number(variant.inventoryQuantity || 0),
        0
      )

      await prisma.shopifyProduct.upsert({
        where: {
          shopifyStoreId_shopifyProductId: {
            shopifyStoreId: store.id,
            shopifyProductId: shopifyNodeId(product.id),
          },
        },
        update: {
          title: product.title,
          handle: product.handle || null,
          status: product.status || null,
          productType: product.productType || null,
          vendor: product.vendor || null,
          imageUrl: product.featuredMedia?.image?.url || null,
          price: parseAmount(firstVariant?.price),
          currency: snapshot.shop.currencyCode || store.currency,
          inventoryQty,
          rawData: product,
          lastFetchedAt: new Date(),
        },
        create: {
          userId: user.id,
          adAccountId: store.adAccountId,
          shopifyStoreId: store.id,
          shopifyProductId: shopifyNodeId(product.id),
          title: product.title,
          handle: product.handle || null,
          status: product.status || null,
          productType: product.productType || null,
          vendor: product.vendor || null,
          imageUrl: product.featuredMedia?.image?.url || null,
          price: parseAmount(firstVariant?.price),
          currency: snapshot.shop.currencyCode || store.currency,
          inventoryQty,
          rawData: product,
        },
      })
      productsSaved += 1
    }

    for (const order of snapshot.orders) {
      const orderId = shopifyNodeId(order.id)
      const currency = order.totalPriceSet?.shopMoney?.currencyCode || store.currency
      const totalPrice = parseAmount(order.totalPriceSet?.shopMoney?.amount)
      const productSummary =
        order.lineItems?.nodes
          ?.map((item) => `${item.quantity || 1}x ${item.name || 'Produto'}`)
          .join(', ') || null
      const customerEmail = order.email || order.customer?.email || null
      const customerName = order.customer?.displayName || null
      const processedAt = parseDate(order.processedAt || order.createdAt)

      await prisma.shopifyOrder.upsert({
        where: {
          shopifyStoreId_shopifyOrderId: {
            shopifyStoreId: store.id,
            shopifyOrderId: orderId,
          },
        },
        update: {
          orderName: order.name || null,
          financialStatus: order.displayFinancialStatus || null,
          fulfillmentStatus: order.displayFulfillmentStatus || null,
          totalPrice,
          subtotalPrice: parseAmount(order.subtotalPriceSet?.shopMoney?.amount),
          totalTax: parseAmount(order.totalTaxSet?.shopMoney?.amount),
          currency,
          customerEmail,
          customerName,
          productSummary,
          sourceName: order.sourceName || null,
          landingSite: null,
          referringSite: null,
          processedAt,
          rawData: order,
          lastFetchedAt: new Date(),
        },
        create: {
          userId: user.id,
          adAccountId: store.adAccountId,
          shopifyStoreId: store.id,
          shopifyOrderId: orderId,
          orderName: order.name || null,
          financialStatus: order.displayFinancialStatus || null,
          fulfillmentStatus: order.displayFulfillmentStatus || null,
          totalPrice,
          subtotalPrice: parseAmount(order.subtotalPriceSet?.shopMoney?.amount),
          totalTax: parseAmount(order.totalTaxSet?.shopMoney?.amount),
          currency,
          customerEmail,
          customerName,
          productSummary,
          sourceName: order.sourceName || null,
          landingSite: null,
          referringSite: null,
          processedAt,
          rawData: order,
        },
      })
      ordersSaved += 1

      if (isPaidShopifyOrder(order.displayFinancialStatus)) {
        await prisma.realSale.upsert({
          where: {
            provider_externalId: {
              provider: 'shopify',
              externalId: `${store.id}:${orderId}`,
            },
          },
          update: {
            status: 'paid',
            amount: totalPrice,
            currency,
            customerEmail,
            customerName,
            productName: productSummary,
            paidAt: processedAt,
            rawData: order,
          },
          create: {
            userId: user.id,
            adAccountId: store.adAccountId,
            clientId: store.adAccount?.clientId || null,
            provider: 'shopify',
            externalId: `${store.id}:${orderId}`,
            status: 'paid',
            amount: totalPrice,
            currency,
            customerEmail,
            customerName,
            productName: productSummary,
            source: order.sourceName || 'shopify',
            paidAt: processedAt,
            rawData: order,
          },
        })
        realSalesSaved += 1
      }
    }

    await prisma.shopifyStore.update({
      where: { id: store.id },
      data: {
        storeName: snapshot.shop.name || store.storeName,
        currency: snapshot.shop.currencyCode || store.currency,
        syncStatus: 'connected',
        syncError: snapshot.warning || null,
        lastSyncAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      productsSaved,
      ordersSaved,
      realSalesSaved,
      warning: snapshot.warning,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar Shopify'
    await prisma.shopifyStore.update({
      where: { id: store.id },
      data: {
        syncStatus: 'error',
        syncError: message,
      },
    })

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
