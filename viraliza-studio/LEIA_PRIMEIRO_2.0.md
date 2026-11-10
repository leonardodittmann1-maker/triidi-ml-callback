# Viraliza Studio 2.0

## Como abrir

O aplicativo principal é `index.html`. O novo **Piloto automático** fica em `automacao.html` e aparece como atalho na página principal. Para dados do catálogo aparecerem na central de automação, use ambas as páginas **na mesma origem HTTPS**.

## Novo na versão 2.0

- Calendário de divulgação de até 7 dias a partir do seu próprio catálogo (sem promessas de vendas nem dados de tendência fabricados).
- Seleção de produtos e canais próprios; rascunhos para revisão, aprovação por item e aprovação de lote com confirmação.
- Fila persistente em banco Cloudflare D1, cron a cada 5 min, pausa geral, controle de duplicatas, limites por canal e log de publicações.
- Publicadores backend oficiais preparados para Telegram, Pinterest, Instagram e Facebook, condicionados a credenciais, permissões e testes com cada conta.
- Telegram verifica se bot é administrador em canal/grupo antes de aceitar destino.
- Erros incertos NÃO fazem disparos automáticos repetidos: ficam em revisão.
- Contas TikTok e WhatsApp mantêm conteúdo assistido até existir integração oficial apropriada e autorizada.

## Ainda NÃO ativo automaticamente

- O Worker da automação não está implantado: precisa de Cloudflare D1, credenciais e aprovação das plataformas.
- O aplicativo é de usuário único e não sincroniza o catálogo entre dispositivos por conta própria; a fila estará no servidor quando este for ligado.
- Não agenda WhatsApp pessoal nem grupos de terceiros. Nada compra seguidores ou simula cliques.
- Publicação via Meta/Pinterest depende do status real da API da sua conta; validação técnica final só será possível depois de conectar credenciais em ambiente privado.

Leia `automation-worker/README.md` para o passo a passo.
