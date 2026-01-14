# 📋 Sistema de Fila Digital - MediSync

## Visão Geral

O Sistema de Fila Digital do MediSync é uma solução completa para gerenciamento de filas de atendimento em clínicas, hospitais e unidades de saúde. Funciona 100% na nuvem, eliminando a necessidade de servidores locais.

---

## 🎯 Problemas que Resolve

| Problema Tradicional | Solução MediSync |
|---------------------|------------------|
| Paciente não sabe sua posição na fila | Acompanhamento em tempo real no celular |
| Perde a vez quando vai ao banheiro | Notificação push + síntese de voz |
| Recepcionista grita nomes | TV com painel digital + áudio automático |
| Sem previsão de tempo de espera | Estimativa baseada em dados históricos |
| Filas desorganizadas | Priorização automática (Protocolo Manchester) |
| Sem dados para gestão | Dashboard com estatísticas e relatórios |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NUVEM (MediSync)                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Backend   │◄──►│  WebSocket  │◄──►│   Banco de  │    │   Triagem   │  │
│  │   (API)     │    │    Hub      │    │    Dados    │    │   (AI)      │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
           │                  │                                    │
           │                  │ Tempo Real                         │
           ▼                  ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLÍNICA (apenas navegador)                        │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  📺 TV      │    │  📱 Tablet  │    │  💻 Painel  │    │  📱 Celular │  │
│  │  Display    │    │  Recepção   │    │  Médico     │    │  Paciente   │  │
│  │  /display   │    │  /join      │    │  /panel     │    │  /track     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Fluxo do Paciente

### 1. Chegada na Clínica

O paciente chega e retira uma senha através de:
- **Tablet/Totem na recepção** - Autoatendimento
- **Recepcionista** - Atendimento assistido
- **Após triagem** - Senha gerada automaticamente com prioridade

**URL:** `/queue/join`

### 2. Senha Gerada

O paciente recebe:
- **Número da senha** (ex: E-042, U-015, N-008)
- **Classificação de risco** (cor Manchester)
- **QR Code** para acompanhar no celular
- **Opção de imprimir**

**Prefixos das senhas:**
| Prefixo | Prioridade | Cor |
|---------|------------|-----|
| E | Emergência | 🔴 Vermelho |
| MU | Muito Urgente | 🟠 Laranja |
| U | Urgente | 🟡 Amarelo |
| PU | Pouco Urgente | 🟢 Verde |
| N | Não Urgente | 🔵 Azul |

### 3. Sala de Espera

O paciente aguarda observando:
- **TV com painel de chamadas** - Atualiza em tempo real
- **Celular** - Acompanha posição e recebe notificação

### 4. Chamada

Quando chega a vez:
- TV exibe animação destacada
- Áudio anuncia a senha (síntese de voz)
- Celular recebe notificação push
- Indica o local de atendimento (Consultório X)

---

## 👨‍⚕️ Fluxo do Médico/Atendente

### Painel de Controle (`/queue/panel`)

