/** Viraliza Automation — owner-only Cloudflare Worker, D1 + cron.
 * No browser-side platform credentials; all dispatch is explicit opt-in and approved.
 * Telegram channels/groups require administrator permissions; no unsolicited direct messaging.
 */
import {creatorRoute,creatorTick} from './creator.js';
const CORS_HEADERS = 'authorization,content-type';
const MAX_JOBS_PER_DESTINATION_PER_DAY = 2;
const MIN_INTERVAL_MS = 3 * 3600 * 1000;
const SAFE_PLATFORMS = ['telegram','pinterest','instagram','facebook'];
const nowISO = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const clean = (v,max=500) => String(v??'').trim().slice(0,max);
const validHttps = value => { try { let u=new URL(value); return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.toString():''; } catch{return '';} };
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const brDay = date => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const connected = env => ({telegram:!!env.TELEGRAM_BOT_TOKEN,pinterest:!!env.PINTEREST_ACCESS_TOKEN,instagram:!!env.INSTAGRAM_ACCESS_TOKEN,facebook:!!env.FACEBOOK_PAGE_ACCESS_TOKEN});
function response(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});}
function okSource(source){return clean(source,180).replace(/[^\w\sÀ-ÿ.,:;!?'"()\-\/]/g,'');}
function generateText(product,platform,variant=0){
 const name=clean(product.name,120),category=clean(product.category,65),price=Number(product.price),old=Number(product.oldPrice),kind=clean(product.type||'produto',20);
 const hooks=['Uma sugestão para conhecer','Seleção da semana','Uma indicação para conferir','Ideia para quem gosta de novidades'];
 let txt=`✨ ${hooks[variant%hooks.length]}: ${name}\n`;
 if(kind==='grupo' || kind==='perfil'){
  txt += `Se o assunto interessar, conheça ${kind==='grupo'?'este grupo':'este perfil'} e participe apenas se quiser.\n`;
 }else{
  if(category)txt+=`Categoria: ${category}\n`;
  if(Number.isFinite(price)&&price>0)txt+=`Preço informado: R$ ${price.toFixed(2).replace('.',',')} (confira na loja).\n`;
  if(Number.isFinite(old)&&old>price&&price>0)txt+=`Preço anterior informado: R$ ${old.toFixed(2).replace('.',',')} (verifique a promoção).\n`;
 }
 txt+=`Veja os detalhes em: ${product.affiliateUrl}\n\nPublicidade${kind==='produto'?' • Posso receber comissão por compras qualificadas.':' • Divulgação de comunidade/perfil.'}`;
 return txt.slice(0,platform==='pinterest'?490:1800);
}
const platformSlots={telegram:'15:15',pinterest:'20:45',instagram:'22:00',facebook:'21:15'}; // 12h15, 17h45, 19h, 18h15 BRT: horários iniciais, não dados de audiência.
function priority(x){let score=0;if(Number(x.commission)>0)score+=Math.min(25,Number(x.commission));if(Number(x.oldPrice)>Number(x.price)&&Number(x.price)>0)score+=Math.min(25,Math.round(100*(1-x.price/x.oldPrice)));if(validHttps(x.imageUrl))score+=15;if(x.category)score+=8;if(x.source)score+=7;return score;}
async function notifyOwner(env,message){if(!env.TELEGRAM_BOT_TOKEN||!env.ADMIN_ALERT_CHAT_ID)return;try{await telegramCall(env,'sendMessage',{chat_id:env.ADMIN_ALERT_CHAT_ID,text:clean(message,700),disable_web_page_preview:true});}catch{/* Notificações são opcionais: nunca interferem na publicação. */}}

const errText = (e)=>clean(e?.message||e,220).replace(/(Bearer|access_token|token)\s*[=:]\s*\S+/gi,'[credencial protegida]');
async function callJson(url, options={}) { const r=await fetch(url,{...options,redirect:'error'});let b={};try{b=await r.json()}catch{};if(!r.ok||b.ok===false||b.error){const detail=clean(b.description||b.error?.message||b.message||`HTTP ${r.status}`,200);throw new Error(`API ${r.status}: ${detail}`)}return b;}
async function telegramCall(env,method,payload){return callJson(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}
async function verifyDestination(platform,target,env){
 if(!connected(env)[platform])return {ready:false,detail:'Credencial ainda não configurada no Worker'};
 if(platform==='telegram'){
  const data=await telegramCall(env,'getChat',{chat_id:target});
  if(!['channel','group','supergroup'].includes(data.result?.type))throw new Error('Use apenas canais ou grupos administrados; conversas privadas não são aceitas.');
  const me=await telegramCall(env,'getMe',{});
  const member=await telegramCall(env,'getChatMember',{chat_id:target,user_id:me.result.id});
  if(member.result?.status!=='administrator'&&member.result?.status!=='creator')throw new Error('O bot deve ser administrador do grupo ou canal.');
  if(data.result.type==='channel'&&member.result.can_post_messages===false)throw new Error('Permita que o bot publique no canal.');
  return {ready:true,detail:data.result.title||target};
 }
 if(platform==='pinterest'){await callJson(`https://api.pinterest.com/v5/boards/${encodeURIComponent(target)}`,{headers:{Authorization:`Bearer ${env.PINTEREST_ACCESS_TOKEN}`}});return {ready:true,detail:'Pasta autorizada'};}
 if(platform==='instagram'){await callJson(`https://graph.instagram.com/${clean(env.IG_GRAPH_VERSION||'v23.0',10)}/${encodeURIComponent(target)}?fields=id,username&access_token=${encodeURIComponent(env.INSTAGRAM_ACCESS_TOKEN)}`);return {ready:true,detail:'Conta autorizada'};}
 if(platform==='facebook'){await callJson(`https://graph.facebook.com/${clean(env.FB_GRAPH_VERSION||'v23.0',10)}/${encodeURIComponent(target)}?fields=id,name&access_token=${encodeURIComponent(env.FACEBOOK_PAGE_ACCESS_TOKEN)}`);return {ready:true,detail:'Página autorizada'};}
 throw new Error('Plataforma indisponível');
}
async function dispatch(job, dest, env){
 const body=job.body.trim();
 if(dest.platform==='telegram'){
  const data=await telegramCall(env,'sendMessage',{chat_id:dest.external_id,text:body,disable_web_page_preview:false});
  const chatId=data.result?.chat?.id, msgId=data.result?.message_id;
  const id=msgId?String(msgId):'';
  const url=data.result?.chat?.username&&id?`https://t.me/${data.result.chat.username}/${id}`:'';
  return {id,url};
 }
 if(dest.platform==='pinterest'){
  if(!validHttps(job.image_url))throw new Error('Pinterest precisa de imagem HTTPS pública.');
  const b=await callJson('https://api.pinterest.com/v5/pins',{method:'POST',headers:{Authorization:`Bearer ${env.PINTEREST_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({board_id:dest.external_id,title:job.title.slice(0,100),description:body.slice(0,500),link:job.link,media_source:{source_type:'image_url',url:job.image_url,is_standard:true}})});
  return {id:String(b.id||''),url:b.id?`https://www.pinterest.com/pin/${b.id}/`:''};
 }
 if(dest.platform==='instagram'){
  if(!validHttps(job.image_url))throw new Error('Instagram precisa de imagem HTTPS pública.');
  const base=`https://graph.instagram.com/${clean(env.IG_GRAPH_VERSION||'v23.0',10)}/${encodeURIComponent(dest.external_id)}`;
  const media=await callJson(base+'/media',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({image_url:job.image_url,caption:body,access_token:env.INSTAGRAM_ACCESS_TOKEN})});
  if(!media.id)throw new Error('Instagram não retornou contêiner de mídia.');
  const pub=await callJson(base+'/media_publish',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({creation_id:media.id,access_token:env.INSTAGRAM_ACCESS_TOKEN})});
  return {id:String(pub.id||''),url:''};
 }
 if(dest.platform==='facebook'){
  const base=`https://graph.facebook.com/${clean(env.FB_GRAPH_VERSION||'v23.0',10)}/${encodeURIComponent(dest.external_id)}/feed`;
  const pub=await callJson(base,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({message:body,link:job.link,access_token:env.FACEBOOK_PAGE_ACCESS_TOKEN})});
  return {id:String(pub.id||''),url:pub.id?`https://www.facebook.com/${pub.id.replace('_','/posts/')}`:''};
 }
 throw new Error('Canal não suportado para publicação automática');
}
async function audit(env,jobId,action,detail=''){await env.DB.prepare('INSERT INTO audit (id,job_id,action,detail,created_at) VALUES (?,?,?,?,?)').bind(uid(),jobId,action,clean(detail,300),nowISO()).run();}
async function queueOne(env,payload){
 const destinationId=clean(payload.destinationId,100);
 const dest=await env.DB.prepare('SELECT * FROM destinations WHERE id=? AND enabled=1').bind(destinationId).first();
 if(!dest)throw new Error('Destino não cadastrado ou desativado.');
 const title=clean(payload.title,130), body=clean(payload.body,2000), link=validHttps(payload.link), image=payload.imageUrl?validHttps(payload.imageUrl):'';
 const scheduled=new Date(payload.scheduledAt);
 if(!title||body.length<20||!link||!Number.isFinite(+scheduled)||scheduled.getTime()<Date.now()-60000||scheduled.getTime()>Date.now()+32*86400000)throw new Error('Revise título, texto, link HTTPS e agendamento (até 32 dias).');
 if(!/((publi|publicidade)|(comiss[aã]o)|(patrocinad))/i.test(body))throw new Error('Inclua uma declaração de publicidade/comissão no texto.');
 if(['instagram','pinterest'].includes(dest.platform)&&!image)throw new Error('Instagram e Pinterest exigem uma imagem HTTPS pública.');
 const product=clean(payload.productId,100);
 const fp=await digest(`${destinationId}|${brDay(scheduled)}|${link}`);
 const item={id:uid(),destination_id:destinationId,product_id:product,title,body,link,image_url:image,scheduled_at:scheduled.toISOString(),fingerprint:fp};
 const result=await env.DB.prepare("INSERT OR IGNORE INTO jobs(id,destination_id,product_id,title,body,link,image_url,scheduled_at,status,created_at,fingerprint) VALUES(?,?,?,?,?,?,?,?,'review',?,?)").bind(item.id,item.destination_id,item.product_id,item.title,item.body,item.link,item.image_url,item.scheduled_at,nowISO(),fp).run();
 return {created:result.meta?.changes>0,id:item.id};
}
async function processDue(env){
 const paused=await env.DB.prepare('SELECT paused FROM settings WHERE id=1').first();if(!paused||paused.paused)return {paused:true,processed:0};
 const rows=await env.DB.prepare("SELECT j.*,d.platform,d.external_id,d.enabled FROM jobs j JOIN destinations d ON d.id=j.destination_id WHERE j.status='approved' AND j.scheduled_at<=? AND d.enabled=1 ORDER BY j.scheduled_at ASC LIMIT 10").bind(nowISO()).all();
 let processed=0;
 for(const job of rows.results||[]){
  const claimed=await env.DB.prepare("UPDATE jobs SET status='sending', attempts=attempts+1 WHERE id=? AND status='approved'").bind(job.id).run();
  if(!claimed.meta?.changes)continue;
  processed++;
  try{
   if(!connected(env)[job.platform])throw new Error('Conexão indisponível: configure o token da rede.');
   const last=await env.DB.prepare("SELECT sent_at FROM jobs WHERE destination_id=? AND status='sent' ORDER BY sent_at DESC LIMIT 1").bind(job.destination_id).first();
   if(last&&Date.now()-Date.parse(last.sent_at)<MIN_INTERVAL_MS)throw new Error('Intervalo de segurança: revise horário; não houve envio.');
   const rowsToday=await env.DB.prepare("SELECT count(*) AS n FROM jobs WHERE destination_id=? AND status='sent' AND substr(datetime(sent_at,'-3 hours'),1,10)=?").bind(job.destination_id,brDay(new Date())).first();
   if((rowsToday?.n||0)>=MAX_JOBS_PER_DESTINATION_PER_DAY)throw new Error('Limite diário atingido; revise este agendamento.');
   const result=await dispatch(job,{platform:job.platform,external_id:job.external_id},env);
   await env.DB.prepare("UPDATE jobs SET status='sent',sent_at=?,remote_id=?,remote_url=?,last_error=NULL WHERE id=? AND status='sending'").bind(nowISO(),result.id,result.url,job.id).run();
   await audit(env,job.id,'sent',job.platform);
  }catch(e){
   // No blind retries: a timed-out API may have published already.
   await env.DB.prepare("UPDATE jobs SET status='needs_review',last_error=? WHERE id=? AND status='sending'").bind(errText(e),job.id).run();
   await audit(env,job.id,'needs_review',errText(e));
   await notifyOwner(env,`⚠️ Viraliza: publicação em ${job.platform} requer revisão. Abra o Piloto automático. Erro: ${errText(e)}`);
  }
 }
 return {paused:false,processed};
}
function cors(env,request){const origin=clean(request.headers.get('Origin'),250),allow=clean(env.ALLOWED_ORIGIN,250);if(origin&&origin!==allow)return null;return {'Access-Control-Allow-Origin':allow,'Access-Control-Allow-Headers':CORS_HEADERS,'Access-Control-Allow-Methods':'GET,POST,OPTIONS,PATCH,DELETE','Vary':'Origin'};}
function auth(req,env){return !!env.DASHBOARD_TOKEN&&req.headers.get('Authorization')===`Bearer ${env.DASHBOARD_TOKEN}`;}
const bodyJson=async req=>{let b=await req.json().catch(()=>null);if(!b||typeof b!=='object'||Array.isArray(b))throw new Error('JSON inválido');return b;};
async function route(request,env){
 const headers=cors(env,request);if(!headers)return response({error:'Origem não autorizada'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!auth(request,env))return response({error:'Acesso negado'},401,headers);
 if(!env.DB)return response({error:'Banco D1 não configurado'},503,headers);
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(path.startsWith('/api/creator/'))return creatorRoute(request,env,headers);
 try{
  if(method==='GET'&&path==='/api/automation/status'){
   const setting=await env.DB.prepare('SELECT paused FROM settings WHERE id=1').first();
   return response({ok:true,paused:!!setting?.paused,integrations:connected(env),automaticPosting:['telegram','pinterest','instagram','facebook'],mode:'approvals-required'},200,headers);
  }
  if(method==='POST'&&path==='/api/automation/pause'){
   const b=await bodyJson(request);await env.DB.prepare('UPDATE settings SET paused=?,updated_at=? WHERE id=1').bind(b.paused?1:0,nowISO()).run();await audit(env,null,b.paused?'paused':'resumed');return response({paused:!!b.paused},200,headers);
  }
  if(method==='GET'&&path==='/api/automation/destinations'){
   const data=await env.DB.prepare('SELECT * FROM destinations ORDER BY created_at DESC').all();return response({items:data.results||[]},200,headers);
  }
  if(method==='POST'&&path==='/api/automation/destinations'){
   const b=await bodyJson(request);let platform=clean(b.platform,20),target=clean(b.externalId,100),label=clean(b.label,80);
   if(!SAFE_PLATFORMS.includes(platform)||!target||!label||b.ownerConfirmed!==true)throw new Error('Confirme que administra o destino e informe os dados.');
   if(platform==='telegram'&&!/^(@[A-Za-z0-9_]{5,}|-\d{6,})$/.test(target))throw new Error('Use @canal ou ID numérico negativo do grupo.');
   if(platform!=='telegram'&&!/^\d{5,30}$/.test(target))throw new Error('Informe o ID numérico da conta, página ou pasta.');
   const verify=await verifyDestination(platform,target,env);
   if(!verify.ready)throw new Error(verify.detail);
   const id=uid();await env.DB.prepare('INSERT INTO destinations(id,platform,label,external_id,enabled,created_at) VALUES(?,?,?,?,1,?)').bind(id,platform,label,target,nowISO()).run();await audit(env,null,'destination_created',platform);
   return response({id,verified:true,detail:verify.detail},201,headers);
  }
  const destM=path.match(/^\/api\/automation\/destinations\/([0-9a-f-]+)$/);
  if(destM&&method==='DELETE'){
   // Do not drop posting history. Disable destination and cancel unsent jobs.
   await env.DB.prepare('UPDATE destinations SET enabled=0 WHERE id=?').bind(destM[1]).run();
   await env.DB.prepare("UPDATE jobs SET status='cancelled' WHERE destination_id=? AND status IN ('approved','review')").bind(destM[1]).run();await audit(env,null,'destination_disabled');return response({ok:true},200,headers);
  }
  if(method==='GET'&&path==='/api/automation/jobs'){
   const data=await env.DB.prepare('SELECT j.*,d.label AS destination_label,d.platform FROM jobs j JOIN destinations d ON j.destination_id=d.id ORDER BY j.created_at DESC LIMIT 150').all();return response({items:data.results||[]},200,headers);
  }
  if(method==='POST'&&path==='/api/automation/jobs'){
   const result=await queueOne(env,await bodyJson(request));return response(result,result.created?201:200,headers);
  }
  if(method==='POST'&&path==='/api/automation/plan'){
   const b=await bodyJson(request),destIds=Array.isArray(b.destinationIds)?[...new Set(b.destinationIds.map(x=>clean(x,100)))].slice(0,8):[];
   const products=Array.isArray(b.products)?b.products.slice(0,30):[];
   const days=Math.max(1,Math.min(7,Math.floor(Number(b.days)||7)));
   if(!destIds.length||!products.length)throw new Error('Selecione produtos e destinos para planejar.');
   const valid=products.filter(x=>clean(x.name)&&validHttps(x.affiliateUrl)&&Number(x.price)>=0).sort((a,b)=>priority(b)-priority(a));
   if(!valid.length)throw new Error('Nenhum produto com nome e link HTTPS válido.');
   const dests=(await env.DB.prepare('SELECT * FROM destinations WHERE enabled=1').all()).results||[];
   let created=0,skipped=0;const start=new Date();
   for(const destId of destIds){const dest=dests.find(x=>x.id===destId);if(!dest)continue;
    for(let i=0;i<days;i++){
     const p=valid[(i+destIds.indexOf(destId))%valid.length];
     const date=new Date(start.getTime()+i*86400000);
     // Stagger posting hours by network (suggestions, not measured best hours).
     const targetDay=brDay(date),slot=platformSlots[dest.platform]||'16:00';const schedule=new Date(`${targetDay}T${slot}:00Z`);
     if(schedule.getTime()<Date.now()+10*60000)continue;
     try{let a=await queueOne(env,{destinationId:destId,productId:clean(p.id,100),title:p.name,body:generateText(p,dest.platform,i),link:p.affiliateUrl,imageUrl:p.imageUrl||'',scheduledAt:schedule.toISOString()});a.created?created++:skipped++;}catch{skipped++;}
    }
   }
   await audit(env,null,'plan_created',`${created} drafts`);
   if(created)await notifyOwner(env,`📅 Viraliza: ${created} novos rascunhos aguardam sua aprovação. Abra o Piloto automático.`);
   return response({created,skipped,days,approvalRequired:true},200,headers);
  }
  const jobM=path.match(/^\/api\/automation\/jobs\/([0-9a-f-]+)\/(approve|cancel|retry)$/);
  if(jobM&&method==='POST'){
   const [,jobId,action]=jobM;
   const job=await env.DB.prepare('SELECT j.*,d.enabled FROM jobs j JOIN destinations d ON j.destination_id=d.id WHERE j.id=?').bind(jobId).first();
   if(!job)return response({error:'Item não encontrado'},404,headers);
   if(action==='approve'){
    if(!job.enabled||job.status!=='review')throw new Error('Só é possível aprovar um rascunho ativo.');
    if(new Date(job.scheduled_at).getTime()<Date.now())throw new Error('Horário já passou: edite o agendamento primeiro.');
    await env.DB.prepare("UPDATE jobs SET status='approved',approved_at=? WHERE id=? AND status='review'").bind(nowISO(),jobId).run();
   }else if(action==='cancel'){
    if(!['review','approved','needs_review'].includes(job.status))throw new Error('Não é possível cancelar uma publicação já enviada.');
    await env.DB.prepare("UPDATE jobs SET status='cancelled' WHERE id=?").bind(jobId).run();
   }else{
    if(job.status!=='needs_review')throw new Error('Só é possível reenviar após revisão.');
    const b=await bodyJson(request);
    if(b.confirmCheckedRemote!==true)throw new Error('Verifique primeiro na rede se a publicação não foi enviada.');
    if(new Date(job.scheduled_at).getTime()<Date.now())throw new Error('Agende um novo horário antes de tentar de novo.');
    await env.DB.prepare("UPDATE jobs SET status='review',last_error=NULL WHERE id=?").bind(jobId).run();
   }
   await audit(env,jobId,action);return response({ok:true,status:action==='approve'?'approved':action==='cancel'?'cancelled':'review'},200,headers);
  }
  const patchM=path.match(/^\/api\/automation\/jobs\/([0-9a-f-]+)$/);
  if(patchM&&method==='PATCH'){
   const b=await bodyJson(request),job=await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(patchM[1]).first();
   if(!job||!['review','needs_review'].includes(job.status))throw new Error('Somente rascunhos e itens em revisão podem ser editados.');
   const when=new Date(b.scheduledAt||job.scheduled_at),txt=clean(b.body??job.body,2000);
   if(!Number.isFinite(+when)||when.getTime()<Date.now()+60000||when.getTime()>Date.now()+32*86400000)throw new Error('Escolha um horário futuro em até 32 dias.');
   if(txt.length<20||!/((publi|publicidade)|(comiss[aã]o)|(patrocinad))/i.test(txt))throw new Error('Inclua texto e aviso de publicidade.');
   const fp=await digest(`${job.destination_id}|${brDay(when)}|${job.link}`);
   await env.DB.prepare('UPDATE jobs SET body=?,scheduled_at=?,fingerprint=? WHERE id=?').bind(txt,when.toISOString(),fp,job.id).run();
   await audit(env,job.id,'edited');return response({ok:true},200,headers);
  }
  if(method==='GET'&&path==='/api/automation/audit'){
   const data=await env.DB.prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 80').all();return response({items:data.results||[]},200,headers);
  }
  return response({error:'Rota não encontrada'},404,headers);
 }catch(e){return response({error:errText(e)},400,headers);}
}
export default {
 async fetch(request,env){return route(request,env);},
 async scheduled(event,env,ctx){ctx.waitUntil(Promise.allSettled([processDue(env),creatorTick(env)]));}
};
export {generateText,brDay,validHttps,processDue};
