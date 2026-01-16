package federation

import (
	"errors"
	"fmt"
	"log"
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
	log.Printf("[OAUTH] Iniciando CompleteOAuthFlow para state=%s", stateID)

	// 1. Validate state
	var state OAuthState
	if err := s.db.Where("state_id = ?", stateID).First(&state).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[OAUTH] ERRO: State não encontrado: %s", stateID)
			return nil, nil, "", ErrStateNotFound
		}
		log.Printf("[OAUTH] ERRO: Falha ao buscar state: %v", err)
		return nil, nil, "", err
	}

	if state.Used {
		log.Printf("[OAUTH] ERRO: State já utilizado: %s", stateID)
		return nil, nil, "", ErrStateAlreadyUsed
	}

	if time.Now().After(state.ExpiresAt) {
		log.Printf("[OAUTH] ERRO: State expirado: %s (expirou em %v)", stateID, state.ExpiresAt)
		return nil, nil, "", ErrStateExpired
	}

	log.Printf("[OAUTH] State válido, marcando como usado")

	// 2. Mark state as used
	state.Used = true
	s.db.Save(&state)

	// 3. Exchange code for tokens
	var userInfo *GoogleUserInfo
	var accessToken string
	var tokenExpiry time.Time

	switch Provider(state.Provider) {
	case ProviderGoogle:
		log.Printf("[OAUTH] Trocando código por tokens com Google...")
		tokenResp, err := s.googleService.ExchangeCode(code)
		if err != nil {
			log.Printf("[OAUTH] ERRO: Falha ao trocar código: %v", err)
			return nil, nil, "", fmt.Errorf("failed to exchange code: %w", err)
		}

		accessToken = tokenResp.AccessToken
		tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

		log.Printf("[OAUTH] Token obtido, buscando info do usuário...")
		userInfo, err = s.googleService.GetUserInfo(accessToken)
		if err != nil {
			log.Printf("[OAUTH] ERRO: Falha ao obter info do usuário: %v", err)
			return nil, nil, "", fmt.Errorf("failed to get user info: %w", err)
		}
		log.Printf("[OAUTH] Usuário Google: email=%s, name=%s, sub=%s", userInfo.Email, userInfo.Name, userInfo.Sub)
	default:
		log.Printf("[OAUTH] ERRO: Provider não suportado: %s", state.Provider)
		return nil, nil, "", fmt.Errorf("unsupported provider: %s", state.Provider)
	}

	// 4. Find or create identity
	log.Printf("[OAUTH] Linkando ou criando identity para provider=%s, providerID=%s", state.Provider, userInfo.Sub)
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
		log.Printf("[OAUTH] ERRO: Falha ao linkar/criar identity: %v", err)
		return nil, nil, "", err
	}

	log.Printf("[OAUTH] Identity OK: userID=%s, isNew=%v", sovereignIdentity.UserID, isNew)

	// 5. Buscar role e status do usuário na tabela users
	var user identity.User
	userRole := "user"
	userStatus := "active"
	if err := s.db.Where("id = ?", sovereignIdentity.UserID).First(&user).Error; err == nil {
		if user.Role != "" {
			userRole = user.Role
		}
		if user.Status != "" {
			userStatus = user.Status
		}
		log.Printf("[OAUTH] Usuário encontrado na tabela users: role=%s, status=%s", userRole, userStatus)
	} else {
		log.Printf("[OAUTH] Usuário não encontrado na tabela users, usando defaults: role=%s, status=%s", userRole, userStatus)
	}

	// 6. Generate session token with role and status from database
	token, _, err := utils.GenerateJWT(sovereignIdentity.UserID.String(), userRole, userStatus)
	if err != nil {
		log.Printf("[OAUTH] ERRO: Falha ao gerar JWT: %v", err)
		return nil, nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	log.Printf("[OAUTH] ✅ Login bem-sucedido! Usuário %s logado com role=%s. Token expira em: %v", userInfo.Email, userRole, time.Now().Add(24*time.Hour))

	_ = isNew // Pode ser usado para analytics

	return sovereignIdentity, fedIdentity, token, nil
}

