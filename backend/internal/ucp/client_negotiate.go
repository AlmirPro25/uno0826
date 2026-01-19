package ucp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// NegotiateRemote sends a negotiation proposal to a remote UCP endpoint
func (c *Client) NegotiateRemote(ctx context.Context, endpointURL string, proposal NegotiationProposal) (*NegotiationResponse, error) {
	jsonBody, err := json.Marshal(proposal)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpointURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "UNO-Sovereign-Kernel/1.0 (UCP-Client)")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("remote negotiation failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("remote merchant returned status %d", resp.StatusCode)
	}

	var result NegotiationResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("invalid response format from remote merchant: %w", err)
	}

	return &result, nil
}
