package identity

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ========================================
// MULTI-APP IDENTITY MODELS
// "Usuário ≠ Conta de App"
// 
// Princípios:
// 1. User é único no PROST-QS
// 2. UserOrigin é a "certidão de nascimento" (nunca muda)
// 3. AppMembership é o vínculo explícito com cada app
// 4. Nenhum acesso é automático
// ========================================

// UserOrigin registra onde o usuário criou sua conta (imutável)
type UserOrigin struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	AppID     uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	CreatedAt time.Time `json:"created_at" gorm:"not null"`
}

func (UserOrigin) TableName() string {
	return "user_origins"
}

// AppMembership representa o vínculo explícito entre usuário e app
type AppMembership struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index:idx_membership_user"`
	AppID        uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index:idx_membership_app"`
	Role         string    `json:"role" gorm:"type:text;default:'user'"`
	Status       string    `json:"status" gorm:"type:text;default:'pending'"`
	LinkedAt     time.Time `json:"linked_at"`
	LastAccessAt time.Time `json:"last_access_at"`
	Metadata     string    `json:"metadata" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at" gorm:"not null"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (AppMembership) TableName() string {
	return "app_memberships"
}

// AppUserLink alias para compatibilidade
type AppUserLink = AppMembership

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	Name        string `json:"name" binding:"required"`
	OriginAppID string `json:"origin_app_id"`
}

type LoginRequest struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required"`
	RequestingAppID string `json:"requesting_app_id"`
}

type LinkAppRequest struct {
	AppID string `json:"app_id" binding:"required,uuid"`
}

type MembershipInfo struct {
	AppID        string    `json:"app_id"`
	AppName      string    `json:"app_name"`
	Role         string    `json:"role"`
	Status       string    `json:"status"`
	LinkedAt     time.Time `json:"linked_at"`
	LastAccessAt time.Time `json:"last_access_at"`
}

type MultiAppAuthResponse struct {
	UserID       string           `json:"user_id"`
	Email        string           `json:"email"`
	Name         string           `json:"name"`
	Token        string           `json:"token"`
	ExpiresAt    int64            `json:"expires_at"`
	IsNewUser    bool             `json:"is_new_user"`
	OriginAppID  string           `json:"origin_app_id"`
	Memberships  []MembershipInfo `json:"memberships"`
	NeedsLink    bool             `json:"needs_link"`
	Plan         string           `json:"plan"`
	Capabilities []string         `json:"capabilities"`
}

type MultiAppUserProfile struct {
	ID               string           `json:"id"`
	Email            string           `json:"email"`
	Name             string           `json:"name"`
	Role             string           `json:"role"`
	Status           string           `json:"status"`
	OriginAppID      string           `json:"origin_app_id"`
	OriginAppName    string           `json:"origin_app_name"`
	Memberships      []MembershipInfo `json:"memberships"`
	BillingAccountID string           `json:"billing_account_id,omitempty"`
	Plan             string           `json:"plan"`
	CreatedAt        time.Time        `json:"created_at"`
}

// ========================================
// HANDLER
// ========================================

type MultiAppIdentityHandler struct {
	db        *gorm.DB
	jwtSecret string
}

func NewMultiAppIdentityHandler(db *gorm.DB, jwtSecret string) *MultiAppIdentityHandler {
	db.AutoMigrate(&UserOrigin{})
	db.AutoMigrate(&AppMembership{})
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_user_app ON app_memberships(user_id, app_id)")
	return &MultiAppIdentityHandler{db: db, jwtSecret: jwtSecret}
}

