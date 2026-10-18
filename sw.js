/* Minimal service worker: makes the app installable. Always loads fresh files from the network first, so updates show immediately. */
const CACHE='lamps-v1';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c)).catch(()=>{});return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
});
