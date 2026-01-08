package federation

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/identity"
	"prost-qs/backend/pkg/utils"
)

// ========================================
// FEDERATION SERVICE
// "Google é provider. Identity é soberana."
// ========================================

const (
	OAuthStateExpiration = 10 * time.Minute
)

var (
	ErrStateNotFound     = errors.New("oauth state not found")
	ErrStateExpired      = errors.New("oauth state expired")
	ErrStateAlreadyUsed  = errors.New("oauth state already used")
	ErrProviderNotLinked = errors.New("provider not linked to any identity")
	ErrAlreadyLinked     = errors.New("provider already linked to another identity")
	ErrCannotUnlink      = errors.New("cannot unlink primary identity provider")
)

// FederationService gerencia federação de identidades
type FederationService struct {
	db            *gorm.DB
	googleService *GoogleOAuthService
}

// NewFederationService cria uma nova instância
func NewFederationService(db *gorm.DB, googleService *GoogleOAuthService) *FederationService {
	return &FederationService{
		db:            db,
		googleService: googleService,
	}
}

// ========================================
// OAUTH FLOW
// ========================================

// StartOAuthFlow inicia o fluxo OAuth
func (s *FederationService) StartOAuthFlow(provider, redirectURI, requestIP string, userID *uuid.UUID) (*OAuthState, string, error) {
	stateID := uuid.New()

	state := &OAuthState{
		StateID:     stateID,
		Provider:    provider,
		RedirectURI: redirectURI,
		RequestIP:   requestIP,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(OAuthStateExpiration),
		Used:        false,
	}

	if userID != nil {
		state.UserID = *userID
	}

	if err := s.db.Create(state).Error; err != nil {
		return nil, "", fmt.Errorf("failed to create oauth state: %w", err)
	}

	// Get auth URL based on provider
	var authURL string
	var err error

	switch Provider(provider) {
	case ProviderGoogle:
		authURL, err = s.googleService.GetAuthURL(stateID.String())
	default:
		return nil, "", fmt.Errorf("unsupported provider: %s", provider)
	}

	if err != nil {
		return nil, "", err
	}

	return state, authURL, nil
}

// CompleteOAuthFlow completa o fluxo OAuth após callback
func (s *FederationService) CompleteOAuthFlow(stateID uuid.UUID, code string) (*identity.SovereignIdentity, *FederatedIdentity, string, error) {
	// 1. Validate state
	var state OAuthState
	if err := s.db.Where("state_id = ?", stateID).First(&state).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, "", ErrStateNotFound
		}
		return nil, nil, "", err
	}

	if state.Used {
		return nil, nil, "", ErrStateAlreadyUsed
	}

	if time.Now().After(state.ExpiresAt) {
		return nil, nil, "", ErrStateExpired
	}

	// 2. Mark state as used
	state.Used = true
	s.db.Save(&state)

	// 3. Exchange code for tokens
	var userInfo *GoogleUserInfo
	var accessToken string
	var tokenExpiry time.Time

	switch Provider(state.Provider) {
	case ProviderGoogle:
		tokenResp, err := s.googleService.ExchangeCode(code)
		if err != nil {
			return nil, nil, "", fmt.Errorf("failed to exchange code: %w", err)
		}

		accessToken = tokenResp.AccessToken
		tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

		userInfo, err = s.googleService.GetUserInfo(accessToken)
		if err != nil {
			return nil, nil, "", fmt.Errorf("failed to get user info: %w", err)
		}
	default:
		return nil, nil, "", fmt.Errorf("unsupported provider: %s", state.Provider)
	}

	// 4. Find or create identity
	sovereignIdentity, fedIdentity, isNew, err := s.linkOrCreateIdentity(
		state.Provider,
		userInfo.Sub,
		userInfo.Email,
		userInfo.Name,
		userInfo.Picture,
		accessToken,
		tokenExpiry,
		state.UserID,
	)
	if err != nil {
		return nil, nil, "", err
	}

	// 5. Generate session token with role and status
	token, _, err := utils.GenerateJWT(sovereignIdentity.UserID.String(), "user", "active")
	if err != nil {
		return nil, nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	_ = isNew // Pode ser usado para analytics

	return sovereignIdentity, fedIdentity, token, nil
}

