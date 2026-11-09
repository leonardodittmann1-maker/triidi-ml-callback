# Shopee Affiliate API (integração opcional)

Este backend está **preparado**, não está hospedado ou conectado a uma conta. Não há produtos reais até que a Shopee autorize a API e você publique o Worker com os segredos.

## Colocar no ar

1. Ter uma conta de afiliado Shopee com acesso à Open API (App ID e App Secret).
2. Criar conta Cloudflare e configurar o Workers (plano gratuito pode ser suficiente para uso pessoal, sujeito a limites do serviço).
3. Dentro desta pasta, executar `npx wrangler login` e depois `npx wrangler deploy`.
4. Criar cada segredo no ambiente: `npx wrangler secret put SHOPEE_APP_ID`, `npx wrangler secret put SHOPEE_APP_SECRET`, `npx wrangler secret put APP_ACCESS_TOKEN`. Use uma chave aleatória forte, diferente da senha da Shopee; guarde-a em local seguro.
5. Ajustar `ALLOWED_ORIGIN` no `wrangler.toml` para a origem HTTPS do site onde o aplicativo será instalado. Exemplo: `https://leonardodittmann1-maker.github.io` (sem caminho /viraliza-studio).
6. Executar `npx wrangler deploy` novamente após definir `ALLOWED_ORIGIN`.
7. No Radar do aplicativo, registrar a URL HTTPS do seu Worker. Informe apenas a **chave de acesso do aplicativo** no campo temporário. **Nunca coloque o App Secret da Shopee no navegador.**
8. Pesquise por palavras-chave. Produtos com link `offerLink` podem ser importados para o catálogo. Revise preços e comissões antes de usar.

A API de afiliados pode ter campos e permissões diferentes por conta. A implementação usa a documentação pública da Shopee e precisa ser validada com credenciais oficiais reais. Os resultados da API são produtos elegíveis/campanhas, não vendas da sua conta. Nenhuma comissão é prometida.

## Segurança

- O Worker rejeita chamadas de outras origens de navegador e exige um token de acesso. CORS **não é** uma barreira contra clientes fora do navegador; trate a chave `APP_ACCESS_TOKEN` como segredo.
- A chave de acesso digitada pelo usuário não é salva no `localStorage`, nem exportada no backup; só permanece em memória até fechar/atualizar a página.
- Para uma implantação multiusuário, troque essa autenticação simples por contas e permissões no servidor (ex.: Cloudflare Access). Não use esta configuração para um serviço público multiusuário.
- Não coloque arquivos `.dev.vars` ou `.env` com credenciais no GitHub.
- Se você publicar em uma origem diferente (site ou domínio), atualize `ALLOWED_ORIGIN`.
