const MANIFEST = JSON.stringify({
  name: "问道",
  short_name: "问道",
  id: "/wendao",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#F3EDE4",
  theme_color: "#F3EDE4",
  lang: "zh-CN",
  prefer_related_applications: false,
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  ],
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname === "/__grok/manifest.webmanifest" ||
    url.pathname === "/__grok/manifest.json" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      new Response(MANIFEST, {
        headers: {
          "content-type": "application/manifest+json; charset=utf-8",
          "cache-control": "no-store",
        },
      }),
    );
    return;
  }

  if (url.pathname === "/__grok/icon-180.png") {
    event.respondWith(fetch(new URL("/icon-512.png", self.location.origin)));
  }
});
