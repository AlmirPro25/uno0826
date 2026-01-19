package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// ==========================================
// UCP TYPES (Simplified for Demo)
// ==========================================
type DiscoveryManifest struct {
	UCPVersion string       `json:"ucp_version"`
	Merchant   MerchantInfo `json:"merchant"`
	Endpoints  Endpoints    `json:"endpoints"`
}
type MerchantInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Logo string `json:"logo"`
}
type Endpoints struct {
	Catalog   string `json:"catalog"`
	Negotiate string `json:"negotiate"`
}
type SearchRequest struct {
	Query string `json:"query"`
}
type SearchResponse struct {
	Items      []ProductItem `json:"items"`
	TotalItems int           `json:"total_items"`
}
type ProductItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int64  `json:"price"` // cents
	Currency    string `json:"currency"`
	InStock     bool   `json:"in_stock"`
}

type NegotiationProposal struct {
	ID            string `json:"id"`
	ProductID     string `json:"product_id"`
	ProposedPrice int64  `json:"proposed_price"`
	Currency      string `json:"currency"`
	Justification string `json:"justification,omitempty"`
}

type NegotiationResponse struct {
	Status       string `json:"status"`
	CounterPrice int64  `json:"counter_price,omitempty"`
	Reason       string `json:"reason,omitempty"`
}

// ==========================================
// MOCK DATABASE
// ==========================================
var catalog = []ProductItem{
	{ID: "srv-001", Name: "Dell PowerEdge R750", Description: "Rack Server, 2x Intel Xeon, 64GB RAM", Price: 450000, Currency: "USD", InStock: true},
	{ID: "srv-002", Name: "HP ProLiant DL380", Description: "Rack Server, 2x AMD EPYC, 128GB RAM", Price: 520000, Currency: "USD", InStock: true},
	{ID: "lpt-001", Name: "MacBook Pro M3", Description: "Laptop for Devs, 32GB RAM", Price: 240000, Currency: "USD", InStock: true},
	{ID: "cloud-01", Name: "AWS Credits Bundle", Description: "$10k AWS Credits for Startups", Price: 800000, Currency: "USD", InStock: true},
}

// ==========================================
// HANDLERS
// ==========================================

func main() {
	port := ":9090" // Separate port from Main API (8080)

	// 1. Discovery Endpoint
	http.HandleFunc("/.well-known/ucp", func(w http.ResponseWriter, r *http.Request) {
		enableCors(w)
		manifest := DiscoveryManifest{
			UCPVersion: "1.0",
			Merchant: MerchantInfo{
				ID:   "demo-store-inc",
				Name: "Demo Store Inc (UCP Ready)",
				Logo: "https://demo-store.com/logo.png",
			},
			Endpoints: Endpoints{
				Catalog:   "/ucp/catalog",
				Negotiate: "/ucp/negotiate",
			},
		}
		json.NewEncoder(w).Encode(manifest)
	})

	// 2. Catalog Search Endpoint
	http.HandleFunc("/ucp/catalog", func(w http.ResponseWriter, r *http.Request) {
		enableCors(w)
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SearchRequest
		json.NewDecoder(r.Body).Decode(&req)

		query := strings.ToLower(req.Query)
		var results []ProductItem

		// Simple search logic
		for _, item := range catalog {
			if strings.Contains(strings.ToLower(item.Name), query) ||
				strings.Contains(strings.ToLower(item.Description), query) {
				results = append(results, item)
			}
		}

		resp := SearchResponse{
			Items:      results,
			TotalItems: len(results),
		}

		// Simulate network latency
		time.Sleep(200 * time.Millisecond)

		json.NewEncoder(w).Encode(resp)
		log.Printf("[DEMO STORE] Search received for '%s' -> Found %d items", req.Query, len(results))
	})

	// 3. Negotiate Endpoint
	http.HandleFunc("/ucp/negotiate", func(w http.ResponseWriter, r *http.Request) {
		enableCors(w)
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req NegotiationProposal
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		log.Printf("[DEMO STORE] Negotiation proposal received for %s: %d %s (Justification: %s)", req.ProductID, req.ProposedPrice, req.Currency, req.Justification)

		// Mock Negotiation Logic:
		// Accept if within 10% of price, otherwise counter-offer with 5% discount

		var targetItem *ProductItem
		for i := range catalog {
			if catalog[i].ID == req.ProductID {
				targetItem = &catalog[i]
				break
			}
		}

		if targetItem == nil {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}

		minAccept := int64(float64(targetItem.Price) * 0.90)
		counterValue := int64(float64(targetItem.Price) * 0.95)

		var resp NegotiationResponse
		if req.ProposedPrice >= minAccept {
			resp = NegotiationResponse{
				Status: "accepted",
				Reason: "Proposal within acceptable margin.",
			}
			log.Printf("[DEMO STORE] Proposal ACCEPTED")
		} else {
			resp = NegotiationResponse{
				Status:       "counter_offer",
				CounterPrice: counterValue,
				Reason:       "Your proposal is too low. We can offer a 5% discount.",
			}
			log.Printf("[DEMO STORE] Proposal REJECTED. Sent counter-offer: %d", counterValue)
		}

		json.NewEncoder(w).Encode(resp)
	})

	fmt.Printf("🏪 UCP DEMO STORE running on port %s\n", port)
	fmt.Printf("👉 Discovery: http://localhost%s/.well-known/ucp\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
}
