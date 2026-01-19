package ucp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SearchRemoteCatalog executes a search on a remote UCP endpoint
func (c *Client) SearchRemote(ctx context.Context, endpointURL string, query string) (*SearchResponse, error) {
	reqBody := SearchRequest{
		Query: query,
		Limit: 10,
	}

	jsonBody, err := json.Marshal(reqBody)
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
		return nil, fmt.Errorf("remote search failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Try to read error body
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("remote error %d: %s", resp.StatusCode, string(body))
	}

	var result SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("invalid response format: %w", err)
	}

	return &result, nil
}
