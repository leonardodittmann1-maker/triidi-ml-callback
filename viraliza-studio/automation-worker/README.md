# Viraliza Studio 2.0 — servidor da automação (Cloudflare)

Este Worker publica no horário mesmo com o celular fechado **apenas** depois que você configura a rede, cadastra um destino administrado por você, aprova a publicação e ativa o calendário. Sem credenciais, nada é enviado. Não contém robô de seguidores, scraping, disparador de grupos ou acesso não autorizado.

## Passo a passo sem expor senhas

1. Crie conta gratuita em https://dash.cloudflare.com e acesse **Workers & Pages**.
2. Para configurar pelo computador, instale Node.js e abra um terminal na pasta `automation-worker`.
3. Execute `npx wrangler login`.
4. Execute `npx wrangler d1 create viraliza-automation` e copie **somente o database_id** exibido para `wrangler.toml`. Não use ID inventado.
5. Execute `npx wrangler d1 migrations apply viraliza-automation --remote` para criar tabelas e ligar a pausa inicial.
6. Execute `npx wrangler secret put DASHBOARD_TOKEN` e escolha uma chave aleatória longa, com 32+ caracteres (salve-a em gerenciador de senhas; ela será informada temporariamente no app).
7. Para Telegram, crie bot em **@BotFather**, adicione-o como administrador em seus canais/grupos autorizados, e execute `npx wrangler secret put TELEGRAM_BOT_TOKEN` com o token recebido. Se quiser receber avisos no seu privado, primeiro envie `/start` para o bot e configure `npx wrangler secret put ADMIN_ALERT_CHAT_ID` com o ID da sua própria conversa; esse recurso é opcional.
8. Para Pinterest, configure um aplicativo no **Pinterest Developers**, obtenha um token OAuth com permissões de leitura de pastas e criação de Pins; execute `npx wrangler secret put PINTEREST_ACCESS_TOKEN`.
9. Para Instagram profissional, registre aplicativo na **Meta for Developers**, passe pelas permissões necessárias de publicação e obtenha token autorizado; execute `npx wrangler secret put INSTAGRAM_ACCESS_TOKEN`.
10. Para Páginas do Facebook, use token autorizado com `pages_manage_posts` e permissões aplicáveis; execute `npx wrangler secret put FACEBOOK_PAGE_ACCESS_TOKEN`.
11. Verifique que `ALLOWED_ORIGIN` em `wrangler.toml` contém **somente a origem** HTTPS da plataforma (`https://leonardodittmann1-maker.github.io`), não a pasta `/viraliza-studio`.
12. Execute `npx wrangler deploy` e copie o endereço `https://viraliza-automation....workers.dev`.
13. Abra a página **Piloto automático** do Viraliza, escolha **Configurar servidor**, cole a URL e a chave temporária do passo 6. **Nunca cole as senhas das redes na plataforma**.
14. Cadastre um destino próprio (ex.: `@nomedoseucanal`), escolha seus produtos, gere o calendário, aprove os textos e clique em **Ativar**. Agendamentos já vêm pausados.

Sem computador, a instalação pode ser feita usando GitHub Codespaces (terminal no navegador) ou um ambiente de desenvolvimento Cloudflare. O formulário desta versão não configura segredos da Cloudflare sozinho.

## Por rede

**Telegram:** precisa do token do bot, canal/grupo permitido, bot administrador. Não adiciona membros, não manda DM e não publica em comunidades não autorizadas.

**Pinterest:** precisa de token OAuth oficial, uma pasta autorizada com ID numérico e **imagem HTTPS pública**. O Worker verifica a pasta antes de habilitar.

**Instagram:** conta profissional, autorização do app com escopo de publicação, token oficial e **imagem HTTPS pública**. A versão inclui os endpoints básicos do Instagram Login; pode exigir atualização de permissões, versões e comportamento de contêiner de mídia conforme conta/Meta. Só ative quando testado com a conta autorizada.

**Facebook:** Página administrada, token de Página oficial autorizado e ID numérico. A versão usa posts de Página pelo Graph API, não perfis pessoais.

**TikTok:** ainda requer fluxo de autorização, verificação de vídeos e possível auditoria da API; mantenha a publicação assistida no app principal.

**WhatsApp:** grupos tradicionais não têm publicação automática oficial para este caso. Use compartilhamento assistido. A Business Platform é separada e pressupõe consentimento e modelos de mensagens conforme as políticas vigentes.

**Shopee:** mantenha o Worker de afiliados na pasta `worker/`; ele não é o mesmo servidor da automação.

## Como funciona a segurança

- D1 guarda destinos, fila, estados e auditoria. `DASHBOARD_TOKEN` e tokens das redes ficam em **segredos** Cloudflare.
- CORS aceita somente a origem configurada; a chave de acesso é necessária mesmo fora do navegador.
- O app salva só a URL do Worker no navegador; o segredo digitado fica em memória apenas na sessão.
- O cron roda a cada 5 minutos (UTC). Publicações não são instantâneas; o horário pode sofrer atrasos de execução da plataforma.
- O calendário inicia **pausado**. Toda publicação inicia em `review`, só entra em `approved` depois de aprovação explícita.
- Filtro de destinos: apenas canais/grupos em que o bot Telegram seja administrador, pastas Pinterest e contas autorizadas. O usuário declara a administração do destino.
- Máximo de 2 envios diários por destino e intervalo mínimo de 3 horas; não aumenta isso automaticamente para buscar visualizações.
- Sem repetição automática em caso de erro ou tempo limite. O usuário deve confirmar se publicou ou não antes de reaprovar, evitando duplicatas.
- O catálogo permanece local no navegador e a fila existe no D1. O calendário só usa produtos que você escolher e enviar; não consulta outras pessoas nem usa dados inventados.
- Acesso de dono único; para múltiplos usuários, substitua a chave por autenticação robusta com identidade e permissões. Não publique o segredo nem a URL com token na query string.

## Testes

`npm test` valida formato de URL, avisos publicitários e horários. Teste também `npx wrangler dev --local` e a fila com destino de teste autorizado antes de ativar publicação real.

## Aviso sobre limites

Implantação deste servidor ainda depende de sua conta Cloudflare e das permissões dos marketplaces. O fato de a interface exibir um conector não significa que ele esteja autenticado.
