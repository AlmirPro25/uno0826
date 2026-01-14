# 🔐 Admin IAM Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- IAM, Identity, Identidade
- Access Management, Controle de Acesso
- RBAC, ABAC, Permissions
- SSO, SAML, OIDC, OAuth
- MFA, 2FA, Autenticação

## FILOSOFIA
> "Identidade é o novo perímetro."

## MODELOS DE ACESSO
| Modelo | Descrição | Uso |
|--------|-----------|-----|
| RBAC | Role-Based | Maioria dos casos |
| ABAC | Attribute-Based | Regras complexas |
| ReBAC | Relationship-Based | Grafos sociais |

## HIERARQUIA DE ROLES
```
VIEWER → SUPPORT → OPERATOR → ADMIN → SUPER_ADMIN
```

## PRINCÍPIOS IAM
1. **Least Privilege** - Mínimo necessário
2. **Separation of Duties** - Dividir poderes
3. **Defense in Depth** - Múltiplas camadas
4. **Zero Trust** - Nunca confie, sempre verifique

## MFA OBRIGATÓRIO
- TOTP (Google Authenticator)
- Hardware Keys (YubiKey)
- Push Notifications
- SMS (último recurso)

## CHECKLIST
- [ ] MFA obrigatório para admin?
- [ ] Sessions com timeout?
- [ ] Roles bem definidos?
- [ ] Audit de acessos?
- [ ] Revisão periódica?

## ANTI-PATTERNS
❌ **NUNCA** compartilhe credenciais
❌ **NUNCA** use admin para tarefas diárias
❌ **NUNCA** deixe MFA opcional
❌ **NUNCA** ignore logs de acesso
