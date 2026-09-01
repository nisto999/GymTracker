/* Niten service worker.

   Network-first, with the cache as the offline fallback.

   Deliberately has NO hard-coded file list and NO cache version to bump.
   That matters because Niten is deployed by hand: a cache-first worker with a
   version constant would strand people on a stale build the first time the
   bump was forgotten. Here, an online device always gets whatever is newest on
   the server, and an offline one gets the last copy it successfully loaded.

   Cross-origin requests (the Google Fonts stylesheet) are left alone — the
   font stacks fall back on their own, and the app is fully usable without them.

   Navigation never falls back to a different page: nick / caitlyn / cheralyn /
   index each hold different data under their own STORE_KEY, so serving one in
   place of another would show somebody else's app. Better to fail honestly.
*/
var CACHE = "niten";

self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function(res){
      if (res && res.status === 200 && res.type === "basic") {
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req, { ignoreSearch: true }).then(function(hit){
        return hit || Response.error();
      });
    })
  );
});
