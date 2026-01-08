package ad

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterAdRoutes configura as rotas para o AdService.
func RegisterAdRoutes(rg *gin.RouterGroup, service *AdService, authMiddleware gin.HandlerFunc) {
	adRoutes := rg.Group("/ads")
	adRoutes.Use(authMiddleware)
	{
		adRoutes.POST("/", createAd(service))
		adRoutes.GET("/", listAds(service))
		adRoutes.GET("/:id", getAd(service))
		adRoutes.DELETE("/:id", deleteAd(service))
		adRoutes.GET("/stats", getAdStats(service))
	}
}

type CreateAdRequest struct {
	Title          string  `json:"title" binding:"required"`
	Content        string  `json:"content" binding:"required"`
	TargetURL      string  `json:"targetUrl" binding:"required"`
	ImpressionCost float64 `json:"impressionCost" binding:"required"`
	AppID          string  `json:"appId" binding:"required"`
}

func createAd(service *AdService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateAdRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ad, err := service.RegisterAd(req.Title, req.Content, req.TargetURL, req.ImpressionCost, req.AppID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Como anúncios são referências, vamos persistir diretamente por conveniência neste MVP
		// Em um sistema purista, isso passaria pelo CommandService
		if err := service.db.Create(ad).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao persistir anúncio: " + err.Error()})
			return
		}

		c.JSON(http.StatusCreated, ad)
	}
}

func listAds(service *AdService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var ads []Ad
		if err := service.db.Find(&ads).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, ads)
	}
}

func getAd(service *AdService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var ad Ad
		if err := service.db.Where("id = ?", id).First(&ad).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anúncio não encontrado"})
			return
		}
		c.JSON(http.StatusOK, ad)
	}
}

func deleteAd(service *AdService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := service.db.Delete(&Ad{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Anúncio removido"})
	}
}

func getAdStats(service *AdService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Mock stats para o frontend
		c.JSON(http.StatusOK, gin.H{
			"totalImpressions": 1240,
			"totalRevenue":     154.50,
			"averageROI":       "12.4%",
			"activeCampaigns":  3,
		})
	}
}