// linkOrCreateIdentity linka provider a identity existente ou cria nova
func (s *FederationService) linkOrCreateIdentity(
	provider, providerID, email, name, picture, accessToken string,
	tokenExpiry time.Time,
	existingUserID uuid.UUID,
) (*identity.SovereignIdentity, *FederatedIdentity, bool, error) {

	// Check if provider already linked
	var existingLink FederatedIdentity
	err := s.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&existingLink).Error

	if err == nil {
		// Provider already linked - return existing identity
		var sovereignIdentity identity.SovereignIdentity
		if err := s.db.Where("user_id = ?", existingLink.UserID).First(&sovereignIdentity).Error; err != nil {
			return nil, nil, false, err
		}

		// Update token
		existingLink.AccessToken = accessToken
		existingLink.TokenExpiry = tokenExpiry
		existingLink.UpdatedAt = time.Now()
		s.db.Save(&existingLink)

		return &sovereignIdentity, &existingLink, false, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, false, err
	}

	// Provider not linked yet
	var sovereignIdentity *identity.SovereignIdentity
	isNew := false

	// Check if linking to existing identity
	if existingUserID != uuid.Nil {
		var existing identity.SovereignIdentity
		if err := s.db.Where("user_id = ?", existingUserID).First(&existing).Error; err != nil {
			return nil, nil, false, fmt.Errorf("existing identity not found: %w", err)
		}
		sovereignIdentity = &existing
	} else {
		// Try to find identity by email (auto-merge)
		var existingByEmail identity.SovereignIdentity
		// Note: This assumes email might be stored somewhere - adjust as needed
		
		// Create new sovereign identity
		sovereignIdentity = &identity.SovereignIdentity{
			UserID:       uuid.New(),
			PrimaryPhone: "", // Will be set when phone is verified
			Source:       "oauth_" + provider,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		if err := s.db.Create(sovereignIdentity).Error; err != nil {
			return nil, nil, false, fmt.Errorf("failed to create identity: %w", err)
		}
		isNew = true

		_ = existingByEmail // Placeholder for future email merge logic
	}

	// Create federated identity link
	fedIdentity := &FederatedIdentity{
		LinkID:      uuid.New(),
		UserID:      sovereignIdentity.UserID,
		Provider:    provider,
		ProviderID:  providerID,
		Email:       email,
		Name:        name,
		Picture:     picture,
		AccessToken: accessToken,
		TokenExpiry: tokenExpiry,
		LinkedAt:    time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(fedIdentity).Error; err != nil {
		return nil, nil, false, fmt.Errorf("failed to create federated identity: %w", err)
	}

	return sovereignIdentity, fedIdentity, isNew, nil
}

// ========================================
// IDENTITY LINKING
// ========================================

// LinkProvider linka um provider a uma identity existente
func (s *FederationService) LinkProvider(userID uuid.UUID, provider, providerID, email, name, picture string) (*FederatedIdentity, error) {
	// Check if already linked to another identity
	var existing FederatedIdentity
	err := s.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&existing).Error
	if err == nil {
		if existing.UserID != userID {
			return nil, ErrAlreadyLinked
		}
		return &existing, nil // Already linked to this identity
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create link
	link := &FederatedIdentity{
		LinkID:     uuid.New(),
		UserID:     userID,
		Provider:   provider,
		ProviderID: providerID,
		Email:      email,
		Name:       name,
		Picture:    picture,
		LinkedAt:   time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.db.Create(link).Error; err != nil {
		return nil, err
	}

	return link, nil
}

// UnlinkProvider remove um provider de uma identity
func (s *FederationService) UnlinkProvider(userID uuid.UUID, provider string) error {
	// Check if identity has other providers or phone
	var identity identity.SovereignIdentity
	if err := s.db.Where("user_id = ?", userID).First(&identity).Error; err != nil {
		return err
	}

	// Count linked providers
	var count int64
	s.db.Model(&FederatedIdentity{}).Where("user_id = ?", userID).Count(&count)

	// If no phone and only one provider, cannot unlink
	if identity.PrimaryPhone == "" && count <= 1 {
		return ErrCannotUnlink
	}

	// Delete link
	return s.db.Where("user_id = ? AND provider = ?", userID, provider).Delete(&FederatedIdentity{}).Error
}

// GetLinkedProviders retorna todos os providers linkados a uma identity
func (s *FederationService) GetLinkedProviders(userID uuid.UUID) ([]FederatedIdentity, error) {
	var links []FederatedIdentity
	if err := s.db.Where("user_id = ?", userID).Find(&links).Error; err != nil {
		return nil, err
	}
	return links, nil
}

// GetIdentityByProvider busca identity por provider
func (s *FederationService) GetIdentityByProvider(provider, providerID string) (*identity.SovereignIdentity, error) {
	var link FederatedIdentity
	if err := s.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&link).Error; err != nil {
		return nil, ErrProviderNotLinked
	}

	var sovereignIdentity identity.SovereignIdentity
	if err := s.db.Where("user_id = ?", link.UserID).First(&sovereignIdentity).Error; err != nil {
		return nil, err
	}

	return &sovereignIdentity, nil
}
