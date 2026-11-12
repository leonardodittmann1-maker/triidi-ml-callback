# TikTok Auto Creator
Este módulo usa FASHN Product-to-Model e Image-to-Video (APIs pagas por créditos) e D1 com fila cron.
1. Na pasta automation-worker, execute npx wrangler d1 migrations apply viraliza-automation --remote.
2. Cadastre segredo: npx wrangler secret put FASHN_API_KEY; depois npx wrangler deploy.
3. Opcional: crie npx wrangler r2 bucket create viraliza-creator-media e configure binding CREATOR_MEDIA para arquivar arquivos. Sem R2, URLs do FASHN expiram em cerca de 3 dias.
4. Abra TikTok Auto Creator no Viraliza; conecte a URL do mesmo Worker e DASHBOARD_TOKEN.
5. Cadastre produtos com foto HTTPS e link de afiliado, confirme os créditos antes de gerar.
6. Reveja vídeos e vincule carrinho pelo TikTok Shop manualmente. A API Shoppable Video requer credenciais de parceiro e NÃO está conectada.
NÃO coloque credenciais em HTML, GitHub, chat ou APK. Use conteúdo de IA com identificação e imagens com autorização.
Docs: https://docs.fashn.ai/api-reference/product-to-model https://docs.fashn.ai/api-reference/image-to-video