// Register cria usuário com origem
func (h *MultiAppIdentityHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var originAppID uuid.UUID
	if req.OriginAppID != "" {
		originAppID, _ = uuid.Parse(req.OriginAppID)
	} else if appIDStr, exists := c.Get("app_id"); exists {
		originAppID, _ = uuid.Parse(appIDStr.(string))
	}

	var existingUser User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email já cadastrado"})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	userID := uuid.New()
	now := time.Now()

	user := User{
		ID:           userID,
		Username:     req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "user",
		Status:       "active",
		CreatedAt:    now,
		UpdatedAt:    now,
		Version:      1,
	}
	h.db.Create(&user)

	var memberships []MembershipInfo
	if originAppID != uuid.Nil {
		h.db.Create(&UserOrigin{ID: uuid.New(), UserID: userID, AppID: originAppID, CreatedAt: now})
		h.db.Create(&AppMembership{
			ID: uuid.New(), UserID: userID, AppID: originAppID,
			Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
			CreatedAt: now, UpdatedAt: now,
		})
		var appName string
		h.db.Table("applications").Select("name").Where("id = ?", originAppID).Scan(&appName)
		memberships = append(memberships, MembershipInfo{
			AppID: originAppID.String(), AppName: appName, Role: "user",
			Status: "active", LinkedAt: now, LastAccessAt: now,
		})
	}

	token, expiresAt := h.generateJWT(userID, req.Email, req.Name, "user", originAppID, memberships)
	c.JSON(http.StatusCreated, MultiAppAuthResponse{
		UserID: userID.String(), Email: req.Email, Name: req.Name,
		Token: token, ExpiresAt: expiresAt.Unix(), IsNewUser: true,
		OriginAppID: originAppID.String(), Memberships: memberships,
		Plan: "free", Capabilities: []string{},
	})
}

// Login autentica e verifica membership
func (h *MultiAppIdentityHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}
	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Conta inativa"})
		return
	}

	var origin UserOrigin
	var originAppID uuid.UUID
	if h.db.Where("user_id = ?", user.ID).First(&origin).Error == nil {
		originAppID = origin.AppID
	}

	memberships := h.getMemberships(user.ID)

	var requestingAppID uuid.UUID
	if req.RequestingAppID != "" {
		requestingAppID, _ = uuid.Parse(req.RequestingAppID)
	} else if appIDStr, exists := c.Get("app_id"); exists {
		requestingAppID, _ = uuid.Parse(appIDStr.(string))
	}

	needsLink := false
	if requestingAppID != uuid.Nil {
		hasMembership := false
		for _, m := range memberships {
			if m.AppID == requestingAppID.String() && m.Status == "active" {
				hasMembership = true
				h.db.Model(&AppMembership{}).Where("user_id = ? AND app_id = ?", user.ID, requestingAppID).
					Update("last_access_at", time.Now())
				break
			}
		}
		if !hasMembership {
			needsLink = true
		}
	}

	plan := h.getUserPlan(user.ID)
	token, expiresAt := h.generateJWT(user.ID, user.Email, user.Username, user.Role, originAppID, memberships)

	c.JSON(http.StatusOK, MultiAppAuthResponse{
		UserID: user.ID.String(), Email: user.Email, Name: user.Username,
		Token: token, ExpiresAt: expiresAt.Unix(), IsNewUser: false,
		OriginAppID: originAppID.String(), Memberships: memberships,
		NeedsLink: needsLink, Plan: plan, Capabilities: h.getCapabilities(plan),
	})
}

// LinkApp vincula usuário a app (com confirmação)
func (h *MultiAppIdentityHandler) LinkApp(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	var req LinkAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	appID, _ := uuid.Parse(req.AppID)

	var appCount int64
	h.db.Table("applications").Where("id = ?", appID).Count(&appCount)
	if appCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "App não encontrado"})
		return
	}

	var existing AppMembership
	now := time.Now()
	if h.db.Where("user_id = ? AND app_id = ?", userID, appID).First(&existing).Error == nil {
		if existing.Status == "active" {
			c.JSON(http.StatusOK, gin.H{"message": "Já vinculado"})
			return
		}
		h.db.Model(&existing).Updates(map[string]interface{}{
			"status": "active", "linked_at": now, "last_access_at": now, "updated_at": now,
		})
	} else {
		h.db.Create(&AppMembership{
			ID: uuid.New(), UserID: userID, AppID: appID,
			Role: "user", Status: "active", LinkedAt: now, LastAccessAt: now,
			CreatedAt: now, UpdatedAt: now,
		})
	}

	var user User
	h.db.First(&user, "id = ?", userID)
	var origin UserOrigin
	var originAppID uuid.UUID
	if h.db.Where("user_id = ?", userID).First(&origin).Error == nil {
		originAppID = origin.AppID
	}
	memberships := h.getMemberships(userID)
	token, expiresAt := h.generateJWT(userID, user.Email, user.Username, user.Role, originAppID, memberships)

	c.JSON(http.StatusCreated, gin.H{
		"success": true, "token": token, "expires_at": expiresAt.Unix(), "memberships": memberships,
	})
}

