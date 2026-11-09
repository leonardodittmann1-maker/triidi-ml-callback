/** Viraliza Studio - adaptador Shopee Affiliate Open API.
 * Credenciais nunca são enviadas ao navegador nem incluídas no repositório.
 * Requer Cloudflare Worker com segredos SHOPEE_APP_ID, SHOPEE_APP_SECRET e APP_ACCESS_TOKEN.
 * A API foi baseada em campos documentados publicamente; a Shopee pode alterar schema ou permissões.
 */
const AFFILIATE_API = 'https://open-api.affiliate.shopee.com.br/graphql';
const encoder = new TextEncoder();
const json = (data, status, headers) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const sha256 = async (content) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(content)))).map(x => x.toString(16).padStart(2,'0')).join('');
const asRate = value => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round((n >= 0 && n <= 1 ? n * 100 : n) * 100) / 100 : 0;
};
const asPrice = v => { const n = Number(v ?? 0); return Number.isFinite(n) && n > 0 ? n : 0; };
const asInt = v => { const n = Number(v ?? 0); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };

async function requestShopee(body, env) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify(body);
  const signature = await sha256(`${env.SHOPEE_APP_ID}${timestamp}${payload}${env.SHOPEE_APP_SECRET}`);
  const response = await fetch(AFFILIATE_API, {
    method:'POST', headers: {
      'Content-Type':'application/json',
      Authorization: `SHA256 Credential=${env.SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`
    }, body: payload, redirect:'error'
  });
  if(!response.ok) throw new Error(`Shopee respondeu HTTP ${response.status}`);
  const data = await response.json();
  if(data.errors?.length) throw new Error(data.errors.map(x => x.message || 'Erro GraphQL').join('; ').slice(0,180));
  return data.data || {};
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    // ALLOWED_ORIGIN aceita uma única origem HTTPS (ex.: GitHub Pages). Não use '*'.
    const allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/,'');
    const cors = {
      'Access-Control-Allow-Origin': origin && origin === allowed ? origin : allowed,
      'Vary': 'Origin',
      'Access-Control-Allow-Headers':'Authorization, Content-Type',
      'Access-Control-Allow-Methods':'GET, POST, OPTIONS'
    };
    if(request.method === 'OPTIONS') return origin === allowed ? new Response(null,{status:204,headers:cors}) : json({error:'Origem não permitida'},403,{});
    if(!allowed || (origin && origin !== allowed)) return json({error:'Origem não permitida'},403,{});
    if(!env.APP_ACCESS_TOKEN || !env.SHOPEE_APP_ID || !env.SHOPEE_APP_SECRET) return json({error:'Servidor sem credenciais configuradas'},503,cors);
    if(request.headers.get('Authorization') !== `Bearer ${env.APP_ACCESS_TOKEN}`) return json({error:'Chave de acesso inválida'},401,cors);
    const url = new URL(request.url);
    try {
      if(request.method === 'GET' && url.pathname === '/api/status') return json({status:'ok',marketplace:'Shopee',mode:'authenticated'},200,cors);
      if(request.method === 'GET' && url.pathname === '/api/shopee/products') {
        const keyword = (url.searchParams.get('keyword') || '').trim().slice(0,90);
        if(keyword.length < 2) return json({error:'Digite pelo menos dois caracteres.'},400,cors);
        const sort = ['1','2','5'].includes(url.searchParams.get('sort')) ? url.searchParams.get('sort') : '1';
        const query = `query { productOfferV2(keyword: ${JSON.stringify(keyword)}, sortType: ${sort}, page: 1, limit: 20) { nodes { itemId productName offerLink imageUrl priceMin sales commissionRate } pageInfo { page hasNextPage } } }`;
        const result = await requestShopee({query},env);
        const nodes = result.productOfferV2?.nodes || [];
        return json({items:nodes.map(x => ({
          id:String(x.itemId ?? ''),name:String(x.productName ?? ''),
          affiliateUrl:String(x.offerLink ?? ''),imageUrl:String(x.imageUrl ?? ''),
          price:asPrice(x.priceMin),commission:asRate(x.commissionRate),sales:asInt(x.sales)
        })),hasNextPage:!!result.productOfferV2?.pageInfo?.hasNextPage},200,cors);
      }
      if(request.method === 'POST' && url.pathname === '/api/shopee/link') {
        const data = await request.json().catch(()=>null);
        const originUrl=String(data?.originUrl||'').trim();
        let parsed;try{parsed=new URL(originUrl)}catch{return json({error:'URL de produto inválida.'},400,cors)}
        if(parsed.protocol !== 'https:' || !['shopee.com.br','www.shopee.com.br','s.shopee.com.br','shope.ee'].includes(parsed.hostname)) return json({error:'Use um link HTTPS oficial da Shopee.'},400,cors);
        const subIds=Array.isArray(data?.subIds)?data.subIds.slice(0,5).map(x=>String(x).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,30)).filter(Boolean):[];
        const query = `mutation { generateShortLink(input: { originUrl: ${JSON.stringify(originUrl)}, subIds: ${JSON.stringify(subIds)} }) { shortLink } }`;
        const result = await requestShopee({query},env);
        const affiliateUrl=String(result.generateShortLink?.shortLink || '');
        if(!affiliateUrl.startsWith('https://')) throw new Error('API não retornou um link de afiliado válido.');
        return json({affiliateUrl},200,cors);
      }
      return json({error:'Rota inexistente.'},404,cors);
    } catch(error) {
      // Não registra payloads nem tokens e não expõe detalhes internos do servidor.
      return json({error:String(error.message||'A consulta falhou.').slice(0,220)},502,cors);
    }
  }
};
