package docs

// ========================================
// IDENTITY ENDPOINTS
// ========================================

// swagger:route POST /auth/verify/start identity requestVerification
// Inicia verificação de email
//
// Envia um código de 6 dígitos para o email fornecido.
// O código expira em 10 minutos.
//
// Responses:
//   200: VerificationStartResponse
//   400: ErrorResponse
//   429: ErrorResponse

// swagger:route POST /auth/verify/complete identity completeVerification
// Completa verificação de email
//
// Valida o código enviado e retorna tokens JWT se válido.
// Cria usuário automaticamente se não existir.
//
// Responses:
//   200: LoginResponse
//   400: ErrorResponse
//   401: ErrorResponse

// swagger:route POST /auth/login identity login
// Login de usuário
//
// Autentica usuário existente e retorna tokens JWT.
// Requer que o usuário já tenha verificado o email.
//
// Security:
//   - AppKey: []
//   - AppSecret: []
//
// Responses:
//   200: LoginResponse
//   400: ErrorResponse
//   401: ErrorResponse

// swagger:route POST /auth/refresh identity refreshToken
// Renova access token
//
// Usa o refresh token para obter um novo access token.
//
// Responses:
//   200: LoginResponse
//   401: ErrorResponse

// swagger:route GET /identity/me identity getProfile
// Retorna perfil do usuário
//
// Retorna dados do usuário autenticado.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: UserProfile
//   401: ErrorResponse

// swagger:route GET /identity/applications identity getUserApps
// Lista aplicações do usuário
//
// Retorna todas as aplicações vinculadas ao usuário.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: ApplicationList
//   401: ErrorResponse

// swagger:route POST /identity/implicit-login identity implicitLogin
// Login implícito (sem senha)
//
// Cria ou recupera usuário baseado em device_id.
// Usado para apps que não requerem autenticação explícita.
//
// Security:
//   - AppKey: []
//   - AppSecret: []
//
// Responses:
//   200: LoginResponse
//   400: ErrorResponse

// ========================================
// BILLING ENDPOINTS
// ========================================

// swagger:route GET /billing/plans billing listPlans
// Lista planos disponíveis
//
// Retorna todos os planos de assinatura disponíveis.
//
// Responses:
//   200: PlanList

// swagger:route GET /billing/subscription billing getSubscription
// Retorna assinatura atual
//
// Retorna a assinatura ativa do usuário, se houver.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: Subscription
//   404: ErrorResponse

// swagger:route POST /billing/checkout billing createCheckout
// Cria sessão de checkout
//
// Cria uma sessão de checkout do Stripe para assinatura.
// Retorna URL para redirecionar o usuário.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: CheckoutResponse
//   400: ErrorResponse

// swagger:route POST /billing/portal billing createPortal
// Cria portal de billing
//
// Cria sessão do Stripe Customer Portal para gerenciar assinatura.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: PortalResponse
//   400: ErrorResponse

// swagger:route GET /billing/invoices billing listInvoices
// Lista faturas
//
// Retorna histórico de faturas do usuário.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: InvoiceList

// swagger:route POST /webhooks/stripe/:app_id billing stripeWebhook
// Webhook do Stripe
//
// Endpoint para receber eventos do Stripe.
// Requer assinatura válida no header Stripe-Signature.
//
// Responses:
//   200: SuccessResponse
//   400: ErrorResponse
//   401: ErrorResponse

// ========================================
// INVARIANTS ENDPOINTS
// ========================================

// swagger:route GET /invariants/violations invariants getViolations
// Lista violações de invariantes
//
// Retorna todas as violações de invariantes registradas.
// Invariantes são regras que NUNCA devem ser violadas.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: ViolationList

// swagger:route GET /invariants/stats invariants getInvariantStats
// Estatísticas de invariantes
//
// Retorna estatísticas agregadas das violações.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: InvariantStats

// swagger:route DELETE /invariants/violations invariants clearViolations
// Limpa violações
//
// Remove todas as violações do histórico.
// Requer permissão de admin.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   403: ErrorResponse

