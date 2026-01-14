# 🔧 Solução Rápida - Erro de Quota de Armazenamento

## ⚠️ Problema

Você está vendo este erro:
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage'
```

Isso significa que o localStorage do navegador está cheio (limite ~5-10 MB).

---

## ✅ Solução Imediata (3 opções)

### Opção 1: Limpeza Inteligente (Recomendado) ⭐

Clique no botão **"Limpeza Inteligente"** na tela de erro.

Isso remove automaticamente:
1. Histórico de interações antigas
2. Memórias menos importantes
3. Mantém configurações e dados recentes

**Resultado:** Libera ~1 MB de espaço

---

### Opção 2: Limpar Sessões Antigas

Clique em **"Limpar Sessões Antigas"**.

Remove:
- Conversas antigas (mantém últimas 5)
- Transcrições antigas
- Mantém memórias e configurações

**Resultado:** Libera espaço variável

---

### Opção 3: Limpar Tudo (Último Recurso)

Clique em **"Limpar Tudo"**.

⚠️ **ATENÇÃO:** Isso apaga:
- Todas as conversas
- Todas as memórias
- Todas as configurações
- Todo o histórico

**Resultado:** Volta ao estado inicial

---

## 🔍 Verificar Espaço Usado

Abra o console do navegador (F12) e execute:

```javascript
// Ver tamanho de cada item
Object.keys(localStorage).forEach(key => {
  const size = (localStorage.getItem(key)?.length || 0) / 1024;
  console.log(`${key}: ${size.toFixed(2)} KB`);
});

// Ver total usado
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += (localStorage.getItem(key)?.length || 0);
  }
}
console.log(`Total: ${(total / 1024).toFixed(2)} KB`);
```

---

## 🛠️ Limpeza Manual (Console)

### Limpar apenas memórias:
```javascript
localStorage.removeItem('long-term-memories');
localStorage.removeItem('interaction-history');
window.location.reload();
```

### Limpar apenas histórico de conversas:
```javascript
localStorage.removeItem('gemini-companion-db');
window.location.reload();
```

### Limpar tudo:
```javascript
localStorage.clear();
window.location.reload();
```

---

## 📊 Entendendo o Uso de Espaço

### Itens que mais ocupam espaço:

1. **gemini-companion-db** (2-4 MB)
   - Todas as conversas e transcrições
   - Resumos de sessões
   - **Solução:** Limpar sessões antigas

2. **long-term-memories** (500 KB - 2 MB)
   - Memórias de longo prazo
   - Embeddings
   - **Solução:** Exportar e limpar

3. **interaction-history** (100-500 KB)
   - Últimas 50 interações
   - **Solução:** Pode ser removido sem perda

4. **personality-config** (< 5 KB)
   - Configurações de personalidade
   - **Solução:** Não remover

5. **user-profile** (< 10 KB)
   - Perfil do usuário
   - **Solução:** Não remover

---

## 🔄 Prevenção Futura

### 1. Exporte Regularmente

**Memórias:**
```
Painel de Memória → Exportar
```

**Conversas:**
Use a funcionalidade de exportação quando disponível.

### 2. Limpe Periodicamente

**Recomendação:** A cada 2 semanas
- Limpar sessões antigas
- Exportar memórias importantes
- Limpar memórias menos relevantes

### 3. Monitore o Uso

Execute no console:
```javascript
// Health check
const health = checkStorageHealth();
console.log(health);
```

---

## 🎯 Configurações Otimizadas

Para reduzir uso de espaço:

### 1. Reduza Proatividade
```
Configurações → Proatividade → Baixa
```
Menos análises = menos dados armazenados

### 2. Limite Memórias
No código (`memoryService.ts`):
```typescript
private readonly MAX_MEMORIES = 200; // Reduzir de 500
```

### 3. Desabilite Recursos Opcionais
```javascript
// No console
proactiveService.setEnabled(false);
```

---

## 🚨 Se Nada Funcionar

### Opção A: Usar Modo Anônimo
- Abre navegador em modo anônimo
- localStorage vazio
- Sem histórico

### Opção B: Outro Navegador
- Chrome, Firefox, Edge têm limites diferentes
- Tente outro navegador

### Opção C: Aumentar Quota (Avançado)
Alguns navegadores permitem aumentar quota:
- Chrome: `chrome://settings/content/cookies`
- Firefox: `about:config` → `dom.storage.default_quota`

---

## 📝 Checklist de Recuperação

- [ ] Tentei "Limpeza Inteligente"
- [ ] Exportei dados importantes
- [ ] Limpei sessões antigas
- [ ] Verifiquei espaço usado
- [ ] Recarreguei a página
- [ ] Funciona novamente ✅

---

## 💡 Dicas Pro

### Backup Automático
Crie um script para backup regular:
```javascript
// Executar mensalmente
const backup = {
  memories: localStorage.getItem('long-term-memories'),
  profile: localStorage.getItem('user-profile'),
  personality: localStorage.getItem('personality-config'),
  date: new Date().toISOString()
};

// Salvar em arquivo
const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `gemini-backup-${Date.now()}.json`;
a.click();
```

### Restaurar Backup
```javascript
// Ler arquivo JSON
const backup = JSON.parse(fileContent);
localStorage.setItem('long-term-memories', backup.memories);
localStorage.setItem('user-profile', backup.profile);
localStorage.setItem('personality-config', backup.personality);
window.location.reload();
```

---

## 🎉 Problema Resolvido?

Após limpar:
1. Recarregue a página
2. Verifique se o erro sumiu
3. Configure novamente se necessário
4. Continue usando normalmente

**O sistema agora gerencia melhor o espaço e não deve dar erro novamente!** ✅

---

## 📞 Ainda com Problemas?

Consulte:
- [TROUBLESHOOTING_INTELLIGENCE.md](TROUBLESHOOTING_INTELLIGENCE.md)
- [STORAGE.md](STORAGE.md)

Ou execute diagnóstico completo:
```javascript
console.table({
  total: `${(Object.keys(localStorage).reduce((t, k) => 
    t + (localStorage.getItem(k)?.length || 0), 0) / 1024).toFixed(2)} KB`,
  items: Object.keys(localStorage).length,
  health: checkStorageHealth().status
});
```
