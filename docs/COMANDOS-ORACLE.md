# 🔧 Comandos Úteis - Oracle Cloud

> Referência rápida de comandos para gerenciar o PROST-QS na Oracle Cloud

---

## 🔌 CONECTAR NA VM

```bash
# Windows (PowerShell)
ssh -i "C:\Users\SEU_USUARIO\.ssh\oracle-key.key" ubuntu@SEU_IP

# Linux/Mac
ssh -i ~/.ssh/oracle-key.key ubuntu@SEU_IP
```

---

## 🔄 GERENCIAR SERVIÇO

```bash
# Ver status
sudo systemctl status prostqs

# Iniciar
sudo systemctl start prostqs

# Parar
sudo systemctl stop prostqs

# Reiniciar
sudo systemctl restart prostqs

# Recarregar configuração (sem parar)
sudo systemctl reload prostqs

# Habilitar inicialização automática
sudo systemctl enable prostqs

# Desabilitar inicialização automática
sudo systemctl disable prostqs

# Ver se está ativo
sudo systemctl is-active prostqs
```

---

## 📊 LOGS

```bash
# Ver logs em tempo real
sudo journalctl -u prostqs -f

# Últimas 50 linhas
sudo journalctl -u prostqs -n 50

# Últimas 100 linhas sem paginação
sudo journalctl -u prostqs -n 100 --no-pager

# Logs desde hoje
sudo journalctl -u prostqs --since today

# Logs da última hora
sudo journalctl -u prostqs --since "1 hour ago"

# Logs entre datas
sudo journalctl -u prostqs --since "2026-01-15 10:00" --until "2026-01-15 12:00"

# Logs da aplicação (arquivo)
tail -f /var/log/prostqs/access.log
tail -f /var/log/prostqs/error.log

# Logs do Nginx
sudo tail -f /var/log/nginx/prostqs-access.log
sudo tail -f /var/log/nginx/prostqs-error.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🌐 NGINX

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver sites habilitados
ls -la /etc/nginx/sites-enabled/

# Editar configuração
sudo nano /etc/nginx/sites-available/prostqs
```

---

## 🔒 SSL/CERTBOT

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Renovar forçado
sudo certbot renew --force-renewal

# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Obter novo certificado
sudo certbot --nginx -d api.prostqs.com.br

# Revogar certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/api.prostqs.com.br/cert.pem

# Ver logs do Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 🔥 FIREWALL

```bash
# Ver status
sudo ufw status

# Ver regras numeradas
sudo ufw status numbered

# Habilitar
sudo ufw enable

# Desabilitar
sudo ufw disable

# Permitir porta
sudo ufw allow 8080/tcp

# Negar porta
sudo ufw deny 8080/tcp

# Deletar regra (por número)
sudo ufw delete 3

# Resetar firewall
sudo ufw reset
```

---

## 📦 APLICAÇÃO

```bash
# Ir para diretório
cd ~/apps/uno0826/backend

# Atualizar código
git pull origin main

# Ver status do Git
git status

# Ver último commit
git log -1

# Atualizar dependências
go mod download

# Buildar
go build -o prostqs-api cmd/api/main.go

# Executar manualmente (para debug)
./prostqs-api

# Ver versão do Go
go version

# Limpar cache do Go
go clean -cache
```

---

## 🔍 MONITORAMENTO

```bash
# Processos em execução
ps aux | grep prostqs

# Portas abertas
sudo netstat -tulpn | grep LISTEN

# Verificar porta 8080
sudo netstat -tulpn | grep 8080

# Uso de CPU e memória (interativo)
htop

# Uso de CPU e memória (snapshot)
top -bn1 | head -20

# Espaço em disco
df -h

# Uso de disco por diretório
du -sh ~/apps/*

# Memória disponível
free -h

# Uptime do servidor
uptime

# Informações do sistema
uname -a
lsb_release -a
```

---

## 🧪 TESTAR API

```bash
# Health check local
curl http://localhost:8080/health

# Health check público
curl https://api.prostqs.com.br/health

# Com headers detalhados
curl -v https://api.prostqs.com.br/health

# Testar endpoint específico
curl -X POST https://api.prostqs.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Testar CORS
curl -H "Origin: https://prostqs.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://api.prostqs.com.br/api/v1/auth/login

# Testar SSL
curl -vI https://api.prostqs.com.br

# Benchmark simples
ab -n 100 -c 10 https://api.prostqs.com.br/health
```

