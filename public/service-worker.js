// public/service-worker.js
const CACHE_NAME = "sargo-staking-v1";
const DB_NAME = "SargoStaking";
const DB_VERSION = 1;
const DB_STORE_NAME = "stakingData";

// Demo data structure
const demoData = {
  sargoBalance: "1000.0",
  xSargoBalance: "500.0",
  stakeInfo: {
    amount: "250.0",
    unlockTime: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days from now
  }
};

// Core asset caching
async function cacheCoreAssets() {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll([
    "/",
    "/web.manifest",
    "/offline",
    // Add your static assets here
  ]);
}

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        const store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id" });
        // Initialize with demo data
        store.add({
          id: "demoData",
          ...demoData,
          lastUpdated: Date.now()
        });
      }
    };
  });
}

// Service Worker Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      cacheCoreAssets(),
      initDB()
    ])
  );
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch Event Handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API-like requests (in our demo, these would be requests to /api/...)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and navigation requests
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response; // Return cached response
        }
        
        return fetch(request).then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // If the fetch fails, return the offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});

// Handle API-like requests
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    // If network fails, return cached data
    const db = await initDB();
    const tx = db.transaction(DB_STORE_NAME, "readonly");
    const store = tx.objectStore(DB_STORE_NAME);
    const data = await store.get("demoData");
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Push Notification Handler
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/icon512_rounded.png",
    badge: "/icon512_rounded.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1"
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
      },
      {
        action: "close",
        title: "Close",
      },
    ]
  };

  event.waitUntil(
    self.registration.showNotification("Sargo Staking", options)
  );
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

// Periodic Sync (for background updates if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-staking-data") {
    event.waitUntil(updateStakingData());
  }
});

// Background Sync (for offline actions)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-staking-actions") {
    event.waitUntil(syncStakingActions());
  }
});

// Helper function to update staking data
async function updateStakingData() {
  const db = await initDB();
  const tx = db.transaction(DB_STORE_NAME, "readwrite");
  const store = tx.objectStore(DB_STORE_NAME);
  
  // Update the demo data with new timestamp
  const data = await store.get("demoData");
  if (data) {
    data.lastUpdated = Date.now();
    await store.put(data);
  }
}

// Helper function to sync offline staking actions
async function syncStakingActions() {
  // In a real app, this would sync offline transactions
  // For demo, we just update the timestamp
  await updateStakingData();
}