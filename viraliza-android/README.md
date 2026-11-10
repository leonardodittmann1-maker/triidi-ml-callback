# Viraliza Studio Android — projeto APK

Aplicativo Android **nativo como contêiner WebView** para o Viraliza Studio. Abre a aplicação HTTPS oficial e usa o armazenamento isolado do próprio APK. O app não precisa de computador ligado no dia a dia. A automação em segundo plano continua dependendo do Cloudflare Worker autorizado.

## O que já existe
- ID fixo `br.com.viralizastudio.mobile` e versão de instalação Android `1.0.0` / `versionCode 1`.
- WebView que abre somente a área do Viraliza no GitHub Pages; links externos são abertos fora do app.
- Botão **↻ Atualizar** presente no `index.html` e no `automacao.html` via `updater.js`.
- Atualizações da interface e ferramentas publicadas no GitHub Pages são verificadas pelo botão sem remover o APK.
- Se houver APK mais novo em `updates.json`, o aplicativo encaminha ao arquivo de release e o sistema Android confirma a atualização.
- O app suporta seleção de arquivos para importar backups e exportação de arquivos em Downloads/Viraliza Studio.

## Primeiro APK assinado (uma vez)
**Atenção:** o APK só poderá ser atualizado por cima sem perder os dados se todas as versões usarem o MESMO `applicationId` e a MESMA chave de assinatura, com `versionCode` progressivo. Guarde a assinatura privada.

1. Abra o repositório GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
2. Nome do secret: `VIRALIZA_ANDROID_SIGNING_JSON`.
3. Valor: cole a linha JSON contida no arquivo `ASSINATURA_PRIVADA/secret_github.txt` entregue separadamente, **nunca no repositório público**.
4. Salve e vá em **Actions → Viraliza Studio - compilar APK Android → Run workflow**.
5. Após o sucesso, o APK aparece em **Releases** e como artifact na execução do workflow. Instale o APK no Android; conceda ao Chrome permissão para instalar aplicativos apenas quando solicitado.
6. Na instalação inicial, importe seu backup do PWA antigo. O WebView tem dados locais diferentes do navegador Chrome.

Se faltar o secret, o workflow executa apenas a compilação e NÃO publica um APK sem assinatura confiável. A chave que assina o primeiro APK deve ser conservada para sempre.

## Para atualizar no futuro
- Mudanças nas telas e conteúdo: altere o site em `viraliza-studio`, aumente `webVersion` em `updates.json`, publique no GitHub Pages; botão **↻ Atualizar** no APK.
- Mudanças nativas (câmera, permissões etc.): aumente **versionCode** e **versionName** em `app/build.gradle`, use a MESMA chave do GitHub secret e execute o workflow manualmente. Atualize o endereço `apk.downloadUrl` em `viraliza-studio/updates.json` com a URL HTTPS do release, e o `versionCode`. No APK, toque **↻ Atualizar**; o Android pede confirmação para instalar sobre a versão antiga. **Não desinstale o APK.**
- Uma nova assinatura ou um novo `applicationId` impedirão a atualização e exigiriam desinstalar; por isso não os altere.

## Segurança e limites
- GitHub Pages precisa continuar disponível, pelo menos no primeiro carregamento; o Service Worker tenta oferecer cache offline quando disponível.
- As credenciais de afiliados e publicação ficam no servidor Cloudflare, não no código Android nem no GitHub público.
- O botão não instala APKs silenciosamente: é obrigatório o consentimento do usuário pelo sistema.
- Em `updates.json`, `apk.downloadUrl` começa nulo enquanto não existe APK assinado publicado. Não anuncie um link fictício.
- Recursos dos marketplaces, fornecedores, vendas sem estoque e automação não se tornam ativos só porque o APK foi criado.