```
┌────────────────────────────────────────────────────────────┐
│  PAINEL DE ATENDIMENTO                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Consultório: [ Consultório 3    ▼ ]                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         🔔 CHAMAR PRÓXIMO PACIENTE                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Atendendo agora: E-041 - Maria Silva                      │
│  [ ✓ Iniciar Atendimento ]  [ ✗ Não Compareceu ]          │
│  [ ✓ Finalizar Atendimento ]                               │
│                                                            │
│  ─────────────────────────────────────────────────────────│
│  FILA DE ESPERA (12 pacientes)                             │
│  ─────────────────────────────────────────────────────────│
│  #1  E-042  Emergência      João Santos      [Chamar]      │
│  #2  MU-015 Muito Urgente   Ana Costa        [Chamar]      │
│  #3  U-008  Urgente         Pedro Lima       [Chamar]      │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

### Ações Disponíveis

| Ação | Descrição |
|------|-----------|
| **Chamar Próximo** | Chama automaticamente por prioridade |
| **Chamar Específico** | Chama um paciente específico da lista |
| **Iniciar Atendimento** | Marca que o paciente chegou |
| **Finalizar** | Conclui o atendimento |
| **Não Compareceu** | Marca ausência e libera a senha |

---

## 📺 Painel de Display (TV)

**URL:** `/queue/display`

### Características

- **Tela cheia** - Otimizado para TVs grandes
- **Atualização automática** - Via WebSocket (tempo real)
- **Síntese de voz** - Anuncia senhas automaticamente
- **Animação de chamada** - Destaque visual quando chama
- **Sem necessidade de login** - Acesso público

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏥 MediSync                                              14:32:45      │
│  Sistema de Atendimento                      Segunda, 16 de Dezembro   │
├─────────────────────────────────────────────────────────────────────────┤
│                                              │                          │
│  EM ATENDIMENTO                              │  📊 FILA DE ESPERA       │
│  ┌─────────────────────────────────────┐     │  ┌────────────────────┐  │
│  │                                     │     │  │ 15 aguardando      │  │
│  │   E-041        Consultório 1        │     │  │ ~12 min média      │  │
│  │   Clínica Geral                     │     │  └────────────────────┘  │
│  │                                     │     │                          │
│  │   N-015        Consultório 2        │     │  PRÓXIMOS                │
│  │   Pediatria                         │     │  ─────────────────────   │
│  │                                     │     │  #1  E-042  Emergência   │
│  └─────────────────────────────────────┘     │  #2  MU-015 Muito Urg.   │
│                                              │  #3  U-008  Urgente      │
│                                              │  #4  PU-023 Pouco Urg.   │
│                                              │  #5  N-016  Não Urgente  │
├──────────────────────────────────────────────┴──────────────────────────┤
│  🔴 Emergência  🟠 Muito Urgente  🟡 Urgente  🟢 Pouco Urgente  🔵 Normal │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Acompanhamento pelo Celular

**URL:** `/queue/track?ticket=E-042`

### Funcionalidades

- **Posição na fila** - Atualiza em tempo real
- **Tempo estimado** - Baseado em dados históricos
- **Notificação** - Alerta quando for chamado
- **Status da conexão** - Indica se está online
- **Visualização da fila** - Vê quem está na frente

### Tela do Paciente

```
┌─────────────────────────────┐
│  ← Voltar          🟢 Ao vivo│
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │    🔴 EMERGÊNCIA      │  │
│  │                       │  │
│  │       E-042           │  │
│  │                       │  │
│  │    ⏳ Aguardando      │  │
│  └───────────────────────┘  │
│                             │
│      Posição na fila        │
│           3º                │
│     Você é o próximo!       │
│                             │
│  ┌───────────┬───────────┐  │
│  │ ⏱️ ~8 min │ 👥 15     │  │
│  │ estimado  │ na fila   │  │
│  └───────────┴───────────┘  │
│                             │
│  Próximos na fila:          │
│  #1 E-040 ← Sendo atendido  │
│  #2 E-041                   │
│  #3 E-042 ← Você            │
│  #4 MU-015                  │
│                             │
└─────────────────────────────┘
```

---

## 🔧 Configuração na Clínica

### Equipamentos Necessários

| Equipamento | Uso | Requisito |
|-------------|-----|-----------|
| **TV Smart** | Painel de chamadas | Navegador web |
| **Tablet** | Retirada de senhas | Navegador web |
| **Computador** | Painel do médico | Navegador web |
| **Internet** | Conexão com nuvem | Estável |

### Passo a Passo

#### 1. Configurar TV (Painel de Display)

```
1. Conecte a TV à internet (Wi-Fi ou cabo)
2. Abra o navegador da TV
3. Acesse: https://seudominio.com/queue/display
4. Pressione F11 para tela cheia
5. Pronto! A tela atualiza automaticamente
```

**Dica:** Use um Fire Stick ou Chromecast se a TV não for Smart.

#### 2. Configurar Tablet (Retirada de Senhas)

```
1. Instale um navegador (Chrome recomendado)
2. Acesse: https://seudominio.com/queue/join
3. Adicione à tela inicial como "app"
4. Ative modo quiosque (opcional)
5. Deixe disponível para pacientes
```

#### 3. Configurar Painel do Médico

```
1. Acesse: https://seudominio.com/queue/panel
2. Faça login com credenciais de médico
3. Selecione seu consultório
4. Comece a chamar pacientes
```

---

## 📊 Relatórios e Estatísticas

**URL:** `/queue/history`

### Métricas Disponíveis

- **Total de atendimentos** - Por dia/semana/mês
- **Tempo médio de espera** - Por prioridade
- **Taxa de não comparecimento** - No-shows
- **Pico de demanda** - Horários mais movimentados
- **Performance por consultório** - Comparativo

### Exportação

- **CSV** - Para análise em Excel
- **PDF** - Para relatórios gerenciais

---

## 🔗 Integração com Triagem

O sistema de fila integra automaticamente com a triagem (MediCore AI):

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    TRIAGEM      │────►│  CLASSIFICAÇÃO  │────►│     FILA        │
│   (MediCore)    │     │   (Manchester)  │     │  (Automática)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               Paciente já entra
                                               com prioridade correta
```

