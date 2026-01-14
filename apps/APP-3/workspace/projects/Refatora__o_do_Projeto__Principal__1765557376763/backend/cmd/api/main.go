
package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// --- Modelos de Dados ---

// User representa a estrutura do usuário no banco de dados.
type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // Oculta a senha na serialização JSON
}

// Task representa a estrutura da tarefa no banco de dados.
type Task struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Title       string `gorm:"not null" json:"title"`
	Description string `json:"description"`
	Completed   bool   `gorm:"default:false" json:"completed"`
	UserID      uint   `gorm:"not null" json:"user_id"`
	User        User   `gorm:"foreignKey:UserID"`
}

// --- Variáveis Globais ---

var db *gorm.DB
var jwtSecret string

// --- Inicialização e Setup ---

func main() {
	// Carregar variáveis de ambiente
	loadEnv()
	jwtSecret = os.Getenv("JWT_SECRET")

	// Conectar ao banco de dados e migrar o schema
	initDB()

	// Configurar o servidor Gin
	router := gin.Default()

	// Configuração do CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rotas da API
	apiGroup := router.Group("/api")
	{
		// Rotas de autenticação
		apiGroup.POST("/auth/register", registerHandler)
		apiGroup.POST("/auth/login", loginHandler)

		// Rotas de tarefas (protegidas por middleware JWT)
		taskGroup := apiGroup.Group("/tasks")
		taskGroup.Use(authMiddleware())
		{
			taskGroup.GET("/", getTasksHandler)
			taskGroup.POST("/", createTaskHandler)
			taskGroup.PUT("/:id", updateTaskHandler)
			taskGroup.DELETE("/:id", deleteTaskHandler)
		}
	}

	// Iniciar servidor
	router.Run(":8080")
}

// initDB conecta-se ao PostgreSQL e executa migrações automáticas.
func initDB() {
	var err error
	dsn := os.Getenv("DATABASE_URL")
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar ao banco de dados: ", err)
	}

	// Migração automática do schema
	err = db.AutoMigrate(&User{}, &Task{})
	if err != nil {
		log.Fatal("Falha na migração do schema: ", err)
	}
}

// loadEnv carrega variáveis de ambiente do .env, se necessário (para dev local).
func loadEnv() {
	// Nota: Em produção, o Docker injeta variáveis diretamente.
	// Se estiver executando localmente sem Docker, use 'source backend/.env'.
	// Para o Docker Compose, as variáveis são lidas diretamente.
	if os.Getenv("DATABASE_URL") == "" {
		log.Println("Aviso: Variável DATABASE_URL não definida, verifique se está no Docker Compose ou no .env")
	}
}

// --- Handlers de Autenticação ---

// registerRequest é o DTO para o registro de usuário.
type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// registerHandler cria um novo usuário.
func registerHandler(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de registro inválidos"})
		return
	}

	// Verificar se o usuário já existe
	var existingUser User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Usuário já registrado com este e-mail"})
		return
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar a senha"})
		return
	}

	// Criar usuário no banco de dados
	newUser := User{Email: req.Email, Password: string(hashedPassword)}
	if err := db.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar usuário"})
		return
	}

	// Gerar token de autenticação
	token, err := createJWT(newUser.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "user_id": newUser.ID})
}

// loginRequest é o DTO para o login de usuário.
type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// loginHandler autentica um usuário e retorna um JWT.
func loginHandler(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de login inválidos"})
		return
	}

	// Buscar usuário no banco de dados
	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Comparar senhas
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Gerar token de autenticação
	token, err := createJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user_id": user.ID})
}

// createJWT cria um JSON Web Token para o usuário especificado.
func createJWT(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expira em 72 horas
	})

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// --- Middleware de Autenticação JWT ---

// authMiddleware verifica a validade do JWT e define o ID do usuário no contexto.
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autenticação ausente"})
			c.Abort()
			return
		}

		tokenString := strings.Split(authHeader, " ")[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.NewValidationError("Método de assinatura inesperado", jwt.ValidationErrorSignatureInvalid)
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido ou expirado"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			c.Abort()
			return
		}

		c.Set("user_id", uint(claims["user_id"].(float64)))
		c.Next()
	}
}

// --- Handlers de Tarefas (CRUD) ---

// getTasksHandler lista todas as tarefas do usuário logado.
func getTasksHandler(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var tasks []Task
	if err := db.Where("user_id = ?", userID).Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar tarefas"})
		return
	}
	c.JSON(http.StatusOK, tasks)
}

// createTaskRequest é o DTO para a criação de tarefas.
type createTaskRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

// createTaskHandler cria uma nova tarefa para o usuário logado.
func createTaskHandler(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req createTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de tarefa inválidos: 'title' é obrigatório"})
		return
	}

	newTask := Task{
		Title:       req.Title,
		Description: req.Description,
		UserID:      userID,
		Completed:   false,
	}

	if err := db.Create(&newTask).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar tarefa"})
		return
	}

	c.JSON(http.StatusCreated, newTask)
}

// updateTaskRequest é o DTO para a atualização de tarefas.
type updateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   *bool  `json:"completed"` // Usar ponteiro para diferenciar nulo de false/true
}

// updateTaskHandler atualiza os detalhes de uma tarefa existente.
func updateTaskHandler(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	taskID := c.Param("id")

	var task Task
	if err := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarefa não encontrada"})
		return
	}

	var req updateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de atualização inválidos"})
		return
	}

	// Aplicar atualizações de forma seletiva
	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Completed != nil {
		task.Completed = *req.Completed
	}

	if err := db.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar tarefa"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// deleteTaskHandler exclui uma tarefa.
func deleteTaskHandler(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	taskID := c.Param("id")

	var task Task
	if err := db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarefa não encontrada"})
		return
	}

	if err := db.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao excluir tarefa"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
