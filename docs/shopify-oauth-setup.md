# Shopify OAuth setup

Use este fluxo para clientes conectarem a propria loja sem copiar token manualmente.

## Variaveis na Vercel

```txt
SHOPIFY_CLIENT_ID=Client ID do app Shopify
SHOPIFY_CLIENT_SECRET=Secret do app Shopify
NEXT_PUBLIC_APP_URL=https://sua-url-da-vercel-ou-dominio.com
```

Tambem funciona com os aliases antigos:

```txt
SHOPIFY_API_KEY
SHOPIFY_API_SECRET
```

## URLs no Shopify Dev Dashboard

No app da Shopify, configure:

```txt
App URL:
https://sua-url-da-vercel-ou-dominio.com/dashboard/shopify

Allowed redirection URL:
https://sua-url-da-vercel-ou-dominio.com/api/shopify/callback
```

## Scopes

Permissoes usadas pelo Ads Manager AI:

```txt
read_products
read_orders
read_customers
read_inventory
```

## Fluxo no app

1. O cliente entra em `/dashboard/shopify`.
2. Informa o dominio interno `sua-loja.myshopify.com`.
3. Clica em `Conectar com Shopify`.
4. Autoriza a loja na Shopify.
5. Volta para `/dashboard/shopify`.
6. Clica em `Sincronizar` para puxar produtos, pedidos e vendas reais.
