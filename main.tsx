// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Register service worker with correct path for Vite PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Check if service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations();

      // If there's already a registration with a different scope, unregister it
      for (const registration of registrations) {
        if (registration.active?.scriptURL.includes("service-worker.js")) {
          console.log("Service worker already registered:", registration);
          return;
        }
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
          updateViaCache: "none",
        },
      );

      console.log("Service Worker registered successfully:", registration);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("Service Worker update found:", newWorker);
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
