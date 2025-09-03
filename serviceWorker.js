const ASSET_CACHE = 'weather-v1';
const assets = [
  "/",
  "/index.html",
  "/index.js",
  "/hourly.html",
  "/hourly.js",
  "/5-days.html",
  "/5-days.js",
  "/leaflet.js",
  "/leaflet.css",
  "/radar.html",
  "/PNG/01d.png",
  "/PNG/01n.png",
  "/PNG/02d.png",
  "/PNG/02n.png",
  "/PNG/03d.png",
  "/PNG/03n.png",
  "/PNG/04d.png",
  "/PNG/04n.png",
  "/PNG/09d.png",
  "/PNG/09n.png",
  "/PNG/10d.png",
  "/PNG/10n.png",
  "/PNG/11d.png",
  "/PNG/11n.png",
  "/PNG/13d.png",
  "/PNG/13n.png",
  "/PNG/50d.png",
  "/PNG/50n.png",
  "/css/owfont-regular.css",
  "/css/owfont-regular.min.css",
  "/fonts/owfont-regular.eot",
  "/fonts/owfont-regular.otf",
  "/fonts/owfont-regular.svg",
  "/fonts/owfont-regular.ttf",
  "/fonts/owfont-regular.woff",
]

self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing');
  event.waitUntil(
    caches.open(ASSET_CACHE)
    .then(cache => cache.addAll(assets))
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})