// ========================================
// IMMUNITY ENDPOINTS
// ========================================

// swagger:route GET /immunity/health immunity getImmunityHealth
// Saúde do sistema imunológico
//
// Retorna status de saúde do sistema de defesa.
// Inclui score, circuit breakers, quarentenas e alertas.
//
// Responses:
//   200: ImmunityHealth
//   503: ImmunityHealth

// swagger:route GET /immunity/stats immunity getImmunityStats
// Estatísticas do sistema imunológico
//
// Retorna estatísticas detalhadas de todas as defesas.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: ImmunityStats

// swagger:route GET /immunity/threats immunity getThreats
// Lista ameaças bloqueadas
//
// Retorna IPs e fontes atualmente bloqueadas.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: ThreatList

// swagger:route POST /immunity/threats/block immunity blockThreat
// Bloqueia IP manualmente
//
// Adiciona um IP à lista de bloqueio.
// Requer permissão de admin.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   400: ErrorResponse
//   403: ErrorResponse

// swagger:route POST /immunity/threats/unblock immunity unblockThreat
// Desbloqueia IP
//
// Remove um IP da lista de bloqueio.
// Requer permissão de admin.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   400: ErrorResponse
//   403: ErrorResponse

// swagger:route GET /immunity/circuits immunity getCircuits
// Lista circuit breakers
//
// Retorna estado de todos os circuit breakers.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: CircuitBreakerList

// swagger:route POST /immunity/circuits/:name/reset immunity resetCircuit
// Reseta circuit breaker
//
// Força reset de um circuit breaker específico.
// Requer permissão de admin.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   404: ErrorResponse

// swagger:route GET /immunity/quarantine immunity getQuarantines
// Lista quarentenas ativas
//
// Retorna entidades atualmente em quarentena.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: QuarantineList

// swagger:route POST /immunity/quarantine/release immunity releaseQuarantine
// Libera quarentena
//
// Remove uma entidade da quarentena.
// Requer permissão de admin e justificativa.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   400: ErrorResponse
//   404: ErrorResponse

// swagger:route GET /immunity/alerts immunity getAlerts
// Lista alertas ativos
//
// Retorna alertas de segurança ativos.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: AlertList

// swagger:route POST /immunity/alerts/:id/ack immunity ackAlert
// Reconhece alerta
//
// Marca um alerta como reconhecido.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   404: ErrorResponse

// swagger:route POST /immunity/alerts/:id/resolve immunity resolveAlert
// Resolve alerta
//
// Marca um alerta como resolvido com justificativa.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: SuccessResponse
//   400: ErrorResponse
//   404: ErrorResponse

// ========================================
// OBSERVABILITY ENDPOINTS
// ========================================

// swagger:route GET /health observability healthCheck
// Health check básico
//
// Retorna status de saúde da API.
//
// Responses:
//   200: HealthResponse

// swagger:route GET /ready observability readinessCheck
// Readiness check
//
// Verifica se a API está pronta para receber tráfego.
// Inclui verificação de banco de dados e serviços.
//
// Responses:
//   200: ReadyResponse
//   503: ReadyResponse

// swagger:route GET /metrics/basic observability basicMetrics
// Métricas básicas
//
// Retorna métricas básicas da API.
//
// Responses:
//   200: MetricsResponse

// swagger:route GET /warobs/dashboard observability warObsDashboard
// Dashboard de observabilidade
//
// Retorna métricas RED, pressão e SLO/SLI.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: WarObsDashboard

// swagger:route GET /alerts observability getAlerts
// Lista alertas do sistema
//
// Retorna alertas ativos do sistema de alerting.
//
// Security:
//   - Bearer: []
//
// Responses:
//   200: AlertList

// swagger:route GET /alerts/metrics/prometheus observability prometheusMetrics
// Métricas Prometheus
//
// Retorna métricas em formato Prometheus para scraping.
//
// Responses:
//   200: PrometheusMetrics
