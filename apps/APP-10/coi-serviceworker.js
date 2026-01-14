/*! coi-serviceworker v0.1.7 - Modified for Aether */
let coepCredentialless = true; // Default to true for broader compatibility with CDNs

if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", function (event) {
    if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 0) {
            return response;
          }

          // Create new headers safely - avoid TypeError with invalid headers
          let newHeaders;
          try {
            newHeaders = new Headers();
            // Copy existing headers one by one to avoid issues
            response.headers.forEach((value, key) => {
              try {
                newHeaders.set(key, value);
              } catch (e) {
                // Skip invalid headers
              }
            });
          } catch (e) {
            // Fallback: return original response if headers fail
            console.warn("COI: Failed to create headers, returning original response");
            return response;
          }

          // Set COOP/COEP headers
          newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
          if (!coepCredentialless) {
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
          }
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
        .catch((e) => {
          console.warn("COI fetch error:", e);
          return fetch(event.request); // Fallback to original fetch
        })
    );
  });
} else {
  (() => {
    const n = navigator;
    
    // If we're already isolated, we don't need to do anything.
    if (window.crossOriginIsolated) return;

    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    
    // Check for manual override in HTML - safely parse meta tag
    try {
      const metaTag = window.document.head.querySelector('[http-equiv="Cross-Origin-Embedder-Policy"]');
      if (metaTag && metaTag.content) {
        coepCredentialless = metaTag.content === "credentialless";
      }
    } catch (e) {
      // Ignore meta tag parsing errors
    }

    const src = document.currentScript ? document.currentScript.src : 'coi-serviceworker.js';
    
    if (n.serviceWorker) {
      n.serviceWorker.register(src).then(
        (registration) => {
          console.log("COI: Service Worker registered");
          
          registration.addEventListener("updatefound", () => {
            console.log("COI: Reloading page to activate Service Worker");
            window.sessionStorage.setItem("coiReloadedBySelf", "true");
            window.location.reload();
          });

          if (registration.active && !n.serviceWorker.controller) {
            console.log("COI: Reloading page to take control");
            window.sessionStorage.setItem("coiReloadedBySelf", "true");
            window.location.reload();
          }
        },
        (err) => {
          console.error("COI: Service Worker registration failed", err);
        }
      );
    }
  })();
}