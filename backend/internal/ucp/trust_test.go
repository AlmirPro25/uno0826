package ucp

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTrustEngine_Verification(t *testing.T) {
	engine := NewTrustEngine()

	// Case 1: Perfect Merchant
	goodManifest := &DiscoveryManifest{
		Merchant: MerchantInfo{
			ID:     "com.trusted.store",
			Domain: "trusted.store",
		},
		TrustSignals: TrustSignals{
			VerifiedMerchant: true,
			SSLCertificate:   true,
			RefundPolicy:     "/refunds",
		},
	}

	res, err := engine.VerifyEndpoint("https://trusted.store/api", goodManifest)
	assert.NoError(t, err)
	assert.True(t, res.IsTrusted)
	assert.True(t, res.SecureTransport)
	assert.True(t, res.DomainVerified)
	assert.GreaterOrEqual(t, res.TrustScore, 80) // 50 (base) + 20 + 10 + 5 = 85

	// Case 2: Phishing Clone (Domain Mismatch)
	badManifest := &DiscoveryManifest{
		Merchant: MerchantInfo{
			ID:     "com.trusted.store",
			Domain: "trusted.store", // Claims to be trusted.store
		},
	}

	// But serving from evil-site.com
	res, err = engine.VerifyEndpoint("https://evil-site.com/api", badManifest)
	assert.NoError(t, err)
	assert.False(t, res.DomainVerified)
	assert.False(t, res.IsTrusted)
	assert.Contains(t, res.Issues[0], "Domain Mismatch")

	// Case 3: Insecure Transport (HTTP remote)
	res, err = engine.VerifyEndpoint("http://remote-store.com", goodManifest)
	assert.NoError(t, err)
	assert.False(t, res.SecureTransport)
	assert.Contains(t, res.Issues[0], "Insecure Transport")
}

func TestTrustEngine_Reputation(t *testing.T) {
	engine := NewTrustEngine()
	id := "com.new.store"

	// Initial Verification
	manifest := &DiscoveryManifest{
		Merchant:     MerchantInfo{Domain: "new.store", ID: id},
		TrustSignals: TrustSignals{VerifiedMerchant: true},
	}

	res, _ := engine.VerifyEndpoint("https://new.store", manifest)
	initialScore := res.TrustScore // Should be 50 + 20 = 70

	// Bad interaction
	engine.RecordInteraction(id, false)
	engine.RecordInteraction(id, false)

	res, _ = engine.VerifyEndpoint("https://new.store", manifest)
	assert.Equal(t, initialScore-10, res.TrustScore, "Score should drop by 10")
}
