# 🛠️ Comandos Git Úteis - Referência Rápida

## 📦 Configuração Inicial

```bash
# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email
git config --global user.email "seu@email.com"

# Ver configurações
git config --list

# Configurar editor padrão
git config --global core.editor "code --wait"  # VS Code
```

## 🚀 Básico

```bash
# Inicializar repositório
git init

# Clonar repositório
git clone https://github.com/usuario/repo.git

# Ver status
git status

# Ver status resumido
git status -s

# Adicionar arquivo específico
git add arquivo.txt

# Adicionar todos os arquivos
git add .

# Adicionar apenas arquivos modificados
git add -u

# Commit
git commit -m "mensagem do commit"

# Commit com descrição longa
git commit -m "título" -m "descrição detalhada"

# Adicionar e commitar junto
git commit -am "mensagem"

# Push
git push

# Push primeira vez
git push -u origin main

# Pull
git pull

# Pull com rebase
git pull --rebase
```

## 🌿 Branches

```bash
# Listar branches
git branch

# Listar todas (incluindo remotas)
git branch -a

# Criar branch
git branch nome-da-branch

# Criar e mudar para branch
git checkout -b nome-da-branch

# Mudar de branch
git checkout nome-da-branch

# Renomear branch atual
git branch -m novo-nome

# Deletar branch local
git branch -d nome-da-branch

# Deletar branch forçado
git branch -D nome-da-branch

# Deletar branch remota
git push origin --delete nome-da-branch

# Atualizar lista de branches remotas
git fetch --prune
```

## 🔄 Sincronização

```bash
# Ver remotes
git remote -v

# Adicionar remote
git remote add origin https://github.com/usuario/repo.git

# Mudar URL do remote
git remote set-url origin https://github.com/usuario/novo-repo.git

# Remover remote
git remote remove origin

# Fetch (baixar sem merge)
git fetch origin

# Fetch todas as branches
git fetch --all

# Pull de branch específica
git pull origin main

# Push de branch específica
git push origin feature-branch

# Push todas as branches
git push --all

# Push tags
git push --tags
```

## 📝 Histórico e Logs

```bash
# Ver histórico
git log

# Log resumido (uma linha por commit)
git log --oneline

# Log com gráfico
git log --graph --oneline --all

# Log dos últimos 5 commits
git log -5

# Log de um arquivo específico
git log arquivo.txt

# Ver mudanças de um commit
git show commit-hash

# Ver diferenças
git diff

# Diferenças staged
git diff --staged

# Diferenças entre branches
git diff branch1..branch2

# Ver quem modificou cada linha
git blame arquivo.txt
```

## ↩️ Desfazer Mudanças

```bash
# Descartar mudanças em arquivo
git checkout -- arquivo.txt

# Descartar todas as mudanças
git checkout -- .

# Remover arquivo do stage
git reset HEAD arquivo.txt

# Remover todos do stage
git reset HEAD

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (descarta mudanças)
git reset --hard HEAD~1

# Desfazer commit específico
git revert commit-hash

# Limpar arquivos não rastreados
git clean -fd

# Ver o que seria limpo (dry run)
git clean -n
```

## 🏷️ Tags

```bash
# Listar tags
git tag

# Criar tag
git tag v1.0.0

# Criar tag anotada
git tag -a v1.0.0 -m "Versão 1.0.0"

# Tag em commit específico
git tag v1.0.0 commit-hash

# Push tag
git push origin v1.0.0

# Push todas as tags
git push --tags

# Deletar tag local
git tag -d v1.0.0

# Deletar tag remota
git push origin --delete v1.0.0

# Checkout de tag
git checkout v1.0.0
```

## 🔀 Merge e Rebase

```bash
# Merge branch na atual
git merge nome-da-branch

# Merge sem fast-forward
git merge --no-ff nome-da-branch

# Abortar merge
git merge --abort

# Rebase
git rebase main

# Rebase interativo (últimos 3 commits)
git rebase -i HEAD~3

# Continuar rebase após resolver conflitos
git rebase --continue

# Abortar rebase
git rebase --abort

# Cherry-pick (aplicar commit específico)
git cherry-pick commit-hash
```

## 💾 Stash (Guardar Temporariamente)

```bash
# Guardar mudanças
git stash

# Guardar com mensagem
git stash save "mensagem"

# Listar stashes
git stash list

# Aplicar último stash
git stash apply

# Aplicar e remover último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{2}

# Remover último stash
git stash drop

# Remover stash específico
git stash drop stash@{2}

# Limpar todos os stashes
git stash clear

# Ver conteúdo do stash
git stash show -p
```

## 🔍 Busca

```bash
# Buscar texto no código
git grep "texto"

# Buscar em commits
git log --all --grep="texto"

# Buscar commits que modificaram arquivo
git log --all -- arquivo.txt

# Buscar commits de autor
git log --author="Nome"

# Buscar commits por data
git log --since="2024-01-01"
git log --until="2024-12-31"
```

## 🧹 Limpeza

```bash
# Limpar arquivos não rastreados
git clean -fd

# Limpar incluindo ignorados
git clean -fdx

# Ver o que seria limpo
git clean -n

# Otimizar repositório
git gc

# Verificar integridade
git fsck

# Remover branches remotas deletadas
git fetch --prune

# Ver tamanho do repositório
git count-objects -vH
```

## 🔐 Segurança

```bash
# Verificar se há API keys
git grep -i "api.key\|apikey"

# Ver arquivos grandes
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort --numeric-sort --key=2 | \
  tail -10

# Remover arquivo do histórico (CUIDADO!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch arquivo-sensivel.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Alternativa moderna (BFG Repo-Cleaner)
# https://rtyley.github.io/bfg-repo-cleaner/
```

## 📊 Estatísticas

```bash
# Número de commits por autor
git shortlog -sn

# Estatísticas do repositório
git log --stat

# Contribuições por autor
git log --author="Nome" --oneline | wc -l

# Arquivos mais modificados
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -10

# Linhas adicionadas/removidas
git log --shortstat --author="Nome"
```

## 🆘 Emergência

```bash
# Recuperar commit deletado
git reflog
git checkout commit-hash

# Recuperar branch deletada
git reflog
git checkout -b branch-recuperada commit-hash

# Desfazer push (CUIDADO!)
git push --force origin main

# Resetar para estado remoto
git fetch origin
git reset --hard origin/main

# Criar backup antes de operação arriscada
git branch backup-$(date +%Y%m%d)
```

## 🎯 Aliases Úteis

Adicione ao `~/.gitconfig`:

```ini
[alias]
    # Status resumido
    st = status -s
    
    # Log bonito
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    
    # Último commit
    last = log -1 HEAD
    
    # Desfazer último commit
    undo = reset --soft HEAD~1
    
    # Listar branches por data
    branches = branch --sort=-committerdate
    
    # Commit rápido
    cm = commit -m
    
    # Checkout rápido
    co = checkout
    
    # Branch rápido
    br = branch
    
    # Push rápido
    ps = push
    
    # Pull rápido
    pl = pull
```

Usar:
```bash
git st      # ao invés de git status -s
git lg      # log bonito
git cm "mensagem"  # commit rápido
```

## 📚 Recursos

- [Git Docs Oficial](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Oh Shit, Git!?!](https://ohshitgit.com/) - Resolver problemas comuns

---

**Dica:** Use `git <comando> --help` para ver ajuda detalhada de qualquer comando!
