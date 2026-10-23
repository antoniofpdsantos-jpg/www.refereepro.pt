const CACHE='referee-pro-pwa-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./logic.js','./pdf.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{
   if(response.ok){const cloned=response.clone();caches.open(CACHE).then(c=>c.put(req,cloned));}
   return response;
 })));
});
