#!/bin/bash

# ============================================
# Script de Setup para GitHub
# AI Web Weaver
# ============================================

echo "🚀 AI Web Weaver - Setup GitHub"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não está instalado!${NC}"
    echo "Instale o Git: https://git-scm.com/downloads"
    exit 1
fi

echo -e "${GREEN}✅ Git instalado${NC}"
echo ""

# Verificar se já é um repositório Git
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Repositório Git já existe${NC}"
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo -e "${BLUE}📦 Inicializando repositório Git...${NC}"
    git init
    echo -e "${GREEN}✅ Repositório inicializado${NC}"
fi

echo ""

# Verificar .env
if [ -f ".env" ]; then
    echo -e "${RED}⚠️  ATENÇÃO: Arquivo .env encontrado!${NC}"
    echo "Certifique-se de que está no .gitignore"
    
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ .env está no .gitignore${NC}"
    else
        echo -e "${RED}❌ .env NÃO está no .gitignore!${NC}"
        echo "Adicione '.env' ao .gitignore antes de continuar"
        exit 1
    fi
fi

echo ""

# Verificar API keys
echo -e "${BLUE}🔍 Verificando API keys no código...${NC}"
if git grep -i "AIza\|api.key.*=.*['\"][A-Za-z0-9]" -- ':!*.md' ':!.env.example' ':!setup-github.sh' &> /dev/null; then
    echo -e "${RED}❌ POSSÍVEL API KEY ENCONTRADA NO CÓDIGO!${NC}"
    echo "Revise os arquivos antes de fazer push"
    git grep -i "AIza\|api.key.*=.*['\"][A-Za-z0-9]" -- ':!*.md' ':!.env.example' ':!setup-github.sh'
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Nenhuma API key encontrada${NC}"
fi

echo ""

# Adicionar arquivos
echo -e "${BLUE}📝 Adicionando arquivos ao Git...${NC}"
git add .

# Verificar status
echo ""
echo -e "${BLUE}📊 Status do repositório:${NC}"
git status --short

echo ""
read -p "Deseja fazer o commit inicial? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    git commit -m "feat: initial commit - AI Web Weaver com Excellence Core

- Excellence Core: Sistema de excelência programável
- Single-File Apps: Aplicativos portáteis
- 7 Personas especializadas
- Geração buildless com Vue.js e React
- Score médio de qualidade: 90/100"
    
    echo -e "${GREEN}✅ Commit realizado${NC}"
else
    echo -e "${YELLOW}⏭️  Commit pulado${NC}"
    exit 0
fi

echo ""

# Configurar remote
echo -e "${BLUE}🔗 Configurar remote do GitHub${NC}"
echo ""
read -p "Digite seu username do GitHub: " github_user

if [ -z "$github_user" ]; then
    echo -e "${RED}❌ Username não pode ser vazio${NC}"
    exit 1
fi

read -p "Digite o nome do repositório [ai-web-weaver]: " repo_name
repo_name=${repo_name:-ai-web-weaver}

remote_url="https://github.com/$github_user/$repo_name.git"

echo ""
echo -e "${BLUE}Remote URL: ${remote_url}${NC}"
echo ""

# Verificar se remote já existe
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' já existe${NC}"
    current_url=$(git remote get-url origin)
    echo "URL atual: $current_url"
    echo ""
    read -p "Deseja atualizar? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git remote set-url origin "$remote_url"
        echo -e "${GREEN}✅ Remote atualizado${NC}"
    fi
else
    git remote add origin "$remote_url"
    echo -e "${GREEN}✅ Remote adicionado${NC}"
fi

echo ""

# Renomear branch para main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo -e "${BLUE}🔄 Renomeando branch para 'main'...${NC}"
    git branch -M main
    echo -e "${GREEN}✅ Branch renomeada${NC}"
fi

echo ""

# Push
echo -e "${BLUE}🚀 Fazer push para o GitHub?${NC}"
echo -e "${YELLOW}⚠️  Certifique-se de que o repositório foi criado no GitHub primeiro!${NC}"
echo ""
echo "Acesse: https://github.com/new"
echo "Nome do repositório: $repo_name"
echo ""
read -p "Repositório criado no GitHub? (s/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}📤 Fazendo push...${NC}"
    
    if git push -u origin main; then
        echo ""
        echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
        echo ""
        echo "🎉 Seu projeto está no GitHub!"
        echo ""
        echo "🔗 URL: https://github.com/$github_user/$repo_name"
        echo ""
        echo "📝 Próximos passos:"
        echo "1. Adicione topics no repositório"
        echo "2. Configure descrição e website"
        echo "3. Crie uma release (v1.0.0)"
        echo "4. Compartilhe nas redes sociais!"
    else
        echo ""
        echo -e "${RED}❌ Erro no push${NC}"
        echo ""
        echo "Possíveis causas:"
        echo "1. Repositório não existe no GitHub"
        echo "2. Sem permissão de acesso"
        echo "3. Problemas de autenticação"
        echo ""
        echo "Tente manualmente:"
        echo "git push -u origin main"
    fi
else
    echo ""
    echo -e "${YELLOW}⏭️  Push pulado${NC}"
    echo ""
    echo "Para fazer push manualmente:"
    echo "git push -u origin main"
fi

echo ""
echo "================================"
echo "✨ Setup concluído!"
echo "================================"
