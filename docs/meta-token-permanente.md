# Meta API: token estavel para criativos

O erro `Session has expired` acontece quando o app usa um token temporario gerado no Graph API Explorer. Esse token serve para testar, mas expira rapido e por isso a pagina de criativos para de sincronizar.

Para producao, use um token de System User no Meta Business Manager:

1. Abra Meta Business Settings.
2. Entre em Users > System users.
3. Crie ou selecione um System User.
4. Dê acesso ao app Meta usado pelo Ads Manager AI Pro.
5. Dê acesso as contas de anuncio que o cliente vai analisar.
6. Gere um token com permissoes de leitura de anuncios e metricas, como `ads_read`.
7. Salve esse token na Vercel em `META_ACCESS_TOKEN`.
8. Faca redeploy.

Esse token nao e literalmente eterno: ele pode parar se for revogado, se a permissao mudar, se o app perder acesso ao business ou se a Meta exigir revisao. Mas e o caminho correto para deixar a integracao estavel sem depender do Graph API Explorer.

Enquanto o token temporario estiver em uso, a pagina de criativos pode continuar mostrando dados antigos salvos, mas a sincronizacao com a Meta vai falhar quando o token expirar.
