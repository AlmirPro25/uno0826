# 🚀 DEPLOY NO FLY.IO — Guia Passo a Passo

## PRÉ-REQUISITOS

1. Conta no Fly.io criada
2. Fly CLI instalado (`irm https://fly.io/install.ps1 | iex`)
3. Logado (`fly auth login`)

---

## PASSO 1: Criar o App no Fly.io

```powershell
cd UNO-main
fly apps create prost-qs
```

Se o nome `prost-qs` já existir, escolha outro (ex: `prost-qs-almir`).

---

## PASSO 2: Criar Volume para o Banco de Dados

```powershell
fly volumes create prostqs_data --region gru --size 1
```

Isso cria 1GB de armazenamento persistente em São Paulo.

---

## PASSO 3: Configurar Secrets (Variáveis Sensíveis)

```powershell
# JWT Secret (gere uma string aleatória de 64 caracteres)
fly secrets set JWT_SECRET="coloque_uma_string_aleatoria_muito_longa_aqui_1234567890abcdef"

# AES Key (EXATAMENTE 32 caracteres)
fly secrets set AES_SECRET_KEY="12345678901234567890123456789012"

# Secrets Master Key (EXATAMENTE 32 caracteres)
fly secrets set SECRETS_MASTER_KEY="abcdefghijklmnopqrstuvwxyz123456"
```

**IMPORTANTE**: Troque essas chaves por valores reais e seguros!

Para gerar chaves seguras:
```powershell
# Gerar string aleatória de 32 bytes (para AES)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 })).Substring(0,32)
```

---

## PASSO 4: Deploy!

```powershell
fly deploy
```

Isso vai:
1. Buildar o Docker image
2. Enviar para o Fly.io
3. Iniciar a máquina
4. Configurar HTTPS automático

---

## PASSO 5: Verificar se Funcionou

```powershell
# Ver status
fly status

# Ver logs
fly logs

# Testar health
curl https://prost-qs.fly.dev/health
```

---

## PASSO 6: Acessar o Sistema

Seu sistema estará em:
- **API**: https://prost-qs.fly.dev
- **Health**: https://prost-qs.fly.dev/health

---

## COMANDOS ÚTEIS

```powershell
# Ver logs em tempo real
fly logs -f

# Abrir console SSH na máquina
fly ssh console

# Ver métricas
fly status

# Escalar (se precisar mais poder)
fly scale memory 1024

# Reiniciar
fly apps restart
```

---

## CONFIGURAR STRIPE EM PRODUÇÃO

Depois do deploy, configure as chaves do Stripe:

```powershell
fly secrets set STRIPE_SECRET_KEY="sk_live_xxx"
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

---

## DOMÍNIO CUSTOMIZADO (OPCIONAL)

Se quiser usar seu próprio domínio:

```powershell
fly certs create seu-dominio.com
```

Depois configure o DNS apontando para o Fly.io.

---

## TROUBLESHOOTING

### Build falhou
```powershell
fly logs --instance <instance-id>
```

### App não inicia
Verifique se os secrets estão configurados:
```powershell
fly secrets list
```

### Banco de dados vazio após redeploy
O volume deve persistir. Verifique:
```powershell
fly volumes list
```

---

## CHECKLIST FINAL

- [ ] App criado (`fly apps create`)
- [ ] Volume criado (`fly volumes create`)
- [ ] Secrets configurados (`fly secrets set`)
- [ ] Deploy feito (`fly deploy`)
- [ ] Health respondendo (`/health`)
- [ ] Login funcionando
- [ ] Criar primeiro app via Admin

---

*"O sistema agora existe no mundo."*
