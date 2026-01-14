
package middleware

import "net/http"

// SetSecurityHeaders is a middleware that sets common security headers.
func SetSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent XSS attacks
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Prevent clickjacking
		w.Header().Set("X-Frame-Options", "DENY")
		// Only allow HTTPS
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		// Control Referrer information
		w.Header().Set("Referrer-Policy", "no-referrer-when-downgrade")
		// Feature-Policy (now Permissions-Policy) - control browser features
		// Example: w.Header().Set("Permissions-Policy", "geolocation=(), microphone=()")

		next.ServeHTTP(w, r)
	})
}

// TODO: Content Security Policy (CSP) should be implemented on the frontend for browser security.
// For backend, it's mostly for the response headers of HTML serving, not pure API.
// If the backend were serving static files or SSR HTML, CSP headers would be crucial here.