// linkOrCreateIdentity linka provider a identity existente ou cria nova
func (s *FederationService) linkOrCreateIdentity(
	provider, providerID, email, name, picture, accessToken string,
	tokenExpiry time.Time,
	existingUserID uuid.UUID,
) (*identity.SovereignIdentity, *FederatedIdentity, bool, error) {

	log.Printf("[OAUTH-LINK] Verificando se provider já está linkado: provider=%s, providerID=%s", provider, providerID)

	// Check if provider already linked
	var existingLink FederatedIdentity
	err := s.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&existingLink).Error

	if err == nil {
		log.Printf("[OAUTH-LINK] Provider já linkado! userID=%s, atualizando token...", existingLink.UserID)
		// Provider already linked - return existing identity
		var sovereignIdentity identity.SovereignIdentity
		if err := s.db.Where("user_id = ?", existingLink.UserID).First(&sovereignIdentity).Error; err != nil {
			log.Printf("[OAUTH-LINK] ERRO: Sovereign identity não encontrada para userID=%s: %v", existingLink.UserID, err)
			return nil, nil, false, err
		}

		// Update token
		existingLink.AccessToken = accessToken
		existingLink.TokenExpiry = tokenExpiry
		existingLink.UpdatedAt = time.Now()
		s.db.Save(&existingLink)

		log.Printf("[OAUTH-LINK] ✅ Usuário existente retornado: userID=%s", sovereignIdentity.UserID)
		return &sovereignIdentity, &existingLink, false, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("[OAUTH-LINK] ERRO: Falha ao buscar federated identity: %v", err)
		return nil, nil, false, err
	}

	log.Printf("[OAUTH-LINK] Provider não linkado ainda, criando novo link...")

	// Provider not linked yet
	var sovereignIdentity *identity.SovereignIdentity
	isNew := false

	// Check if linking to existing identity
	if existingUserID != uuid.Nil {
		log.Printf("[OAUTH-LINK] Linkando a identity existente: userID=%s", existingUserID)
		var existing identity.SovereignIdentity
		if err := s.db.Where("user_id = ?", existingUserID).First(&existing).Error; err != nil {
			log.Printf("[OAUTH-LINK] ERRO: Identity existente não encontrada: %v", err)
			return nil, nil, false, fmt.Errorf("existing identity not found: %w", err)
		}
		sovereignIdentity = &existing
	} else {
		// Try to find identity by email in federated_identities (auto-merge)
		log.Printf("[OAUTH-LINK] Buscando identity existente por email=%s", email)
		var existingFedByEmail FederatedIdentity
		if err := s.db.Where("email = ?", email).First(&existingFedByEmail).Error; err == nil {
			log.Printf("[OAUTH-LINK] Encontrada federated identity com mesmo email! userID=%s", existingFedByEmail.UserID)
			// Found existing federated identity with same email - use that sovereign identity
			var existing identity.SovereignIdentity
			if err := s.db.Where("user_id = ?", existingFedByEmail.UserID).First(&existing).Error; err == nil {
				sovereignIdentity = &existing
				log.Printf("[OAUTH-LINK] Usando sovereign identity existente: userID=%s", existing.UserID)
			}
		}

		// If no existing identity found, create new one
		if sovereignIdentity == nil {
			newUserID := uuid.New()
			log.Printf("[OAUTH-LINK] Criando nova sovereign identity: userID=%s", newUserID)
			sovereignIdentity = &identity.SovereignIdentity{
				UserID:       newUserID,
				PrimaryPhone: newUserID.String()[:8], // Use partial UUID as unique placeholder instead of empty string
				Source:       "oauth_" + provider,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}

			if err := s.db.Create(sovereignIdentity).Error; err != nil {
				log.Printf("[OAUTH-LINK] ERRO: Falha ao criar sovereign identity: %v", err)
				return nil, nil, false, fmt.Errorf("failed to create identity: %w", err)
			}
			isNew = true
			log.Printf("[OAUTH-LINK] ✅ Nova sovereign identity criada: userID=%s", sovereignIdentity.UserID)
		}
	}

	// Create federated identity link
	log.Printf("[OAUTH-LINK] Criando federated identity link...")
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
		log.Printf("[OAUTH-LINK] ERRO: Falha ao criar federated identity: %v", err)
		return nil, nil, false, fmt.Errorf("failed to create federated identity: %w", err)
	}

	log.Printf("[OAUTH-LINK] ✅ Federated identity criada: linkID=%s, userID=%s", fedIdentity.LinkID, sovereignIdentity.UserID)
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
