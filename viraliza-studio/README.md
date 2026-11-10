# Viraliza Studio 2.0 — atualização da automação

Abra `automacao.html` ou o atalho **Piloto automático** no aplicativo. Consulte `LEIA_PRIMEIRO_2.0.md` e `automation-worker/README.md` antes de conectar as redes.

---

# Viraliza Studio v1.1 — plataforma de apoio a afiliados

Aplicação web responsiva e instalável como PWA. Desenvolvida em HTML, CSS e JavaScript. **Sem necessidade de pagar mensalidade para executar o código.**

## Novidades da versão 1.1

- Radar de oportunidades com **pontuação explicável**, calculada com dados que você cadastrou (não é previsão de vendas nem consulta automática de viralização).
- Consulta de produtos da **Shopee Affiliate Open API**, **opcional** e dependente da autorização da Shopee e de seu servidor; fluxo de importação de ofertas com link já rastreável.
- Gerador de short link Shopee, com sub-ID opcional, pelo backend autorizado.
- Importação de CSV de resultados com checagem de duplicidade. Valide os valores e status no painel oficial da loja.
- Novo fluxo para cadastrar produto a partir de um link de afiliado, identificando o marketplace pelo domínio.
- Ícones PNG próprios para instalação Android; service worker atualizado.

## Funcionalidades incluídas

- Catálogo próprio de produtos com preços, comissão, marketplace, links de afiliado, foto por URL, filtros, favoritos e importação em lote.
- Estúdio de conteúdo: textos para redes sociais, roteiro em cenas para vídeos curtos, arte promocional em PNG e vídeo básico em WebM quando o navegador permitir.
- Divulgação multirrede assistida para Instagram, WhatsApp, TikTok, X, Pinterest, Facebook, Telegram, LinkedIn e Reddit. O aplicativo abre as ferramentas oficiais de publicação; não publica sozinho.
- Fluxo de TikTok Shop e planejamento de ofertas com revisão manual.
- Campanhas: textos específicos para vários canais, data planejada, status, edição e confirmação manual de publicação.
- Vitrine personalizada: nome, descrição, cor, seleção de produtos e exportação de arquivo HTML independente contendo seus links de afiliado.
- Resultado: registros manuais de cliques, valores de venda e comissões. Sem simulação de faturamento.
- Contas: registro de perfis públicos (não conecta contas ou armazena senhas), informações sobre integrações futuras.
- Importação CSV/JSON, exportação de relatórios CSV e backup/restauração JSON.
- Visual adaptado para celulares e computadores. Funciona como PWA após publicação por HTTPS.

## Começar

1. Abra `index.html` com um navegador no computador para inspecionar a interface. O arquivo `viraliza_studio_mobile.html`, incluído no ZIP, reúne HTML, CSS e JS em um único arquivo para teste rápido, quando o navegador permitir.
2. Para usar o app instalado e com armazenamento mais consistente, publique toda esta pasta em hospedagem HTTPS (exemplo: GitHub Pages).
3. No GitHub, crie um repositório **novo**, coloque o conteúdo da pasta na raiz, acesse **Settings → Pages → Deploy from a branch → main → / (root)** e abra o endereço publicado após o GitHub concluir a publicação.
4. No Chrome do Android, abra esse endereço HTTPS e use o menu **Instalar aplicativo** ou **Adicionar à tela inicial**.
5. Cadastre seus produtos e links obtidos no painel oficial das lojas, ou importe um CSV. Crie conteúdo, prepare campanhas e exporte sua vitrine.

`modelo_importacao.csv` mostra os cabeçalhos usados na importação. Preencha com produtos reais e URLs de afiliados válidas. Não foram colocados links falsos no catálogo.

## Dados e limitações importantes

- A plataforma **não consulta um catálogo viral em tempo real**, não sabe quais produtos estão vendendo mais e **não cria links de afiliado automaticamente**. Para isso são necessárias integrações oficiais autorizadas, geralmente com credenciais e backend.
- Não há contas online, sincronização entre aparelhos, nem sistema de venda ou de pagamento incorporado.
- A geração de texto funciona por modelos locais; não chama IA externa. O vídeo WebM é uma peça de divulgação gráfica simples, não uma filmagem real do produto. Confira direitos de uso, preço e estoque antes de publicar.
- Os resultados são introduzidos manualmente; não são comissões obtidas automaticamente do programa de afiliados. O app não afirma que abrir um link equivale a realizar uma venda.
- Dados ficam no `localStorage` do navegador. **Faça backup JSON frequente**; limpar os dados do navegador remove o cadastro. O arquivo único aberto diretamente pode sofrer restrições de armazenamento conforme o Android/navegador. Para uso continuado, prefira HTTPS.
- A vitrine exportada não fica online automaticamente; é preciso hospedar o HTML e usar os seus próprios links de afiliado. Respeite as regras das lojas e identifique publicidade e afiliação.
- Nunca coloque senhas, tokens ou cookies de afiliados em campos do app. Integrações futuras devem armazenar credenciais de forma segura no servidor.

## Arquivos

- `index.html` — aplicativo principal.
- `styles.css` — estilo adaptado para celular.
- `app.js` — funcionalidades.
- `icon.svg`, `manifest.webmanifest`, `sw.js` — instalação como PWA e cache de arquivos.
- `viraliza_studio_mobile.html` — alternativa de arquivo único para testes.
- `modelo_importacao.csv` — cabeçalhos para importar produtos.

## Publicação da versão 1.1

- Para publicar o app no GitHub Pages, envie **todos os arquivos da raiz desta pasta** (não a pasta `worker`, que é um backend separado) para um diretório próprio do repositório, por exemplo `viraliza-studio/`.
- Em repositório com Pages ativo, a URL será `https://USUARIO.github.io/REPOSITORIO/viraliza-studio/`. **Não é possível afirmar que está no ar antes de testar o link publicado.**
- No Android, abra a URL HTTPS no Chrome e use *Instalar aplicativo* ou *Adicionar à tela inicial*.
- Para habilitar integração Shopee, siga `worker/README.md` e configure a URL + chave temporária no Radar. Não cole a senha/App Secret da Shopee no app.
- `modelo_resultados.csv` é um **exemplo** de formato esperado para importar resultados genéricos e não contém venda real.
- Não há login nem sincronização entre dispositivos. O catálogo continua no armazenamento do navegador. Faça backups antes de trocar de aparelho ou limpar dados.
