# FASE 2: Instruções Detalhadas para Implementação do Backend (Go)

## 1. Configuração Inicial do Projeto Go

1.  **Criação do Módulo:** Inicialize o módulo Go e instale as dependências principais.
    ```bash
    go mod init medisync-platform/backend
    go get github.com/gin-gonic/gin@latest
    go get gorm.io/gorm@latest
    go get gorm.io/driver/postgres@latest
    go get github.com/go-redis/redis/v8@latest
    go get golang.org/x/crypto/bcrypt@latest # Para hash de senha
    go get github.com/dgrijalva/jwt-go@latest # Para JWT
    go get github.com/gorilla/websocket@latest # Para WebSockets
    ```
2.  **Configuração do Banco de Dados (PostgreSQL + GORM):**
    *   Crie o arquivo `backend/config/config.go` para carregar as variáveis de ambiente (DB URL, JWT Secret).
    *   Crie uma função de inicialização do GORM que se conecta ao PostgreSQL. Configure o GORM para realizar migrações automáticas baseadas nos modelos Go definidos no `internal/core/domain`.

## 2. Implementação da Arquitetura Hexagonal (Ports and Adapters)

*   **Camada de Domínio (`internal/core/domain`):** Crie as estruturas de dados (models) para `User`, `Role`, `Appointment`, e `MedicalRecord` conforme o `schema.prisma`. Adicione tags GORM para mapeamento de colunas.
*   **Camada de Portas (`internal/core/ports`):** Defina as interfaces (ports) para os repositórios (`UserRepository`, `AppointmentRepository`) e serviços de domínio (`UserService`, `AppointmentService`). Estas interfaces definem as operações de negócio sem especificar a implementação de infraestrutura.

    ```go
    // Exemplo de interface de repositório
    package ports

    import "medisync-platform/backend/internal/core/domain"

    type AppointmentRepository interface {
        FindAvailableSlots(doctorId int, date time.Time) ([]domain.AppointmentSlot, error)
        BookAppointment(appointment *domain.Appointment) error
        CancelAppointment(appointmentId int) error
    }
    ```

*   **Camada de Serviços (`internal/services`):** Implemente a lógica de negócios complexa.

## 3. Implementação da Autorização (RBAC Middleware)

1.  **Geração e Validação JWT:**
    *   Implemente a função de login (`POST /auth/login`) que gera um JWT contendo o `userId` e o `role` do usuário.
    *   Crie um middleware de validação JWT (`AuthMiddleware`) que verifica o token de todas as requisições autenticadas.
2.  **Middleware RBAC:** Crie uma função `CheckRole(requiredRole string)` que, a partir do middleware JWT, verifica se o `role` do usuário logado corresponde ao papel exigido para acessar a rota.

    ```go
    // Exemplo de middleware RBAC no Gin
    func CheckRole(requiredRole string) gin.HandlerFunc {
        return func(c *gin.Context) {
            userRole, exists := c.Get("role")
            if !exists || userRole.(string) != requiredRole {
                c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado."})
                c.Abort()
                return
            }
            c.Next()
        }
    }

    // Aplicação no router
    // router.POST("/admin/users", AuthMiddleware(), CheckRole("ADMIN"), userController.CreateUser)
    ```

## 4. Lógica de Negócios Críticas

### A. Agendamento Inteligente e Conflito de Horário

*   **Endpoint:** `POST /appointments/book`
*   **Regra de Negócio:** Implemente a lógica de transação atômica no GORM para prevenir agendamentos duplos.

    ```go
    // Pseudocódigo para o serviço de agendamento (dentro de appointment_service.go)
    func BookAppointment(ctx context.Context, appointment *domain.Appointment) error {
        tx := db.Begin() // Inicia a transação

        // 1. Verificar se o slot está disponível
        isAvailable, err := repo.CheckSlotAvailability(appointment.DoctorID, appointment.StartTime, appointment.EndTime, tx)
        if err != nil || !isAvailable {
            tx.Rollback()
            return errors.New("slot not available or conflict detected")
        }

        // 2. Criar o agendamento no banco
        err = repo.CreateAppointment(appointment, tx)
        if err != nil {
            tx.Rollback()
            return err
        }

        tx.Commit() // Confirma a transação
        return nil
    }
    ```

### B. Prontuário Eletrônico Seguro (Criptografia)

*   **Regra de Negócio:** Antes de salvar os dados do prontuário (`diagnosis`, `notes`) no `MedicalRecord` via GORM, utilize uma biblioteca de criptografia (e.g., `golang.org/x/crypto/bcrypt` para hash ou AES para criptografia reversível).
*   **Endpoint:** `POST /patients/{id}/records`
*   **Implementação:** Crie funções `EncryptData(data string) (string, error)` e `DecryptData(data string) (string, error)` no pacote `pkg/security` e chame-as antes de interagir com o repositório GORM.

## 5. Fila de Espera em Tempo Real (WebSockets)

1.  **WebSocket Endpoint:** Crie um endpoint WebSocket (`/ws/waiting-room`) no Gin.
2.  **Gerenciamento de Conexões:** Use um mapa (Go map) ou um pub/sub Redis para rastrear as conexões ativas dos médicos. Cada médico terá seu próprio canal de notificação.
3.  **Lógica de Notificação:**
    *   Quando um paciente entra na página de consulta, ele envia uma mensagem "enter_waiting_room" para o backend via WebSocket.
    *   O backend localiza o médico associado ao paciente e envia uma mensagem de notificação para o canal WebSocket desse médico: `{"type": "new_patient_waiting", "patient_id": 123}`.

## 6. Frontend (Instruções Breves para a Próxima Fase)

*   **Estrutura Next.js:** Crie as páginas de dashboard, agendamento e prontuário.
*   **Shadcn/UI:** Instale e configure o Shadcn/UI (utilizando `npx shadcn-ui@latest init` e `npx shadcn-ui@latest add [componente]`) para criar a interface.
*   **Conexão API:** Utilize `axios` ou `fetch` para interagir com os endpoints definidos no `openapi.yaml`. Implemente o gerenciamento de estado (JWT no local storage/cookies) para persistir a autenticação.
*   **Real-time Frontend:** Utilize a API nativa de WebSockets do navegador para se conectar ao `ws/waiting-room` e atualizar a UI quando uma notificação for recebida.
