type ShopifyGraphqlResponse<T> = {
  data?: T
  errors?: unknown
}

export type ShopifyShop = {
  name: string
  currencyCode: string
}

export type ShopifyProductNode = {
  id: string
  title: string
  handle?: string | null
  status?: string | null
  productType?: string | null
  vendor?: string | null
  featuredMedia?: {
    image?: {
      url?: string | null
    } | null
  } | null
  variants?: {
    nodes?: Array<{
      price?: string | null
      inventoryQuantity?: number | null
    }>
  }
}

export type ShopifyOrderNode = {
  id: string
  name?: string | null
  createdAt: string
  processedAt?: string | null
  displayFinancialStatus?: string | null
  displayFulfillmentStatus?: string | null
  email?: string | null
  sourceName?: string | null
  landingPageUrl?: string | null
  referrerUrl?: string | null
  customer?: {
    displayName?: string | null
    email?: string | null
  } | null
  totalPriceSet?: {
    shopMoney?: {
      amount?: string | null
      currencyCode?: string | null
    } | null
  } | null
  subtotalPriceSet?: {
    shopMoney?: {
      amount?: string | null
    } | null
  } | null
  totalTaxSet?: {
    shopMoney?: {
      amount?: string | null
    } | null
  } | null
  lineItems?: {
    nodes?: Array<{
      name?: string | null
      quantity?: number | null
    }>
  }
}

type ShopifySnapshot = {
  shop: ShopifyShop
  products: ShopifyProductNode[]
  orders: ShopifyOrderNode[]
  warning?: string
}

const SHOPIFY_API_VERSION = '2025-10'

function normalizeShopDomain(shopDomain: string) {
  return shopDomain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

function validateAdminDomain(shopDomain: string) {
  if (!shopDomain.endsWith('.myshopify.com')) {
    throw new Error(
      'Use o dominio interno da Shopify, no formato sua-loja.myshopify.com. O dominio publico da loja nao funciona para a Admin API.'
    )
  }
}

function gidToId(gid: string) {
  return gid.split('/').pop() || gid
}

export function shopifyNodeId(gid: string) {
  return gidToId(gid)
}

function formatShopifyErrors(errors: unknown) {
  if (!errors) return ''

  if (Array.isArray(errors)) {
    return errors
      .map((error) => {
        if (typeof error === 'string') return error
        if (error && typeof error === 'object' && 'message' in error) {
          return String((error as { message?: unknown }).message || 'Erro Shopify')
        }
        return JSON.stringify(error)
      })
      .join(' | ')
  }

  if (typeof errors === 'string') return errors

  if (errors && typeof errors === 'object' && 'message' in errors) {
    return String((errors as { message?: unknown }).message || 'Erro Shopify')
  }

  return JSON.stringify(errors)
}

async function shopifyGraphql<T>(params: {
  shopDomain: string
  accessToken: string
  query: string
  variables?: Record<string, unknown>
}) {
  const shopDomain = normalizeShopDomain(params.shopDomain)
  validateAdminDomain(shopDomain)
  const response = await fetch(
    `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': params.accessToken,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables || {},
      }),
    }
  )
  const text = await response.text()
  let data: ShopifyGraphqlResponse<T>

  try {
    data = JSON.parse(text) as ShopifyGraphqlResponse<T>
  } catch {
    throw new Error(`Shopify respondeu ${response.status}: ${text.slice(0, 180)}`)
  }

  const errorMessage = formatShopifyErrors(data.errors)

  if (!response.ok || errorMessage) {
    if (response.status === 401) {
      throw new Error('Token da Shopify invalido ou sem permissao. Gere um Admin API access token com permissao de produtos e pedidos.')
    }

    if (response.status === 403) {
      throw new Error('Token da Shopify sem permissao suficiente. Revise as permissoes de produtos e pedidos no app privado/custom app.')
    }

    if (response.status === 404) {
      throw new Error(
        'Loja Shopify nao encontrada. Confira o dominio interno exato da loja em Settings > Domains no admin da Shopify. Ele precisa terminar em .myshopify.com.'
      )
    }

    throw new Error(errorMessage || `Shopify respondeu ${response.status}`)
  }

  if (!data.data) throw new Error('Shopify nao retornou dados')
  return data.data
}

export async function fetchShopifySnapshot(params: {
  shopDomain: string
  accessToken: string
  since?: string
}) {
  const since =
    params.since ||
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const baseQuery = `
    query AdsManagerShopifyBase {
      shop {
        name
        currencyCode
      }
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          handle
          status
          productType
          vendor
          featuredMedia {
            ... on MediaImage {
              image {
                url
              }
            }
          }
          variants(first: 10) {
            nodes {
              price
              inventoryQuantity
            }
          }
        }
      }
    }
  `
  const ordersQuery = `
    query AdsManagerShopifyOrders($orderQuery: String!) {
      orders(first: 50, query: $orderQuery, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          createdAt
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          email
          sourceName
          customer {
            displayName
            email
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
            }
          }
          totalTaxSet {
            shopMoney {
              amount
            }
          }
          lineItems(first: 10) {
            nodes {
              name
              quantity
            }
          }
        }
      }
    }
  `

  const baseData = await shopifyGraphql<{
    shop: ShopifyShop
    products: { nodes: ShopifyProductNode[] }
  }>({
    shopDomain: params.shopDomain,
    accessToken: params.accessToken,
    query: baseQuery,
  })

  try {
    const ordersData = await shopifyGraphql<{
      orders: { nodes: ShopifyOrderNode[] }
    }>({
      shopDomain: params.shopDomain,
      accessToken: params.accessToken,
      query: ordersQuery,
      variables: {
        orderQuery: `processed_at:>=${since}`,
      },
    })

    return {
      shop: baseData.shop,
      products: baseData.products.nodes || [],
      orders: ordersData.orders.nodes || [],
    } satisfies ShopifySnapshot
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar pedidos Shopify'
    return {
      shop: baseData.shop,
      products: baseData.products.nodes || [],
      orders: [],
      warning: `Produtos sincronizados. Pedidos nao foram puxados: ${message}`,
    } satisfies ShopifySnapshot
  }
}
