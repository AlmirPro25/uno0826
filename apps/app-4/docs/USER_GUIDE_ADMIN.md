# 🔧 Guia do Administrador - MediSync

Guia completo para administradores do sistema MediSync.

---

## 🚀 Visão Geral

Como administrador, você tem acesso a:
- Gerenciamento de usuários
- Estatísticas do sistema
- Logs de auditoria
- Backups
- Configurações gerais

---

## 👥 Gerenciamento de Usuários

### Listar Usuários

1. Vá em **"Admin"** > **"Usuários"**
2. Veja todos os usuários cadastrados
3. Use filtros:
   - Por tipo (Paciente, Médico, Admin)
   - Por status (Ativo, Inativo)
   - Por data de cadastro

### Criar Novo Usuário

1. Clique em **"Novo Usuário"**
2. Preencha os dados:
   - Nome completo
   - Email
   - Senha temporária
   - Tipo de usuário
   - CPF
   - Telefone
3. Para médicos, adicione:
   - Especialidade
   - CRM
4. Clique em **"Criar"**

### Editar Usuário

1. Encontre o usuário na lista
2. Clique em **"Editar"**
3. Modifique os dados necessários
4. Clique em **"Salvar"**

### Desativar/Ativar Usuário

1. Encontre o usuário
2. Clique em **"Desativar"** ou **"Ativar"**
3. Confirme a ação

### Excluir Usuário

1. Encontre o usuário
2. Clique em **"Excluir"**
3. Confirme a exclusão

> ⚠️ A exclusão é permanente. Considere desativar em vez de excluir.

---

## 📊 Dashboard Administrativo

### Métricas Principais

- **Total de Usuários**: Pacientes, médicos, admins
- **Consultas Hoje**: Agendadas, em andamento, concluídas
- **Receita do Mês**: Total de pagamentos
- **Taxa de Cancelamento**: Percentual de cancelamentos

### Gráficos

- Consultas por dia/semana/mês
- Distribuição por especialidade
- Crescimento de usuários
- Receita ao longo do tempo

---

## 📈 Estatísticas Detalhadas

### Relatório de Consultas

1. Vá em **"Admin"** > **"Estatísticas"**
2. Selecione o período
3. Veja:
   - Total de consultas
   - Por status
   - Por médico
   - Por especialidade

### Relatório Financeiro

- Receita total
- Receita por médico
- Reembolsos
- Pagamentos pendentes

### Exportar Relatórios

1. Selecione o relatório
2. Clique em **"Exportar"**
3. Escolha o formato (CSV, PDF)

---

## 🔍 Logs de Auditoria

### Visualizar Logs

1. Vá em **"Admin"** > **"Auditoria"**
2. Veja todas as ações do sistema
3. Informações registradas:
   - Data/hora
   - Usuário
   - Ação realizada
   - Recurso afetado
   - IP de origem

### Filtrar Logs

- Por data
- Por usuário
- Por tipo de ação
- Por recurso

### Ações Registradas

- Login/Logout
- Criação de usuários
- Edição de prontuários
- Emissão de receitas
- Cancelamento de consultas
- Alterações de configuração

---

## 💾 Backups

### Criar Backup Manual

1. Vá em **"Admin"** > **"Backups"**
2. Clique em **"Criar Backup"**
3. Aguarde a conclusão
4. O backup aparecerá na lista

### Listar Backups

- Nome do arquivo
- Data de criação
- Tamanho
- Status

### Baixar Backup

1. Encontre o backup na lista
2. Clique em **"Baixar"**
3. O arquivo será salvo no seu computador

### Restaurar Backup

1. Encontre o backup
2. Clique em **"Restaurar"**
3. Confirme a ação

> ⚠️ A restauração substitui todos os dados atuais!

### Excluir Backup

1. Encontre o backup
2. Clique em **"Excluir"**
3. Confirme

### Backup Automático

Backups são criados automaticamente:
- Diariamente às 3h da manhã
- Retidos por 30 dias

