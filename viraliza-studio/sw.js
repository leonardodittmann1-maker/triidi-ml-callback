const CACHE='viraliza-studio-v2.2';
const ASSETS=['./','./index.html','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./automacao.html','./automacao.js','./updater.js','./auto-creator.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;const path=new URL(event.request.url).pathname;if(path.endsWith('/updates.json'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)))});
