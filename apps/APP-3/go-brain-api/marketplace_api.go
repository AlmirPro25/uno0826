package main

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MARKETPLACE API - Endpoints REST                           ║
║                                                                               ║
║              "Vendemos atalhos cognitivos, não templates"                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// MarketplaceAPI gerencia os endpoints do marketplace
type MarketplaceAPI struct {
	store           *StarterKitStore
	classifier      *CodeClassifier
	readmeGenerator *ReadmeGenerator
}

// NewMarketplaceAPI cria nova instância da API
func NewMarketplaceAPI(store *StarterKitStore, classifier *CodeClassifier) *MarketplaceAPI {
	return &MarketplaceAPI{
		store:           store,
		classifier:      classifier,
		readmeGenerator: NewReadmeGenerator(),
	}
}

// RegisterRoutes registra as rotas no Gin
func (api *MarketplaceAPI) RegisterRoutes(r *gin.Engine) {
	// Grupo de rotas do marketplace
	marketplace := r.Group("/v1/marketplace")
	{
		// ═══════════════════════════════════════════════════════════════════
		// STARTER KITS
		// ═══════════════════════════════════════════════════════════════════
		
		// Criar novo Starter Kit (a partir de uma geração)
		marketplace.POST("/kits", api.CreateKit)
		
		// Listar kits públicos
		marketplace.GET("/kits", api.ListPublicKits)
		
		// Buscar kit por ID
		marketplace.GET("/kits/:id", api.GetKit)
		
		// Atualizar kit (owner only)
		marketplace.PUT("/kits/:id", api.UpdateKit)
		
		// Deletar kit (owner only)
		marketplace.DELETE("/kits/:id", api.DeleteKit)
		
		// Listar meus kits
		marketplace.GET("/my-kits", api.ListMyKits)

		// ═══════════════════════════════════════════════════════════════════
		// CLASSIFICAÇÃO
		// ═══════════════════════════════════════════════════════════════════
		
		// Classificar código (sem salvar)
		marketplace.POST("/classify", api.ClassifyCode)
		
		// Reclassificar kit existente
		marketplace.POST("/kits/:id/reclassify", api.ReclassifyKit)

		// ═══════════════════════════════════════════════════════════════════
		// MARKETPLACE ACTIONS
		// ═══════════════════════════════════════════════════════════════════
		
		// Publicar kit no marketplace
		marketplace.POST("/kits/:id/publish", api.PublishKit)
		
		// Despublicar kit
		marketplace.POST("/kits/:id/unpublish", api.UnpublishKit)
		
		// Registrar view
		marketplace.POST("/kits/:id/view", api.RecordView)
		
		// Registrar download
		marketplace.POST("/kits/:id/download", api.RecordDownload)

		// ═══════════════════════════════════════════════════════════════════
		// TRAINING DATA
		// ═══════════════════════════════════════════════════════════════════
		
		// Exportar dados para treinamento
		marketplace.GET("/training-data", api.GetTrainingData)
		
		// Adicionar kit ao dataset de treinamento
		marketplace.POST("/kits/:id/add-to-training", api.AddToTraining)

		// ═══════════════════════════════════════════════════════════════════
		// README GENERATION
		// ═══════════════════════════════════════════════════════════════════
		
		// Gerar README para um kit
		marketplace.POST("/kits/:id/generate-readme", api.GenerateReadme)
		
		// Gerar diagrama de arquitetura
		marketplace.GET("/kits/:id/architecture-diagram", api.GetArchitectureDiagram)

		// ═══════════════════════════════════════════════════════════════════
		// STATS
		// ═══════════════════════════════════════════════════════════════════
		
		// Estatísticas gerais
		marketplace.GET("/stats", api.GetStats)
		
		// Estatísticas do classificador
		marketplace.GET("/classifier/stats", api.GetClassifierStats)
		
		// ═══════════════════════════════════════════════════════════════════
		// SEARCH
		// ═══════════════════════════════════════════════════════════════════
		
		// Busca semântica de kits
		marketplace.GET("/search", api.SearchKits)
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - STARTER KITS
// ═══════════════════════════════════════════════════════════════════════════════

// CreateKitRequest representa a requisição para criar um kit
type CreateKitRequest struct {
	Code     string `json:"code" binding:"required"`
	Prompt   string `json:"prompt" binding:"required"`
	OwnerID  string `json:"owner_id" binding:"required"`
	README   string `json:"readme"`
	Category string `json:"category"`
}

// CreateKit cria um novo Starter Kit
func (api *MarketplaceAPI) CreateKit(c *gin.Context) {
	var req CreateKitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cria o kit
	kit := NewStarterKit(req.Code, req.Prompt, req.OwnerID)
	kit.README = req.README

	// Classifica automaticamente
	classification := api.classifier.Classify(req.Code)
	kit.Classification = classification

	// Detecta categoria e complexidade
	if req.Category != "" {
		kit.Metadata.Category = req.Category
	} else {
		kit.Metadata.Category = api.classifier.DetectCategory(req.Code, req.Prompt)
	}
	
	complexity, hours := api.classifier.EstimateComplexity(req.Code)
	kit.Metadata.Complexity = complexity
	kit.Metadata.EstimatedHours = hours
	kit.Metadata.LinesOfCode = len(req.Code) / 50 // Estimativa
	kit.Metadata.GeneratedAt = time.Now().UTC()

	// Salva
	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Registra evento
	api.store.RecordEvent(kit.ID, "created", req.OwnerID, map[string]interface{}{
		"quality_score": classification.QualityScore,
		"grade":         classification.Grade,
	})

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"kit":     kit,
		"message": "Starter Kit criado com sucesso!",
	})
}