### Fluxo Integrado

1. Paciente faz triagem no MediCore
2. IA classifica a prioridade (Manchester)
3. Sistema gera senha automaticamente
4. Paciente vai para fila com prioridade correta
5. Médico recebe dados da triagem ao atender

---

## 🔒 Segurança e Privacidade

- **Dados na nuvem** - Criptografados em trânsito e repouso
- **Sem dados sensíveis no display** - TV mostra apenas número da senha
- **Acesso por perfil** - Médico, recepcionista, admin
- **Logs de auditoria** - Todas ações são registradas

---

## ❓ FAQ

### O sistema funciona offline?
Não. Requer conexão com internet para funcionar. Se a internet cair, a TV mostrará "Reconectando..." e voltará automaticamente quando a conexão retornar.

### Preciso instalar algo?
Não. Tudo funciona no navegador web. Não precisa instalar nenhum software.

### Funciona em qualquer TV?
Sim, desde que tenha navegador web. TVs mais antigas podem usar Fire Stick, Chromecast ou um mini PC.

### Como o paciente sabe que foi chamado?
De 3 formas: (1) TV na sala de espera, (2) Áudio com síntese de voz, (3) Notificação no celular.

### Posso usar em várias clínicas?
Sim! O sistema é multi-tenant. Cada clínica tem sua própria fila isolada.

### E se o paciente não tiver celular?
Sem problema. O sistema principal é a TV na sala de espera. O celular é opcional.

---

## 📞 Suporte

- **Documentação:** `/docs`
- **Email:** suporte@medisync.com
- **Chat:** Disponível no sistema

---

## 🚀 URLs do Sistema

| Página | URL | Descrição |
|--------|-----|-----------|
| Retirar Senha | `/queue/join` | Paciente retira senha |
| Acompanhar | `/queue/track?ticket=XXX` | Paciente acompanha |
| Display TV | `/queue/display` | Painel para TV (geral) |
| Display Clínica | `/queue/display/[clinicId]` | Painel para TV (por clínica) |
| Painel Médico | `/queue/panel` | Controle de chamadas |
| Histórico | `/queue/history` | Relatórios (admin) |
| Configurações | `/admin/queue-settings` | Configurar fila (admin) |

---

## 🔄 Integração Automática com Triagem

Quando o paciente faz triagem no MediCore AI, o sistema oferece automaticamente a opção de entrar na fila:

1. Paciente faz triagem por voz/texto
2. IA classifica prioridade (Manchester)
3. Relatório é salvo no sistema
4. Botão "Retirar Senha da Fila" aparece
5. Senha é gerada com prioridade correta
6. Paciente pode acompanhar pelo celular

Isso elimina a necessidade de ir à recepção após a triagem.

---

## ⚙️ Página de Configurações (Admin)

**URL:** `/admin/queue-settings`

Permite ao administrador:
- Ver todos os links do sistema (para configurar dispositivos)
- Gerenciar guichês e consultórios
- Configurar especialidades/serviços
- Ativar/desativar som e síntese de voz
- Definir tempo médio por paciente

---

*Última atualização: Dezembro 2024*
