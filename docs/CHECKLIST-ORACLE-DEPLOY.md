# ✅ Checklist de Deploy - Oracle Cloud

> Lista de verificação rápida para deploy do PROST-QS na Oracle Cloud

---

## 📋 PRÉ-DEPLOY

- [ ] Instância Oracle Cloud criada
- [ ] IP público anotado: `___________________`
- [ ] Chave SSH baixada e salva
- [ ] Acesso SSH testado e funcionando
- [ ] Domínio `api.prostqs.com.br` apontando para o IP

---

## 🔧 CONFIGURAÇÃO INICIAL

- [ ] Conectado na VM via SSH
- [ ] Script `oracle-setup.sh` executado
- [ ] Go 1.21+ instalado e funcionando
- [ ] Nginx instalado
- [ ] Firewall UFW configurado
- [ ] Firewall Oracle Cloud configurado (portas 80, 443, 22)

---

## 📦 APLICAÇÃO

- [ ] Repositório clonado em `~/apps/uno0826`
- [ ] Arquivo `.env` criado e configurado
- [ ] Variáveis de ambiente validadas:
  - [ ] `DATABASE_URL` (Supabase/Neon)
  - [ ] `JWT_SECRET` (mínimo 32 caracteres)
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `ALLOWED_ORIGINS`
- [ ] Build da aplicação executado com sucesso
- [ ] Binário `prostqs-api` criado

---

## 🔄 SYSTEMD SERVICE

- [ ] Arquivo `prostqs.service` copiado para `/etc/systemd/system/`
- [ ] Diretório `/var/log/prostqs` criado
- [ ] Permissões corretas no diretório de logs
- [ ] Service habilitado: `sudo systemctl enable prostqs`
- [ ] Service iniciado: `sudo systemctl start prostqs`
- [ ] Service rodando: `sudo systemctl status prostqs`
- [ ] Logs sem erros: `sudo journalctl -u prostqs -n 50`

---

## 🌐 NGINX

- [ ] Arquivo de configuração criado em `/etc/nginx/sites-available/prostqs`
- [ ] Symlink criado em `/etc/nginx/sites-enabled/`
- [ ] Configuração testada: `sudo nginx -t`
- [ ] Nginx reiniciado: `sudo systemctl restart nginx`
- [ ] Nginx rodando sem erros

---

## 🔒 SSL/HTTPS

- [ ] DNS propagado (teste: `nslookup api.prostqs.com.br`)
- [ ] Certbot executado: `sudo certbot --nginx -d api.prostqs.com.br`
- [ ] Certificado SSL obtido com sucesso
- [ ] Redirect HTTP → HTTPS funcionando
- [ ] Renovação automática configurada

---

## 🧪 TESTES

- [ ] Health check local: `curl http://localhost:8080/health`
- [ ] Health check público: `curl https://api.prostqs.com.br/health`
- [ ] Endpoint de login: `curl https://api.prostqs.com.br/api/v1/auth/login`
- [ ] CORS funcionando (testar do frontend)
- [ ] Google OAuth funcionando

---

## 📊 MONITORAMENTO

- [ ] Logs acessíveis: `sudo journalctl -u prostqs -f`
- [ ] Logs do Nginx acessíveis
- [ ] Uptime Robot configurado (opcional)
- [ ] Alertas configurados (opcional)

---

## 🔄 DEPLOY AUTOMÁTICO

- [ ] Script `oracle-deploy.sh` copiado para `~/deploy.sh`
- [ ] Script tornado executável: `chmod +x ~/deploy.sh`
- [ ] Deploy testado: `~/deploy.sh`
- [ ] Rollback testado (reverter para versão anterior)

---

## 🔐 SEGURANÇA

- [ ] Senha root desabilitada
- [ ] Login SSH apenas com chave
- [ ] Firewall UFW ativo
- [ ] Firewall Oracle Cloud configurado
- [ ] Fail2ban instalado (opcional)
- [ ] Atualizações automáticas configuradas (opcional)

---

## 📝 DOCUMENTAÇÃO

- [ ] IP público documentado
- [ ] Credenciais salvas em local seguro
- [ ] Variáveis de ambiente documentadas
- [ ] Procedimento de rollback documentado

---

## ✅ VALIDAÇÃO FINAL

- [ ] API respondendo em `https://api.prostqs.com.br`
- [ ] Frontend consegue se conectar
- [ ] Login funcionando
- [ ] Telemetria funcionando
- [ ] Sem erros nos logs
- [ ] Performance aceitável (< 200ms)

---

## 🚨 CONTATOS DE EMERGÊNCIA

- **Suporte Oracle:** https://cloud.oracle.com/support
- **Documentação:** `docs/DEPLOY-ORACLE-CLOUD.md`
- **Logs:** `sudo journalctl -u prostqs -f`

---

## 📞 TROUBLESHOOTING RÁPIDO

### Serviço não inicia:
```bash
sudo journalctl -u prostqs -n 50 --no-pager
```

### Nginx 502:
```bash
sudo systemctl status prostqs
sudo netstat -tulpn | grep 8080
```

### SSL não funciona:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

---

*Última atualização: 15/01/2026*
