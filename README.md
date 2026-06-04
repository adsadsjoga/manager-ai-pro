# Ads Manager AI Pro

SaaS em Next.js para acompanhar campanhas do Facebook Ads com dados da Windsor.ai,
dashboard operacional, analise automatica, alertas e configuracoes por conta.

## Status do MVP

### Fase 1 - MVP Core

- Autenticacao com Clerk
- Sincronizacao manual Windsor.ai
- Dados persistidos via Prisma/PostgreSQL
- Dashboard com metricas reais
- Auditoria de compras por action type
- Pagina detalhada de campanhas
- Configuracoes basicas de conta, moeda e timezone
- Analise IA/rules-based com historico salvo

### Fase 2 - Alertas e automacoes

- 12 regras automaticas configuraveis
- Central de alertas com leitura e resolucao
- Cooldown para evitar alertas duplicados
- Alertas gerados apos analise e sincronizacao
- Endpoint interno de cron para sync automatico
- Base de envio de email via Resend

## Rotas principais

- `/dashboard`
- `/dashboard/campaigns`
- `/dashboard/alerts`
- `/dashboard/settings`
- `/api/sync`
- `/api/analyze`
- `/api/alert-rules`
- `/api/cron/sync`

## Variaveis de ambiente

```bash
DATABASE_URL=
WINDSOR_API_KEY=
WINDSOR_ACCOUNT_ID=
DEFAULT_CURRENCY=EUR

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Fase 2
CRON_SECRET=
RESEND_API_KEY=
FROM_EMAIL="Ads Manager AI <noreply@seudominio.com>"
```

## Cron automatico

O endpoint `/api/cron/sync` sincroniza os ultimos 7 dias e roda o motor de
alertas. Ele deve ser chamado com:

```bash
Authorization: Bearer $CRON_SECRET
```

Tambem funciona com `?secret=$CRON_SECRET` para agendadores simples.

## Comandos

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
