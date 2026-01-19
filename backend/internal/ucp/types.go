package ucp

import "time"

// ========================================
// UCP - UNIVERSAL COMMERCE PROTOCOL
// Schema Definitions (v1.0)
// ========================================

// DiscoveryManifest represents the /.well-known/ucp response
type DiscoveryManifest struct {
	UCPVersion      string       `json:"ucp_version"`
	Merchant        MerchantInfo `json:"merchant"`
	Capabilities    Capabilities `json:"capabilities"`
	Endpoints       Endpoints    `json:"endpoints"`
	PaymentHandlers []string     `json:"payment_handlers"`
	TrustSignals    TrustSignals `json:"trust_signals"`
}

type MerchantInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Domain string `json:"domain"`
	Logo   string `json:"logo"`
}

type Capabilities struct {
	CatalogSearch  bool `json:"catalog_search"`
	ProductDetails bool `json:"product_details"`
	CartManagement bool `json:"cart_management"`
	Checkout       bool `json:"checkout"`
}

type Endpoints struct {
	Catalog   string `json:"catalog"`
	Products  string `json:"products"`
	Cart      string `json:"cart"`
	Checkout  string `json:"checkout"`
	Negotiate string `json:"negotiate"`
}

type TrustSignals struct {
	VerifiedMerchant bool   `json:"verified_merchant"`
	SSLCertificate   bool   `json:"ssl_certificate"`
	RefundPolicy     string `json:"refund_policy"`
}

// SearchRequest for catalog search
type SearchRequest struct {
	Query  string `json:"query"`
	Limit  int    `json:"limit,omitempty"`
	Offset int    `json:"offset,omitempty"`
}

// SearchResponse for catalog results
type SearchResponse struct {
	Items      []ProductItem `json:"items"`
	TotalItems int           `json:"total_items"`
}

type ProductItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int64  `json:"price"` // in cents
	Currency    string `json:"currency"`
	InStock     bool   `json:"in_stock"`
}

// CheckoutSessionRequest to initiate a purchase
type CheckoutSessionRequest struct {
	LineItems []LineItem `json:"line_items"`
	Buyer     BuyerInfo  `json:"buyer"`
}

type LineItem struct {
	ID       string `json:"id"` // Product ID
	Quantity int    `json:"quantity"`
	Price    int64  `json:"price,omitempty"` // Optional validation
}

type BuyerInfo struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

// CheckoutSessionResponse returns the checkout state
type CheckoutSessionResponse struct {
	ID         string    `json:"id"`
	Status     string    `json:"status"` // pending, processing, completed
	PaymentURL string    `json:"payment_url,omitempty"`
	Total      int64     `json:"total"`
	Currency   string    `json:"currency"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// ========================================
// UCP NEGOTIATION (v1.1)
// ========================================
// Protocol for agent-to-agent bargaining
// ========================================

type NegotiationProposal struct {
	ID            string `json:"id"`
	ProductID     string `json:"product_id"`
	ProposedPrice int64  `json:"proposed_price"`
	Currency      string `json:"currency"`
	Justification string `json:"justification,omitempty"`
}

type NegotiationResponse struct {
	Status       string `json:"status"` // accepted, rejected, counter_offer
	CounterPrice int64  `json:"counter_price,omitempty"`
	Reason       string `json:"reason,omitempty"`
	Signature    string `json:"signature,omitempty"` // For trust validation
}
