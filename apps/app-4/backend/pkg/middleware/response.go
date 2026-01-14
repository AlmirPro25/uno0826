package middleware

import (
	"medisync-platform/backend/pkg/errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standardized API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

// ErrorInfo contains error details
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// MetaInfo contains pagination and other metadata
type MetaInfo struct {
	Page       int   `json:"page,omitempty"`
	PageSize   int   `json:"pageSize,omitempty"`
	TotalItems int64 `json:"totalItems,omitempty"`
	TotalPages int   `json:"totalPages,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMeta sends a successful response with metadata
func SuccessWithMeta(c *gin.Context, data interface{}, meta *MetaInfo) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

// NoContent sends a 204 No Content response
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Error sends an error response
func Error(c *gin.Context, err *errors.AppError) {
	c.JSON(err.HTTPStatus, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
	})
}

// ErrorWithStatus sends an error response with custom status
func ErrorWithStatus(c *gin.Context, status int, code, message string) {
	c.JSON(status, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeInvalidInput,
			Message: message,
		},
	})
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Autenticação necessária"
	}
	c.JSON(http.StatusUnauthorized, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeUnauthorized,
			Message: message,
		},
	})
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Acesso negado"
	}
	c.JSON(http.StatusForbidden, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeForbidden,
			Message: message,
		},
	})
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeNotFound,
			Message: resource + " não encontrado(a)",
		},
	})
}

// Conflict sends a 409 Conflict response
func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeConflict,
			Message: message,
		},
	})
}

// InternalError sends a 500 Internal Server Error response
func InternalError(c *gin.Context, err error) {
	details := ""
	if gin.Mode() != gin.ReleaseMode && err != nil {
		details = err.Error()
	}
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeInternal,
			Message: "Erro interno do servidor",
			Details: details,
		},
	})
}

// RateLimited sends a 429 Too Many Requests response
func RateLimited(c *gin.Context) {
	c.JSON(http.StatusTooManyRequests, APIResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    errors.ErrCodeRateLimited,
			Message: "Muitas requisições. Tente novamente em alguns minutos.",
		},
	})
}

// PaginatedResponse creates a paginated response
func PaginatedResponse(c *gin.Context, data interface{}, page, pageSize int, totalItems int64) {
	totalPages := int(totalItems) / pageSize
	if int(totalItems)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Meta: &MetaInfo{
			Page:       page,
			PageSize:   pageSize,
			TotalItems: totalItems,
			TotalPages: totalPages,
		},
	})
}
