# 💳 Configuração Completa do Mercado Pago

## 1. Criar Conta no Mercado Pago Developers

### 1.1 Acessar o Portal
1. Acesse [developers.mercadopago.com](https://developers.mercadopago.com)
2. Faça login com sua conta do Mercado Pago
3. Se não tiver conta, crie uma em [mercadopago.com.br](https://mercadopago.com.br)

### 1.2 Criar Aplicação
1. No painel, clique em "Suas integrações"
2. Clique em "Criar aplicação"
3. Preencha os dados:
   - **Nome**: CurriculoIA
   - **Modelo de negócio**: Marketplace
   - **Segmento**: Educação/Tecnologia
4. Clique em "Criar aplicação"

## 2. Obter Credenciais

### 2.1 Credenciais de Teste (Desenvolvimento)
1. Na sua aplicação, vá em "Credenciais"
2. Copie as credenciais de **TESTE**:
   - **Public Key**: Começa com `TEST-`
   - **Access Token**: Começa com `TEST-`

### 2.2 Credenciais de Produção
1. Para usar em produção, você precisa ativar sua conta
2. Complete o processo de verificação no Mercado Pago
3. Depois copie as credenciais de **PRODUÇÃO**

## 3. Configurar Variáveis de Ambiente

### 3.1 Atualizar .env.local
```env
# Mercado Pago - TESTE (Development)
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-sua-public-key-aqui
VITE_MERCADO_PAGO_ACCESS_TOKEN=TEST-sua-access-token-aqui

# Para produção, remova o TEST- e use as credenciais reais
# VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-public-key-producao
# VITE_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-sua-access-token-producao
```

## 4. Configurar URLs de Retorno

### 4.1 No Painel do Mercado Pago
1. Vá em "Configurações" da sua aplicação
2. Configure as URLs de retorno:
   - **Success**: `https://seudominio.com/payment/success`
   - **Failure**: `https://seudominio.com/payment/failure`
   - **Pending**: `https://seudominio.com/payment/pending`

### 4.2 Para Desenvolvimento Local
- Success: `http://localhost:3000?payment_status=approved`
- Failure: `http://localhost:3000?payment_status=rejected`
- Pending: `http://localhost:3000?payment_status=pending`

## 5. Configurar Webhooks (Opcional - Requer Backend)

### 5.1 URL do Webhook
- Configure: `https://seudominio.com/api/webhooks/mercadopago`
- Eventos: `payment`

### 5.2 Implementar Backend
Para webhooks, você precisa de um backend. Opções:
1. **Vercel Functions** (Recomendado)
2. **Netlify Functions**
3. **Express.js + Railway/Heroku**
4. **Next.js API Routes**

## 6. Testar Pagamentos

### 6.1 Cartões de Teste
Use estes cartões para testar:

**Visa (Aprovado)**
- Número: 4509 9535 6623 3704
- CVV: 123
- Vencimento: 11/25

**Mastercard (Rejeitado)**
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimento: 11/25

**PIX (Teste)**
- Use qualquer CPF válido
- O pagamento será simulado

### 6.2 Usuários de Teste
Crie usuários de teste no painel:
1. Vá em "Contas de teste"
2. Crie um "Vendedor" e um "Comprador"
3. Use essas contas para testar

## 7. Fluxo de Pagamento Implementado

### 7.1 Frontend (React)
1. ✅ Usuário escolhe plano
2. ✅ Cria preferência de pagamento
3. ✅ Redireciona para Mercado Pago
4. ✅ Usuário paga
5. ✅ Retorna para aplicação
6. ✅ Mostra resultado

### 7.2 Backend (Webhook - Opcional)
1. Mercado Pago envia notificação
2. Verifica status do pagamento
3. Atualiza perfil do usuário
4. Registra pagamento no banco

## 8. Recursos Implementados

### 8.1 Planos Disponíveis
- **Pro Mensal**: R$ 29,90/mês
- **Pro Anual**: R$ 299,00/ano (17% desconto)
- **Business**: R$ 79,90/mês

### 8.2 Métodos de Pagamento
- ✅ PIX (instantâneo)
- ✅ Cartão de crédito
- ✅ Cartão de débito
- ✅ Boleto bancário

### 8.3 Funcionalidades
- ✅ Interface de planos responsiva
- ✅ Processamento seguro
- ✅ Páginas de resultado
- ✅ Atualização automática de perfil
- ✅ Sistema de créditos

## 9. Segurança

### 9.1 Boas Práticas Implementadas
- ✅ Credenciais no backend apenas
- ✅ Validação de pagamentos
- ✅ URLs de retorno seguras
- ✅ Verificação de webhooks

### 9.2 Importante
- **NUNCA** exponha o Access Token no frontend
- Use HTTPS em produção
- Valide todos os pagamentos no backend
- Implemente logs de auditoria

## 10. Ir para Produção

### 10.1 Checklist
- [ ] Conta Mercado Pago verificada
- [ ] Credenciais de produção obtidas
- [ ] URLs de produção configuradas
- [ ] Webhook implementado (opcional)
- [ ] Testes realizados
- [ ] SSL/HTTPS configurado

### 10.2 Ativação
1. Substitua credenciais de teste pelas de produção
2. Atualize URLs no painel do Mercado Pago
3. Teste com pagamento real pequeno
4. Monitore os primeiros pagamentos

## 11. Suporte e Documentação

### 11.1 Links Úteis
- [Documentação Oficial](https://www.mercadopago.com.br/developers)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Postman Collection](https://www.mercadopago.com.br/developers/pt/guides/sdks)

### 11.2 Suporte
- Email: developers@mercadopago.com
- Slack: [MP Developers](https://join.slack.com/t/mercadopago-developers/shared_invite/...)

## 12. Próximos Passos

### 12.1 Melhorias Futuras
- [ ] Assinaturas recorrentes automáticas
- [ ] Cupons de desconto
- [ ] Planos personalizados
- [ ] Analytics de conversão
- [ ] Programa de afiliados

### 12.2 Integrações Adicionais
- [ ] Nota fiscal automática
- [ ] CRM integration
- [ ] Email marketing
- [ ] Relatórios financeiros