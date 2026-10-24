/* Minimal service worker: makes the app installable. It always fetches fresh files from the internet first (never from the browser's old copy), so updates show at once. */
const CACHE='analyser-v2';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c)).catch(()=>{});return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
});
