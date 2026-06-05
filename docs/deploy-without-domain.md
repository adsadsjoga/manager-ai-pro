# Publicar sem dominio proprio

Voce pode colocar o Ads Manager AI Pro online sem comprar dominio. A hospedagem vai gerar uma URL temporaria, por exemplo:

```txt
https://ads-manager-ai-pro.vercel.app
```

## Antes de publicar

- O banco Supabase precisa ter as tabelas novas ja aplicadas.
- As variaveis de ambiente precisam existir na hospedagem.
- `NEXT_PUBLIC_APP_URL` deve usar a URL temporaria da hospedagem.
- No Clerk, adicione a URL temporaria como URL permitida.
- No Stripe, adicione a URL temporaria nos webhooks e redirects.
- No Meta, adicione a URL temporaria quando usar login/callback em producao.

## Variaveis que precisam ir para a hospedagem

Use os valores do seu `.env.local`, mas cadastre direto no painel da hospedagem. Nao envie o arquivo `.env` para o GitHub.

```txt
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
WINDSOR_API_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
FROM_EMAIL
CRON_SECRET
META_ACCESS_TOKEN
META_API_VERSION
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER
STRIPE_PRICE_PRO
STRIPE_PRICE_AGENCY
NEXT_PUBLIC_APP_URL
```

## Comandos para salvar no GitHub

```bash
git add -A
git commit -m "Add real sales and Shopify sync foundation"
git push origin main
```

## Deploy recomendado

1. Entre na Vercel.
2. Importe o repositorio `adsadsjoga/manager-ai-pro`.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Cadastre as variaveis de ambiente.
7. Publique.
8. Copie a URL gerada e atualize `NEXT_PUBLIC_APP_URL`.

## Depois que tiver dominio

Troque a URL temporaria pelo dominio proprio no app, Clerk, Stripe, Meta e Shopify.
