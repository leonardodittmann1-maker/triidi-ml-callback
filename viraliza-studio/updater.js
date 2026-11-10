/* Viraliza Studio — atualizador de interface (Web/PWA/APK).
 * Mantém dados locais: nunca apaga localStorage/IndexedDB.
 * A instalação de um novo APK sempre é confirmada pelo Android.
 */
(()=>{
 'use strict';
 const CURRENT_WEB='2.1.0';
 const FEED='./updates.json';
 const RELEASE_PREFIX='https://github.com/leonardodittmann1-maker/triidi-ml-callback/releases/download/';
 const compare=(a,b)=>{
   const x=String(a).split('.').map(Number), y=String(b).split('.').map(Number);
   for(let i=0;i<3;i++){let d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1;}return 0;
 };
 const safeApkUrl=u=>{
   try {const url=new URL(u);return url.href.startsWith(RELEASE_PREFIX)&&/\.apk$/i.test(url.pathname)?url.href:'';}catch{return ''}
 };
 function toast(message){
   let el=document.getElementById('vs-update-toast');
   if(!el){el=document.createElement('div');el.id='vs-update-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
     Object.assign(el.style,{position:'fixed',zIndex:'99999',left:'50%',bottom:'calc(90px + env(safe-area-inset-bottom, 0px))',transform:'translateX(-50%)',width:'max-content',maxWidth:'min(92vw,460px)',padding:'14px 18px',border:'1px solid #7166b4',borderRadius:'14px',background:'#262343',color:'#fff',font:'600 13px system-ui',boxShadow:'0 18px 60px #0007'});document.body.appendChild(el);}
   el.textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.remove(),6500);
 }
 async function reloadWeb(){
   try{if('serviceWorker' in navigator){let regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.update()));}}
   catch(e){console.warn('Não foi possível atualizar o service worker:',e)}
   const u=new URL(location.href);u.searchParams.set('vs_update',Date.now().toString());location.replace(u.href);
 }
 async function check(){
   const btn=document.getElementById('vs-update-button');if(btn){btn.disabled=true;btn.textContent='↻ Verificando…';}
   try{
     const url=new URL(FEED,location.href);url.searchParams.set('ts',String(Date.now()));
     const resp=await fetch(url,{cache:'no-store',redirect:'error'});
     if(!resp.ok)throw Error('Servidor indisponível');
     const info=await resp.json();
     const newerWeb=compare(info.webVersion||'',CURRENT_WEB)>0;
     let nativeCode=0;
     try{nativeCode=Number(window.ViralizaAndroid?.getVersionCode?.()||0);}catch{}
     const apk=info.apk||{};
     const newerApk=nativeCode>0&&Number(apk.versionCode||0)>nativeCode&&safeApkUrl(apk.downloadUrl);
     if(newerApk){
       if(confirm(`Uma nova versão do APK está disponível (${apk.versionName||apk.versionCode}). Baixar a atualização? Seus dados serão preservados se a assinatura digital do aplicativo for a mesma.`)){
         const u=safeApkUrl(apk.downloadUrl);
         if(window.ViralizaAndroid?.openVerifiedApk) window.ViralizaAndroid.openVerifiedApk(u);
         else window.open(u,'_blank','noopener');
       }
     }else if(newerWeb){
       if(confirm(`Atualização de conteúdo disponível: ${info.webVersion}. Atualizar agora? Registros salvos permanecerão no aparelho; salve qualquer formulário que esteja editando.`))await reloadWeb();
     }else toast('Você já está na versão mais recente disponível. ✓');
   }catch(e){toast('Não foi possível consultar as atualizações. Verifique sua conexão.');}
   finally{if(btn){btn.disabled=false;btn.textContent='↻ Atualizar';}}
 }
 function mount(){
   if(document.getElementById('vs-update-button'))return;
   const host=document.querySelector('.topbar-actions')||document.querySelector('body > header')||document.querySelector('header');
   if(!host)return;
   const btn=document.createElement('button');btn.id='vs-update-button';btn.type='button';btn.textContent='↻ Atualizar';
   btn.title='Verificar versões novas sem apagar os dados';
   Object.assign(btn.style,{cursor:'pointer',border:'1px solid #8875d8',borderRadius:'11px',padding:'10px 12px',background:'#2e2751',color:'#fff',font:'600 13px system-ui',whiteSpace:'nowrap',minHeight:'38px'});
   btn.addEventListener('click',check);
   host.insertBefore(btn,host.firstChild);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.ViralizaUpdates={check,webVersion:CURRENT_WEB};
})();
