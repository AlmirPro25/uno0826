package federation

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

// ========================================
// GOOGLE OAUTH SERVICE
// "Google é provider. Identity é soberana."
// ========================================

const (
	GoogleAuthURL     = "https://accounts.google.com/o/oauth2/v2/auth"
	GoogleTokenURL    = "https://oauth2.googleapis.com/token"
	GoogleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
)

var (
	ErrGoogleNotConfigured = errors.New("google oauth not configured")
	ErrInvalidGoogleToken  = errors.New("invalid google token")
)

// GoogleOAuthService gerencia autenticação com Google
type GoogleOAuthService struct {
	clientID     string
	clientSecret string
	redirectURI  string
	isConfigured bool
}

// NewGoogleOAuthService cria uma nova instância
func NewGoogleOAuthService() *GoogleOAuthService {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	if redirectURI == "" {
		redirectURI = "http://localhost:8080/api/v1/federation/google/callback"
	}

	return &GoogleOAuthService{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURI:  redirectURI,
		isConfigured: clientID != "" && clientSecret != "",
	}
}

// IsConfigured verifica se o Google OAuth está configurado
func (s *GoogleOAuthService) IsConfigured() bool {
	return s.isConfigured
}

// GetAuthURL gera a URL de autorização do Google
func (s *GoogleOAuthService) GetAuthURL(state string) (string, error) {
	if !s.isConfigured {
		// Mock mode - retorna URL fake para desenvolvimento
		return fmt.Sprintf("http://localhost:8080/api/v1/federation/google/mock?state=%s", state), nil
	}

	params := url.Values{}
	params.Set("client_id", s.clientID)
	params.Set("redirect_uri", s.redirectURI)
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("state", state)
	params.Set("access_type", "offline")
	params.Set("prompt", "consent")

	return fmt.Sprintf("%s?%s", GoogleAuthURL, params.Encode()), nil
}

// ExchangeCode troca o código de autorização por tokens
func (s *GoogleOAuthService) ExchangeCode(code string) (*TokenResponse, error) {
	if !s.isConfigured {
		// Mock mode
		return &TokenResponse{
			AccessToken:  "mock_access_token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
			RefreshToken: "mock_refresh_token",
			IDToken:      "mock_id_token",
		}, nil
	}

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", s.clientID)
	data.Set("client_secret", s.clientSecret)
	data.Set("redirect_uri", s.redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.Post(GoogleTokenURL, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google token error: %s", string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

// GetUserInfo busca informações do usuário no Google
func (s *GoogleOAuthService) GetUserInfo(accessToken string) (*GoogleUserInfo, error) {
	if !s.isConfigured || accessToken == "mock_access_token" {
		// Mock mode - retorna usuário fake
		return &GoogleUserInfo{
			Sub:           "google_mock_" + fmt.Sprintf("%d", len(accessToken)),
			Email:         "mockuser@gmail.com",
			EmailVerified: true,
			Name:          "Mock User",
			Picture:       "https://via.placeholder.com/150",
			GivenName:     "Mock",
			FamilyName:    "User",
		}, nil
	}

	req, err := http.NewRequest("GET", GoogleUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google userinfo error: %s", string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// TokenResponse representa a resposta de token do Google
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	IDToken      string `json:"id_token"`
	Scope        string `json:"scope"`
}
