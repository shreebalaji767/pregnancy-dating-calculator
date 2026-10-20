'use strict';
const CACHE_PREFIX = 'pregnancy-dating-';
const CACHE_NAME = CACHE_PREFIX + 'v9';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/date-utils.js',
  './assets/js/calculator.js',
  './assets/js/app.js',
  './assets/icons/logo.svg',
  './assets/icons/favicon.svg'
];
const offlineResponse = () => new Response(
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body><main><h1>You are offline</h1><p>This page could not be loaded because a network connection is unavailable. Reconnect and reload the pregnancy dating calculator.</p></main></body></html>',
  { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
);
const unavailableResponse = () => new Response(
  'This resource is temporarily unavailable. Check your connection and reload.',
  { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match('./index.html')) || offlineResponse();
      })
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return unavailableResponse();
      }
    })
  );
});