---

## 🔄 DEPLOY

```bash
# Deploy automático
~/deploy.sh

# Deploy manual
cd ~/apps/uno0826/backend
git pull origin main
go build -o prostqs-api cmd/api/main.go
sudo systemctl restart prostqs

# Verificar após deploy
sudo systemctl status prostqs
curl https://api.prostqs.com.br/health
```

---

## 🗄️ BANCO DE DADOS

```bash
# Conectar no PostgreSQL (Supabase/Neon)
psql "postgresql://usuario:senha@host.supabase.co:5432/postgres"

# Executar query
psql "postgresql://..." -c "SELECT COUNT(*) FROM users;"

# Dump do banco
pg_dump "postgresql://..." > backup.sql

# Restaurar banco
psql "postgresql://..." < backup.sql
```

---

## 📁 ARQUIVOS E DIRETÓRIOS

```bash
# Ver estrutura do projeto
tree ~/apps/uno0826 -L 2

# Buscar arquivo
find ~/apps/uno0826 -name "*.go"

# Buscar texto em arquivos
grep -r "DATABASE_URL" ~/apps/uno0826

# Ver tamanho de diretórios
du -sh ~/apps/uno0826/*

# Limpar logs antigos
sudo find /var/log/prostqs -name "*.log" -mtime +30 -delete

# Backup de configuração
cp ~/apps/uno0826/backend/.env ~/backups/.env.$(date +%Y%m%d)
```

---

## 🔐 SEGURANÇA

```bash
# Ver tentativas de login SSH
sudo grep "Failed password" /var/log/auth.log

# Ver IPs conectados
who

# Ver últimos logins
last

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Ver pacotes que precisam atualizar
apt list --upgradable

# Instalar atualizações de segurança
sudo apt install unattended-upgrades
```

---

## 🚨 TROUBLESHOOTING

```bash
# Serviço não inicia
sudo journalctl -u prostqs -n 50 --no-pager
sudo systemctl status prostqs -l

# Nginx 502 Bad Gateway
sudo systemctl status prostqs
sudo netstat -tulpn | grep 8080
curl http://localhost:8080/health

# Porta já em uso
sudo lsof -i :8080
sudo kill -9 PID

# Verificar variáveis de ambiente
sudo systemctl show prostqs | grep Environment

# Testar binário manualmente
cd ~/apps/uno0826/backend
./prostqs-api

# Ver erros de compilação
go build -v -o prostqs-api cmd/api/main.go

# Limpar e rebuildar
go clean
go build -o prostqs-api cmd/api/main.go
```

---

## 💾 BACKUP

```bash
# Backup do código
cd ~/apps
tar -czf uno0826-backup-$(date +%Y%m%d).tar.gz uno0826/

# Backup do .env
cp ~/apps/uno0826/backend/.env ~/backups/.env.$(date +%Y%m%d)

# Backup dos logs
sudo tar -czf /home/ubuntu/backups/logs-$(date +%Y%m%d).tar.gz /var/log/prostqs/

# Listar backups
ls -lh ~/backups/
```

---

## 🔄 ROLLBACK

```bash
# Reverter para commit anterior
cd ~/apps/uno0826/backend
git log --oneline -5
git checkout COMMIT_HASH
go build -o prostqs-api cmd/api/main.go
sudo systemctl restart prostqs

# Voltar para main
git checkout main
```

---

## 📊 PERFORMANCE

```bash
# Ver conexões ativas
sudo netstat -an | grep :8080 | wc -l

# Ver requisições por segundo (Nginx)
tail -f /var/log/nginx/prostqs-access.log | pv -l -i 1 > /dev/null

# Benchmark
ab -n 1000 -c 100 https://api.prostqs.com.br/health

# Stress test
siege -c 50 -t 30s https://api.prostqs.com.br/health
```

---

## 🆘 EMERGÊNCIA

```bash
# Parar tudo imediatamente
sudo systemctl stop prostqs
sudo systemctl stop nginx

# Reiniciar servidor
sudo reboot

# Modo de manutenção (Nginx)
sudo nano /etc/nginx/sites-available/prostqs
# Adicionar: return 503;
sudo systemctl reload nginx
```

---

*Última atualização: 15/01/2026*