// GetProfile retorna perfil do usuário
func (h *MultiAppIdentityHandler) GetProfile(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	userID, _ := uuid.Parse(userIDStr)

	var user User
	if h.db.First(&user, "id = ?", userID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	var origin UserOrigin
	var originAppID, originAppName string
	if h.db.Where("user_id = ?", userID).First(&origin).Error == nil {
		originAppID = origin.AppID.String()
		h.db.Table("applications").Select("name").Where("id = ?", origin.AppID).Scan(&originAppName)
	}

	var billingAccountID string
	h.db.Table("billing_accounts").Select("account_id").Where("user_id = ?", userID).Scan(&billingAccountID)

	c.JSON(http.StatusOK, MultiAppUserProfile{
		ID: user.ID.String(), Email: user.Email, Name: user.Username,
		Role: user.Role, Status: user.Status,
		OriginAppID: originAppID, OriginAppName: originAppName,
		Memberships: h.getMemberships(userID), BillingAccountID: billingAccountID,
		Plan: h.getUserPlan(userID), CreatedAt: user.CreatedAt,
	})
}

// GetLinkedApps retorna apps do usuário
func (h *MultiAppIdentityHandler) GetLinkedApps(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autenticado"})
		return
	}
	userID, _ := uuid.Parse(userIDStr)
	memberships := h.getMemberships(userID)
	c.JSON(http.StatusOK, gin.H{"memberships": memberships, "total": len(memberships)})
}

// ========================================
// HELPERS
// ========================================

func (h *MultiAppIdentityHandler) getMemberships(userID uuid.UUID) []MembershipInfo {
	var memberships []AppMembership
	h.db.Where("user_id = ?", userID).Find(&memberships)

	result := make([]MembershipInfo, 0, len(memberships))
	for _, m := range memberships {
		var appName string
		h.db.Table("applications").Select("name").Where("id = ?", m.AppID).Scan(&appName)
		result = append(result, MembershipInfo{
			AppID: m.AppID.String(), AppName: appName, Role: m.Role,
			Status: m.Status, LinkedAt: m.LinkedAt, LastAccessAt: m.LastAccessAt,
		})
	}
	return result
}

func (h *MultiAppIdentityHandler) getUserPlan(userID uuid.UUID) string {
	var sub struct{ PlanID string }
	err := h.db.Table("subscriptions").Select("plan_id").
		Joins("JOIN billing_accounts ON billing_accounts.account_id = subscriptions.account_id").
		Where("billing_accounts.user_id = ? AND subscriptions.status IN ?", userID, []string{"active", "trialing"}).
		Order("subscriptions.created_at DESC").First(&sub).Error
	if err != nil || sub.PlanID == "" {
		return "free"
	}
	return sub.PlanID
}

func (h *MultiAppIdentityHandler) getCapabilities(plan string) []string {
	switch plan {
	case "pro":
		return []string{"vox:unlimited", "sce:projects:5", "prost:apps:5"}
	case "enterprise":
		return []string{"vox:unlimited", "sce:unlimited", "prost:unlimited"}
	default:
		return []string{"vox:basic", "sce:projects:1", "prost:apps:1"}
	}
}

func (h *MultiAppIdentityHandler) generateJWT(userID uuid.UUID, email, name, role string, originAppID uuid.UUID, memberships []MembershipInfo) (string, time.Time) {
	expiresAt := time.Now().Add(24 * time.Hour)
	appIDs := make([]string, len(memberships))
	for i, m := range memberships {
		appIDs[i] = m.AppID
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":           userID.String(),
		"email":         email,
		"name":          name,
		"role":          role,
		"origin_app_id": originAppID.String(),
		"memberships":   appIDs,
		"type":          "global_user",
		"exp":           expiresAt.Unix(),
		"iat":           time.Now().Unix(),
	})
	tokenString, _ := token.SignedString([]byte(h.jwtSecret))
	return tokenString, expiresAt
}

// ========================================
// ROUTES
// ========================================

func RegisterMultiAppIdentityRoutes(router *gin.RouterGroup, db *gorm.DB, jwtSecret string, authMiddleware, appContextMiddleware gin.HandlerFunc) {
	handler := NewMultiAppIdentityHandler(db, jwtSecret)

	identity := router.Group("/identity")
	{
		identity.POST("/register", appContextMiddleware, handler.Register)
		identity.POST("/login", appContextMiddleware, handler.Login)
		identity.POST("/link-app", authMiddleware, handler.LinkApp)
		identity.GET("/profile", authMiddleware, handler.GetProfile)
		identity.GET("/profile/apps", authMiddleware, handler.GetLinkedApps)
	}
}
