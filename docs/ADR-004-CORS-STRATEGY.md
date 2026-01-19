# ADR-004: CORS Management Strategy

**Date:** 2026-01-19  
**Status:** Accepted  
**Context:** Oracle Cloud Infrastructure Migration  
**Author:** AI Agent (Antigravity) & Tech Lead (User)

## 1. Context and Problem Statement

During the migration of the PROST-QS backend to Oracle Cloud Infrastructure (OCI) using an Nginx reverse proxy, a critical issue arose where the Frontend (Vercel) could not authenticate with the Backend.

The error observed was:
`The 'Access-Control-Allow-Origin' header contains multiple values 'https://prostqs.com.br, https://prostqs.com.br', but only one is allowed.`

This duplicate header issue was caused by a conflict between:
1.  **Nginx Layer:** Configured to add basic CORS headers (`Access-Control-Allow-Origin`).
2.  **Application Layer (Go):** Using `gin-contrib/cors` middleware to dynamically manage CORS.

The browser, upon receiving two identical headers, strictly blocked the request as per security standards, preventing the login flow and OAuth 2.0 handshake.

## 2. Decision

We have decided to **delegate full responsibility for CORS management to the Application Layer (Go Backend)** and explicitly remove any CORS-related directives from the Nginx Reverse Proxy configuration.

### Implemented Actions:
*   **Nginx:** All `add_header Access-Control-Allow-*` directives were removed from `/etc/nginx/sites-available/prostqs`.
*   **Go Backend:** The `middleware.StrictCORSMiddleware` remains the single source of truth for CORS policies.

## 3. Rationale

### Why Application Layer (Go)?
1.  **Dynamic Context:** The application knows valid origins dynamically (e.g., reading `ALLOWED_ORIGINS` from `.env`), whereas Nginx configuration is static and requires reloading.
2.  **Granularity:** The application can apply different CORS policies per route (e.g., public API vs. internal admin) if needed in the future.
3.  **Environment Awareness:** Using `.env` variables allows different origins for Staging vs. Production without changing infrastructure code.
4.  **Security:** The Go middleware performs strict validation of the `Origin` header against an allowlist, rather than a generic wildcard or hardcoded string.

### Why NOT Nginx?
*   Nginx is excellent for routing, SSL termination, and load balancing. However, treating it as a logic layer for application security policies (like dynamic CORS) creates "Split Brain" configuration where infrastructure and code fight for control.

## 4. Consequences

### Positive
*   **Resolution:** The login flow is now functional; the "multiple values" error is eliminated.
*   **Simplicity:** There is only one place to debug CORS issues (the Go code).
*   **Portability:** The backend container behaves consistently regardless of the proxy appearing in front of it (Nginx, Cloudflare, AWS ALB, etc.), as long as the proxy passes headers through.

### Negative
*   **Performance (Negligible):** Technically, Nginx is faster at rejecting requests than Go, but for CORS preflights, the difference is irrelevant for this scale.
*   **Configuration Drift Risk:** If a future sysadmin manually adds CORS headers to Nginx (e.g., following a generic tutorial), the issue will manifest again. *Mitigation: This ADR serves as documentation against that.*

## 5. Verification

To verify the fix is active:
```bash
# Request to the API (should verify CORS logic)
curl -I -X OPTIONS https://api.prostqs.com.br/api/v1/health \
  -H "Origin: https://prostqs.com.br" \
  -H "Access-Control-Request-Method: GET"
```
**Expected Result:** A single `Access-Control-Allow-Origin: https://prostqs.com.br` header in the response.

## 6. Related Assets
*   `backend/pkg/middleware/cors_strict.go`: Source code for CORS logic.
*   `scripts/fix_cors_nginx.sh`: Script used to remediate the production environment.
