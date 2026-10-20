'use strict';

// Bump this version whenever an app asset changes so installed PWAs refresh.
const CACHE_PREFIX = 'pregnancy-dating-';
const CACHE_NAME = CACHE_PREFIX + 'v25';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/date-utils.js',
  './assets/js/calculator.js',
  './assets/js/app.js',
  './assets/js/clinical-tools.js',
  './assets/js/expanded-toolkit.js',
  './assets/icons/logo.svg',
  './assets/icons/favicon.svg'
];

const offlineResponse = () => new Response(
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body><main><h1>You are offline</h1><p>The calculator is unavailable because this page has not been cached yet. Reconnect once, then reload to make it available offline.</p><p>Previously opened versions of the calculator may still be available from your browser cache.</p></main></body></html>',
  { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
);
const unavailableResponse = () => new Response(
  'This resource is temporarily unavailable. Check your connection and reload.',
  { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }
  // Never intercept third-party requests; this app has no runtime API dependency.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network-first keeps HTML fresh; cached HTML provides the offline fallback.
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put('./index.html', copy))
            .catch(() => {});
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) ||
          (await cache.match('./index.html')) ||
          offlineResponse();
      })
    );
    return;
  }

  // Cache-first for same-origin static assets: fast repeat visits and offline support.
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch (_) {
        return unavailableResponse();
      }
    })
  );
});