---

## ⚙️ Configurações do Sistema

### Configurações Gerais

- Nome do sistema
- Logo
- Cores do tema
- Timezone

### Configurações de Email

- Servidor SMTP
- Remetente padrão
- Templates de email

### Configurações de Pagamento

- Gateway (Stripe)
- Valor padrão da consulta
- Política de reembolso

### Configurações de Segurança

- Tempo de sessão
- Tentativas de login
- Requisitos de senha
- 2FA obrigatório

---

## 🔒 Segurança

### Monitoramento

- Tentativas de login falhas
- Acessos suspeitos
- Alterações críticas

### Ações de Segurança

1. **Forçar Logout Global**: Desconecta todos os usuários
2. **Resetar Senha**: Força usuário a criar nova senha
3. **Bloquear IP**: Bloqueia acesso de IP específico

### Boas Práticas

- ✅ Revise logs regularmente
- ✅ Mantenha backups atualizados
- ✅ Monitore acessos suspeitos
- ✅ Atualize senhas periodicamente
- ✅ Limite acessos administrativos

---

## 🏥 Gerenciamento de Médicos

### Aprovar Novos Médicos

1. Vá em **"Admin"** > **"Médicos Pendentes"**
2. Revise as informações
3. Verifique CRM
4. Aprove ou rejeite

### Verificar CRM

1. Acesse o site do CFM
2. Consulte o número do CRM
3. Confirme os dados

### Definir Especialidades

1. Vá em **"Configurações"** > **"Especialidades"**
2. Adicione ou remova especialidades
3. Defina valores padrão

---

## 📧 Comunicação

### Enviar Notificação

1. Vá em **"Admin"** > **"Notificações"**
2. Selecione destinatários:
   - Todos os usuários
   - Apenas pacientes
   - Apenas médicos
   - Usuários específicos
3. Escreva a mensagem
4. Clique em **"Enviar"**

### Templates de Email

1. Vá em **"Configurações"** > **"Templates"**
2. Edite os templates:
   - Confirmação de consulta
   - Cancelamento
   - Lembrete
   - Boas-vindas

---

## 🔧 Manutenção

### Health Check

1. Vá em **"Admin"** > **"Sistema"**
2. Veja o status:
   - API: Online/Offline
   - Banco de dados: Conectado
   - Email: Funcionando
   - Pagamentos: Ativo

### Limpar Cache

1. Vá em **"Admin"** > **"Manutenção"**
2. Clique em **"Limpar Cache"**
3. Confirme

### Logs do Sistema

- Erros de aplicação
- Requisições lentas
- Falhas de integração

---

## 📞 Suporte Técnico

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| Usuário não consegue logar | Verificar status da conta, resetar senha |
| Email não chega | Verificar configuração SMTP, spam |
| Pagamento falhou | Verificar gateway, logs de erro |
| Sistema lento | Verificar recursos, limpar cache |

### Escalar Problema

1. Verifique os logs
2. Tente soluções básicas
3. Documente o problema
4. Contate suporte técnico

---

## 📋 Checklist Diário

- [ ] Verificar health check
- [ ] Revisar logs de erro
- [ ] Verificar backup do dia anterior
- [ ] Monitorar métricas de uso
- [ ] Responder tickets de suporte

## 📋 Checklist Semanal

- [ ] Revisar logs de auditoria
- [ ] Analisar estatísticas
- [ ] Verificar espaço em disco
- [ ] Atualizar documentação
- [ ] Reunião de status

## 📋 Checklist Mensal

- [ ] Relatório de métricas
- [ ] Revisão de segurança
- [ ] Teste de restauração de backup
- [ ] Atualização de sistema
- [ ] Revisão de acessos

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + K` | Busca global |
| `Ctrl + H` | Dashboard |
| `Ctrl + U` | Lista de usuários |
| `Ctrl + L` | Logs de auditoria |
| `?` | Ver todos os atalhos |

---

**MediSync - Administração eficiente! 🏥**
