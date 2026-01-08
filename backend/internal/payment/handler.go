package payment

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"prost-qs/backend/pkg/middleware"
)

// RegisterPaymentRoutes configura as rotas relacionadas a pagamentos.
func RegisterPaymentRoutes(rg *gin.RouterGroup, service *PaymentService, authMiddleware gin.HandlerFunc) {
	paymentRoutes := rg.Group("/payments")
	paymentRoutes.Use(authMiddleware) // Todas as rotas de pagamento requerem autenticação
	{
		paymentRoutes.POST("/initiate", initiatePayment(service))
		paymentRoutes.GET("/:paymentId/status", getPaymentStatus(service))
		paymentRoutes.GET("/balance/:userId", getUserBalance(service))
	}
}

// initiatePayment godoc
// @Summary Iniciar um novo evento de pagamento
// @Description Inicia um novo pagamento, registrando-o como um evento financeiro no kernel.
// @Tags Pagamentos
// @Accept json
// @Produce json
// @Param payment body InitiatePaymentRequest true "Detalhes do Pagamento"
// @Success 200 {object} InitiatePaymentResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /payments/initiate [post]
func initiatePayment(service *PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req InitiatePaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida: " + err.Error()})
			return
		}

		// Obter UserID do contexto JWT (quem está iniciando o pagamento)
		initiatorUserIDStr, exists := c.Get(middleware.ContextUserIDKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
			return
		}
		// A req.UserID é o recebedor/pagador real, enquanto initiatorUserID é quem aciona a API
		// Para simplicidade, assumimos que o iniciador é o pagador aqui.
		// Em um sistema real, haveria validação de permissões se req.UserID != initiatorUserID.
		req.UserID = initiatorUserIDStr.(string)

		paymentEvent, err := service.InitiatePayment(req.UserID, req.Amount, req.Currency, req.Description)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao iniciar pagamento: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, InitiatePaymentResponse{
			PaymentID: paymentEvent.PaymentID.String(),
			Status:    paymentEvent.Status,
			Message:   "Pagamento iniciado com sucesso.",
		})
	}
}

// getPaymentStatus godoc
// @Summary Consultar o status de um pagamento
// @Description Retorna o status e detalhes de um pagamento específico pelo seu ID.
// @Tags Pagamentos
// @Produce json
// @Param paymentId path string true "ID do Pagamento"
// @Success 200 {object} PaymentStatusResponse
// @Failure 404 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /payments/{paymentId}/status [get]
func getPaymentStatus(service *PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		paymentIDStr := c.Param("paymentId")
		paymentID, err := uuid.Parse(paymentIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do pagamento inválido"})
			return
		}

		payment, err := service.GetPaymentByID(paymentID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pagamento não encontrado"})
			return
		}

		c.JSON(http.StatusOK, PaymentStatusResponse{
			PaymentID: payment.ID.String(),
			Status:    payment.Status,
			Amount:    payment.Amount,
			Currency:  payment.Currency,
			Timestamp: payment.CreatedAt, // Usando CreatedAt como o timestamp principal
		})
	}
}

// getUserBalance godoc
// @Summary Obter o saldo derivado do ledger para um usuário
// @Description Calcula e retorna o saldo total de um usuário a partir do ledger de eventos de pagamento.
// @Tags Pagamentos
// @Produce json
// @Param userId path string true "ID do Usuário"
// @Success 200 {object} UserBalanceResponse
// @Failure 400 {object} gin.H{"error": string}
// @Failure 500 {object} gin.H{"error": string}
// @Security BearerAuth
// @Router /payments/balance/{userId} [get]
func getUserBalance(service *PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do usuário inválido"})
			return
		}

		balance, lastUpdated, err := service.CalculateUserBalance(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao calcular saldo do usuário: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, UserBalanceResponse{
			UserID:      userID.String(),
			Balance:     balance,
			Currency:    "BRL", // Assumindo uma moeda padrão ou agregando várias
			LastUpdated: lastUpdated,
		})
	}
}