// ListPublicKits lista kits públicos
func (api *MarketplaceAPI) ListPublicKits(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	category := c.Query("category")

	kits, err := api.store.ListPublic(limit, offset, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"kits":   kits,
		"count":  len(kits),
		"limit":  limit,
		"offset": offset,
	})
}

// GetKit busca um kit por ID
func (api *MarketplaceAPI) GetKit(c *gin.Context) {
	id := c.Param("id")

	kit, err := api.store.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	c.JSON(http.StatusOK, kit)
}

// UpdateKit atualiza um kit
func (api *MarketplaceAPI) UpdateKit(c *gin.Context) {
	id := c.Param("id")
	ownerID := c.GetHeader("X-Owner-ID")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	// Verifica ownership
	if kit.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é o dono deste kit"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Aplica updates permitidos
	if readme, ok := updates["readme"].(string); ok {
		kit.README = readme
	}
	if arch, ok := updates["architecture"].(string); ok {
		kit.Architecture = arch
	}

	kit.UpdatedAt = time.Now().UTC()

	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, kit)
}

// DeleteKit deleta um kit
func (api *MarketplaceAPI) DeleteKit(c *gin.Context) {
	id := c.Param("id")
	ownerID := c.GetHeader("X-Owner-ID")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	if kit.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é o dono deste kit"})
		return
	}

	// Soft delete - apenas despublica
	kit.IsPublic = false
	kit.MarketplaceStatus.IsListed = false
	kit.MarketplaceStatus.UnlistedAt = time.Now().UTC()

	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Kit removido do marketplace"})
}

// ListMyKits lista kits do usuário
func (api *MarketplaceAPI) ListMyKits(c *gin.Context) {
	ownerID := c.GetHeader("X-Owner-ID")
	if ownerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "X-Owner-ID header required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	kits, err := api.store.ListByOwner(ownerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"kits":  kits,
		"count": len(kits),
	})
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - CLASSIFICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// ClassifyRequest representa requisição de classificação
type ClassifyRequest struct {
	Code   string `json:"code" binding:"required"`
	Prompt string `json:"prompt"`
}

// ClassifyCode classifica código sem salvar
func (api *MarketplaceAPI) ClassifyCode(c *gin.Context) {
	var req ClassifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	classification := api.classifier.Classify(req.Code)
	category := api.classifier.DetectCategory(req.Code, req.Prompt)
	complexity, hours := api.classifier.EstimateComplexity(req.Code)

	c.JSON(http.StatusOK, gin.H{
		"classification": classification,
		"category":       category,
		"complexity":     complexity,
		"estimated_hours": hours,
		"can_be_listed":  classification.IsValid && classification.QualityScore >= 60,
	})
}

