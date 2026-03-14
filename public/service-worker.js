// service-worker.js
const CACHE_NAME = "hair-co-v1";
const SYNC_QUEUE = "notification-sync";

// Install event
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Push event (your existing code)
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push data:", data);

    const options = {
      body: data.body || "Your order has been updated",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-192x192.png",
      vibrate: [200, 100, 200],
      data: data.data || {
        url: "/",
        timestamp: Date.now(),
      },
      actions: data.actions || [
        {
          action: "view",
          title: "View Order",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
      tag: data.tag || "order-update",
      renotify: true,
      requireInteraction: true,
      silent: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Order Update", options),
    );
  } catch (error) {
    console.error("Error showing notification:", error);

    event.waitUntil(
      self.registration.showNotification("Order Update", {
        body: "Your order status has been updated",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
      }),
    );
  }
});

// Notification click event (your existing code)
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      }),
  );
});

// Background Sync Event - for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background Sync event:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  } else if (event.tag === "mark-notifications-read") {
    event.waitUntil(syncMarkAsRead());
  }
});

// Function to sync notifications when back online
async function syncNotifications() {
  try {
    const cache = await caches.open(SYNC_QUEUE);
    const requests = await cache.keys();

    console.log(`Syncing ${requests.length} queued notifications`);

    for (const request of requests) {
      try {
        // Try to send the queued request
        const response = await fetch(request.clone());

        if (response.ok) {
          // If successful, remove from queue
          await cache.delete(request);
          console.log("Synced notification successfully");
        }
      } catch (error) {
        console.error("Error syncing notification:", error);
      }
    }
  } catch (error) {
    console.error("Error in syncNotifications:", error);
  }
}

// Function to sync read status
async function syncMarkAsRead() {
  try {
    const cache = await caches.open("read-queue");
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error("Error syncing read status:", error);
      }
    }
  } catch (error) {
    console.error("Error in syncMarkAsRead:", error);
  }
}

// Handle service worker updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
