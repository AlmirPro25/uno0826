package docs

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SwaggerJSON retorna a especificação OpenAPI em JSON
var SwaggerJSON = `{
  "openapi": "3.0.3",
  "info": {
    "title": "PROST-QS Kernel API",
    "description": "API do Kernel de Plataforma Soberano PROST-QS.\n\n## Visão Geral\n\nO PROST-QS é um kernel completo para construir aplicações SaaS com:\n- **Identity**: Autenticação, verificação, SSO multi-app\n- **Billing**: Stripe, planos, assinaturas\n- **Governance**: Políticas, aprovações, auditoria\n- **Immunity**: Auto-defesa, circuit breakers\n\n## Autenticação\n\nA API usa JWT Bearer tokens. Obtenha um token via:\n1. POST /auth/verify/start (envia código por email)\n2. POST /auth/verify/complete (valida código, retorna token)\n\n## Rate Limiting\n\n- 100 requests/minuto por IP\n- 1000 requests/minuto por usuário autenticado\n\n## Códigos de Erro\n\n| Código | Descrição |\n|--------|----------|\n| 400 | Bad Request - Parâmetros inválidos |\n| 401 | Unauthorized - Token inválido ou expirado |\n| 403 | Forbidden - Sem permissão |\n| 404 | Not Found - Recurso não encontrado |\n| 429 | Too Many Requests - Rate limit excedido |\n| 500 | Internal Error - Erro interno |",
    "version": "1.0.0",
    "contact": {
      "name": "PROST-QS Tech Team",
      "email": "tech@prostqs.com"
    }
  },
  "servers": [
    {
      "url": "https://api.prostqs.com/api/v1",
      "description": "Produção"
    },
    {
      "url": "http://localhost:8080/api/v1",
      "description": "Desenvolvimento"
    }
  ],
  "tags": [
    {"name": "Identity", "description": "Autenticação e gerenciamento de usuários"},
    {"name": "Billing", "description": "Planos, assinaturas e pagamentos"},
    {"name": "Invariants", "description": "Monitoramento de invariantes do sistema"},
    {"name": "Immunity", "description": "Sistema imunológico e defesas"},
    {"name": "Observability", "description": "Métricas, health checks e alertas"}
  ],
  "paths": {
    "/auth/verify/start": {
      "post": {
        "tags": ["Identity"],
        "summary": "Inicia verificação de email",
        "description": "Envia um código de 6 dígitos para o email fornecido. O código expira em 10 minutos.",
        "operationId": "requestVerification",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "app_id"],
                "properties": {
                  "email": {"type": "string", "format": "email", "example": "user@example.com"},
                  "app_id": {"type": "string", "format": "uuid", "example": "550e8400-e29b-41d4-a716-446655440000"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Código enviado com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "verification_id": {"type": "string", "format": "uuid"},
                    "expires_at": {"type": "string", "format": "date-time"},
                    "message": {"type": "string", "example": "Código enviado para user@example.com"}
                  }
                }
              }
            }
          },
          "400": {"$ref": "#/components/responses/BadRequest"},
          "429": {"$ref": "#/components/responses/TooManyRequests"}
        }
      }
    },
    "/auth/verify/complete": {
      "post": {
        "tags": ["Identity"],
        "summary": "Completa verificação de email",
        "description": "Valida o código enviado e retorna tokens JWT. Cria usuário automaticamente se não existir.",
        "operationId": "completeVerification",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["verification_id", "code"],
                "properties": {
                  "verification_id": {"type": "string", "format": "uuid"},
                  "code": {"type": "string", "pattern": "^[0-9]{6}$", "example": "123456"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {"$ref": "#/components/responses/LoginResponse"},
          "400": {"$ref": "#/components/responses/BadRequest"},
          "401": {"$ref": "#/components/responses/Unauthorized"}
        }
      }
    },
    "/identity/me": {
      "get": {
        "tags": ["Identity"],
        "summary": "Retorna perfil do usuário",
        "description": "Retorna dados do usuário autenticado.",
        "operationId": "getProfile",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Perfil do usuário",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/UserProfile"}
              }
            }
          },
          "401": {"$ref": "#/components/responses/Unauthorized"}
        }
      }
    },
    "/identity/implicit-login": {
      "post": {
        "tags": ["Identity"],
        "summary": "Login implícito (sem senha)",
        "description": "Cria ou recupera usuário baseado em device_id. Usado para apps que não requerem autenticação explícita.",
        "operationId": "implicitLogin",
        "security": [{"AppKey": [], "AppSecret": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["device_id"],
                "properties": {
                  "device_id": {"type": "string", "example": "device-abc-123"},
                  "metadata": {"type": "object", "additionalProperties": {"type": "string"}}
                }
              }
            }
          }
        },
        "responses": {
          "200": {"$ref": "#/components/responses/LoginResponse"},
          "400": {"$ref": "#/components/responses/BadRequest"}
        }
      }
    },
    "/billing/plans": {
      "get": {
        "tags": ["Billing"],
        "summary": "Lista planos disponíveis",
        "description": "Retorna todos os planos de assinatura disponíveis.",
        "operationId": "listPlans",
        "responses": {
          "200": {
            "description": "Lista de planos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "plans": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/Plan"}
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/billing/subscription": {
      "get": {
        "tags": ["Billing"],
        "summary": "Retorna assinatura atual",
        "description": "Retorna a assinatura ativa do usuário, se houver.",
        "operationId": "getSubscription",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Assinatura do usuário",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Subscription"}
              }
            }
          },
          "404": {"$ref": "#/components/responses/NotFound"}
        }
      }
    },
    "/billing/checkout": {
      "post": {
        "tags": ["Billing"],
        "summary": "Cria sessão de checkout",
        "description": "Cria uma sessão de checkout do Stripe para assinatura. Retorna URL para redirecionar o usuário.",
        "operationId": "createCheckout",
        "security": [{"Bearer": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["plan_id", "success_url", "cancel_url"],
                "properties": {
                  "plan_id": {"type": "string", "example": "pro"},
                  "success_url": {"type": "string", "format": "uri"},
                  "cancel_url": {"type": "string", "format": "uri"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Sessão de checkout criada",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "checkout_url": {"type": "string", "format": "uri"},
                    "session_id": {"type": "string"}
                  }
                }
              }
            }
          },
          "400": {"$ref": "#/components/responses/BadRequest"}
        }
      }
    },
    "/webhooks/stripe/{app_id}": {
      "post": {
        "tags": ["Billing"],
        "summary": "Webhook do Stripe",
        "description": "Endpoint para receber eventos do Stripe. Requer assinatura válida no header Stripe-Signature.",
        "operationId": "stripeWebhook",
        "parameters": [
          {
            "name": "app_id",
            "in": "path",
            "required": true,
            "schema": {"type": "string", "format": "uuid"}
          },
          {
            "name": "Stripe-Signature",
            "in": "header",
            "required": true,
            "schema": {"type": "string"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"type": "object"}
            }
          }
        },
        "responses": {
          "200": {"description": "Webhook processado"},
          "400": {"$ref": "#/components/responses/BadRequest"},
          "401": {"$ref": "#/components/responses/Unauthorized"}
        }
      }
    },
    "/invariants/violations": {
      "get": {
        "tags": ["Invariants"],
        "summary": "Lista violações de invariantes",
        "description": "Retorna todas as violações de invariantes registradas. Invariantes são regras que NUNCA devem ser violadas.",
        "operationId": "getViolations",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Lista de violações",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "violations": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/Violation"}
                    },
                    "count": {"type": "integer"}
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["Invariants"],
        "summary": "Limpa violações",
        "description": "Remove todas as violações do histórico. Requer permissão de admin.",
        "operationId": "clearViolations",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {"$ref": "#/components/responses/Success"},
          "403": {"$ref": "#/components/responses/Forbidden"}
        }
      }
    },
    "/invariants/stats": {
      "get": {
        "tags": ["Invariants"],
        "summary": "Estatísticas de invariantes",
        "description": "Retorna estatísticas agregadas das violações.",
        "operationId": "getInvariantStats",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Estatísticas",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/InvariantStats"}
              }
            }
          }
        }
      }
    },
    "/immunity/health": {
      "get": {
        "tags": ["Immunity"],
        "summary": "Saúde do sistema imunológico",
        "description": "Retorna status de saúde do sistema de defesa. Inclui score, circuit breakers, quarentenas e alertas.",
        "operationId": "getImmunityHealth",
        "responses": {
          "200": {
            "description": "Sistema saudável",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/ImmunityHealth"}
              }
            }
          },
          "503": {
            "description": "Sistema em estado crítico",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/ImmunityHealth"}
              }
            }
          }
        }
      }
    },
    "/immunity/threats": {
      "get": {
        "tags": ["Immunity"],
        "summary": "Lista ameaças bloqueadas",
        "description": "Retorna IPs e fontes atualmente bloqueadas.",
        "operationId": "getThreats",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Lista de ameaças",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "blocked_sources": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/Threat"}
                    },
                    "total_blocked": {"type": "integer"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/immunity/threats/block": {
      "post": {
        "tags": ["Immunity"],
        "summary": "Bloqueia IP manualmente",
        "description": "Adiciona um IP à lista de bloqueio. Requer permissão de admin.",
        "operationId": "blockThreat",
        "security": [{"Bearer": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["ip", "duration", "reason"],
                "properties": {
                  "ip": {"type": "string", "example": "192.168.1.100"},
                  "duration": {"type": "string", "example": "24h"},
                  "reason": {"type": "string", "example": "Atividade suspeita"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {"$ref": "#/components/responses/Success"},
          "400": {"$ref": "#/components/responses/BadRequest"},
          "403": {"$ref": "#/components/responses/Forbidden"}
        }
      }
    },
    "/immunity/circuits": {
      "get": {
        "tags": ["Immunity"],
        "summary": "Lista circuit breakers",
        "description": "Retorna estado de todos os circuit breakers.",
        "operationId": "getCircuits",
        "security": [{"Bearer": []}],
        "responses": {
          "200": {
            "description": "Lista de circuit breakers",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "circuits": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/CircuitBreaker"}
                    },
                    "total": {"type": "integer"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/health": {
      "get": {
        "tags": ["Observability"],
        "summary": "Health check básico",
        "description": "Retorna status de saúde da API.",
        "operationId": "healthCheck",
        "responses": {
          "200": {
            "description": "API saudável",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {"type": "string", "example": "ok"},
                    "service": {"type": "string", "example": "prost-qs"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/alerts/metrics/prometheus": {
      "get": {
        "tags": ["Observability"],
        "summary": "Métricas Prometheus",
        "description": "Retorna métricas em formato Prometheus para scraping.",
        "operationId": "prometheusMetrics",
        "responses": {
          "200": {
            "description": "Métricas em formato Prometheus",
            "content": {
              "text/plain": {
                "schema": {"type": "string"}
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "Bearer": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT token obtido via /auth/verify/complete"
      },
      "AppKey": {
        "type": "apiKey",
        "in": "header",
        "name": "X-App-Key",
        "description": "Chave da aplicação"
      },
      "AppSecret": {
        "type": "apiKey",
        "in": "header",
        "name": "X-App-Secret",
        "description": "Secret da aplicação"
      }
    },
    "schemas": {
      "UserProfile": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "email": {"type": "string", "format": "email"},
          "name": {"type": "string"},
          "phone": {"type": "string"},
          "role": {"type": "string", "enum": ["user", "admin", "superadmin"]},
          "created_at": {"type": "string", "format": "date-time"}
        }
      },
      "Plan": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"},
          "price": {"type": "integer", "description": "Preço em centavos"},
          "currency": {"type": "string"},
          "interval": {"type": "string", "enum": ["month", "year"]},
          "features": {"type": "array", "items": {"type": "string"}}
        }
      },
      "Subscription": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "plan_id": {"type": "string"},
          "status": {"type": "string", "enum": ["active", "canceled", "past_due", "trialing"]},
          "current_period_end": {"type": "string", "format": "date-time"}
        }
      },
      "Violation": {
        "type": "object",
        "properties": {
          "invariant": {"type": "string"},
          "severity": {"type": "string", "enum": ["WARNING", "CRITICAL", "FATAL"]},
          "message": {"type": "string"},
          "context": {"type": "object"},
          "timestamp": {"type": "string", "format": "date-time"}
        }
      },
      "InvariantStats": {
        "type": "object",
        "properties": {
          "total": {"type": "integer"},
          "by_severity": {"type": "object", "additionalProperties": {"type": "integer"}},
          "by_invariant": {"type": "object", "additionalProperties": {"type": "integer"}},
          "enabled": {"type": "boolean"}
        }
      },
      "ImmunityHealth": {
        "type": "object",
        "properties": {
          "status": {"type": "string", "enum": ["healthy", "degraded", "critical"]},
          "score": {"type": "integer", "minimum": 0, "maximum": 100},
          "open_circuits": {"type": "integer"},
          "active_quarantines": {"type": "integer"},
          "active_alerts": {"type": "integer"},
          "total_threats": {"type": "integer"}
        }
      },
      "Threat": {
        "type": "object",
        "properties": {
          "source": {"type": "string"},
          "type": {"type": "string"},
          "expires_at": {"type": "string", "format": "date-time"},
          "reason": {"type": "string"}
        }
      },
      "CircuitBreaker": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "state": {"type": "string", "enum": ["closed", "open", "half-open"]},
          "failures": {"type": "integer"},
          "last_failure": {"type": "string", "format": "date-time"}
        }
      }
    },
    "responses": {
      "Success": {
        "description": "Operação bem sucedida",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": {"type": "string"}
              }
            }
          }
        }
      },
      "LoginResponse": {
        "description": "Login bem sucedido",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "access_token": {"type": "string"},
                "refresh_token": {"type": "string"},
                "expires_in": {"type": "integer"},
                "token_type": {"type": "string", "example": "Bearer"},
                "user": {"$ref": "#/components/schemas/UserProfile"}
              }
            }
          }
        }
      },
      "BadRequest": {
        "description": "Requisição inválida",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {"type": "string"}
              }
            }
          }
        }
      },
      "Unauthorized": {
        "description": "Não autorizado",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {"type": "string", "example": "Token inválido ou expirado"}
              }
            }
          }
        }
      },
      "Forbidden": {
        "description": "Acesso negado",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {"type": "string", "example": "Sem permissão para esta operação"}
              }
            }
          }
        }
      },
      "NotFound": {
        "description": "Recurso não encontrado",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {"type": "string", "example": "Recurso não encontrado"}
              }
            }
          }
        }
      },
      "TooManyRequests": {
        "description": "Rate limit excedido",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {"type": "string", "example": "Rate limit excedido"},
                "retry_after": {"type": "integer"}
              }
            }
          }
        }
      }
    }
  }
}`

// RegisterSwaggerRoutes registra as rotas do Swagger UI
func RegisterSwaggerRoutes(r *gin.Engine) {
	// Swagger JSON
	r.GET("/swagger/doc.json", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.String(http.StatusOK, SwaggerJSON)
	})

	// Swagger UI HTML
	r.GET("/swagger/index.html", func(c *gin.Context) {
		c.Header("Content-Type", "text/html")
		c.String(http.StatusOK, swaggerUIHTML)
	})

	// Redirect /swagger to /swagger/index.html
	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	r.GET("/swagger/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
}

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PROST-QS Kernel API</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #1a1a2e; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: "/swagger/doc.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                persistAuthorization: true
            });
        };
    </script>
</body>
</html>`