// ReclassifyKit reclassifica um kit existente
func (api *MarketplaceAPI) ReclassifyKit(c *gin.Context) {
	id := c.Param("id")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	// Reclassifica
	kit.Classification = api.classifier.Classify(kit.Code)
	kit.UpdatedAt = time.Now().UTC()

	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"classification": kit.Classification,
	})
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - MARKETPLACE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// PublishKit publica kit no marketplace
func (api *MarketplaceAPI) PublishKit(c *gin.Context) {
	id := c.Param("id")
	ownerID := c.GetHeader("X-Owner-ID")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	if kit.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é o dono deste kit"})
		return
	}

	// Verifica se pode ser listado
	canList, reasons := kit.CanBeListed()
	if !canList {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Kit não pode ser publicado",
			"reasons": reasons,
		})
		return
	}

	// Publica
	kit.IsPublic = true
	kit.MarketplaceStatus.IsListed = true
	kit.MarketplaceStatus.ListedAt = time.Now().UTC()
	kit.MarketplaceStatus.PriceUSD = kit.CalculateSuggestedPrice()
	kit.MarketplaceStatus.PriceBRL = kit.MarketplaceStatus.PriceUSD * 5.0 // Taxa de câmbio simplificada

	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	api.store.RecordEvent(id, "published", ownerID, nil)

	c.JSON(http.StatusOK, gin.H{
		"success":         true,
		"message":         "Kit publicado no marketplace!",
		"suggested_price": kit.MarketplaceStatus.PriceUSD,
	})
}

// UnpublishKit despublica kit
func (api *MarketplaceAPI) UnpublishKit(c *gin.Context) {
	id := c.Param("id")
	ownerID := c.GetHeader("X-Owner-ID")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	if kit.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Você não é o dono deste kit"})
		return
	}

	kit.IsPublic = false
	kit.MarketplaceStatus.IsListed = false
	kit.MarketplaceStatus.UnlistedAt = time.Now().UTC()

	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	api.store.RecordEvent(id, "unpublished", ownerID, nil)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// RecordView registra visualização
func (api *MarketplaceAPI) RecordView(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")

	api.store.RecordEvent(id, "view", userID, nil)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// RecordDownload registra download
func (api *MarketplaceAPI) RecordDownload(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")

	api.store.RecordEvent(id, "download", userID, nil)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - TRAINING DATA
// ═══════════════════════════════════════════════════════════════════════════════

// GetTrainingData exporta dados para treinamento
func (api *MarketplaceAPI) GetTrainingData(c *gin.Context) {
	minQuality, _ := strconv.Atoi(c.DefaultQuery("min_quality", "70"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "1000"))

	data, err := api.store.GetTrainingData(minQuality, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"format": "jsonl",
		"count":  len(data),
		"data":   data,
	})
}

// AddToTraining adiciona kit ao dataset de treinamento
func (api *MarketplaceAPI) AddToTraining(c *gin.Context) {
	id := c.Param("id")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	// Só adiciona se tiver qualidade mínima
	if kit.Classification.QualityScore < 60 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Qualidade insuficiente para treinamento",
			"score": kit.Classification.QualityScore,
		})
		return
	}

	if err := api.store.AddToTrainingDataset(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Kit adicionado ao dataset de treinamento",
	})
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - STATS
// ═══════════════════════════════════════════════════════════════════════════════

// GetStats retorna estatísticas gerais
func (api *MarketplaceAPI) GetStats(c *gin.Context) {
	stats, err := api.store.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetClassifierStats retorna estatísticas do classificador
func (api *MarketplaceAPI) GetClassifierStats(c *gin.Context) {
	stats := api.classifier.GetStats()
	c.JSON(http.StatusOK, stats)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - README GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

// GenerateReadme gera README para um kit
func (api *MarketplaceAPI) GenerateReadme(c *gin.Context) {
	id := c.Param("id")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	// Gera README
	readme := api.readmeGenerator.GenerateReadme(kit)
	
	// Atualiza o kit com o README gerado
	kit.README = readme
	kit.UpdatedAt = time.Now().UTC()
	
	if err := api.store.Save(kit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"readme":  readme,
		"kit_id":  id,
	})
}

// GetArchitectureDiagram retorna diagrama ASCII da arquitetura
func (api *MarketplaceAPI) GetArchitectureDiagram(c *gin.Context) {
	id := c.Param("id")

	kit, err := api.store.GetByID(id)
	if err != nil || kit == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kit não encontrado"})
		return
	}

	diagram := api.readmeGenerator.GenerateArchitectureDiagram(kit)
	
	c.JSON(http.StatusOK, gin.H{
		"diagram": diagram,
		"kit_id":  id,
	})
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS - SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

// SearchKits busca kits por texto
func (api *MarketplaceAPI) SearchKits(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	category := c.Query("category")
	minQuality, _ := strconv.Atoi(c.DefaultQuery("min_quality", "0"))

	kits, err := api.store.Search(query, limit, category, minQuality)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"query":   query,
		"count":   len(kits),
		"kits":    kits,
	})
}
