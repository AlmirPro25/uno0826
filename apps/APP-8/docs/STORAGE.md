# 💾 Gerenciamento de Armazenamento

## Sobre o Armazenamento Local

O Gemini Live Companion salva todas as conversas localmente no seu navegador usando **localStorage**. Isso significa:

✅ **Privacidade total** - Dados ficam apenas no seu dispositivo
✅ **Acesso offline** - Histórico disponível sem internet
✅ **Sem custos** - Não usa servidores externos

⚠️ **Limite de espaço** - Navegadores limitam o localStorage (geralmente 5-10 MB)

---

## 📊 Monitorando o Uso

### No Painel de Histórico

1. Clique no ícone de **relógio** (histórico)
2. Veja o tamanho atual no topo: `Armazenamento: X.XX MB`
3. Use o botão **"Limpar antigas"** para liberar espaço

### Tamanhos Típicos

- **Sessão curta** (5-10 mensagens): ~10-50 KB
- **Sessão média** (20-50 mensagens): ~100-300 KB
- **Sessão longa** (100+ mensagens): ~500 KB - 1 MB
- **Banco completo** (10-20 sessões): ~2-5 MB

---

## 🧹 Limpando Dados

### Opção 1: Limpar Sessões Antigas (Recomendado)

**Quando usar:** Quando o armazenamento está ficando cheio

**Como fazer:**
1. Abra o painel de histórico
2. Clique em **"Limpar antigas"**
3. Confirme a ação
4. Mantém as 10 sessões mais recentes

**Resultado:** Libera espaço mantendo conversas recentes

---

### Opção 2: Limpar Tudo

**Quando usar:** Quando você quer começar do zero

**Como fazer:**
1. Se aparecer erro de quota, clique em **"Limpar Tudo"**
2. Ou use o console do navegador: `localStorage.clear()`
3. Confirme a ação (irreversível!)

**Resultado:** Remove TODAS as conversas

---

## ⚠️ Erro: "Armazenamento Cheio"

Se você ver este erro ao iniciar o app:

### Sintomas
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage'
```

### Soluções

**1. Limpar Sessões Antigas**
- Clique no botão **"Limpar Sessões Antigas"**
- Remove conversas mais antigas automaticamente
- Mantém as 5 sessões mais recentes

**2. Limpar Tudo**
- Use apenas se a opção 1 não funcionar
- Remove todo o histórico
- Libera 100% do espaço

**3. Aumentar Limite (Avançado)**
- Alguns navegadores permitem aumentar o limite
- Chrome: `chrome://settings/content/all`
- Firefox: `about:config` → `dom.storage.default_quota`

---

## 🔧 Gerenciamento Manual

### Via Console do Navegador (F12)

```javascript
// Ver tamanho atual
console.log(databaseService.getDatabaseSize());

// Limpar sessões antigas (manter 5)
await databaseService.deleteOldSessions(5);

// Limpar tudo
databaseService.clearAllData();

// Ver dados brutos
console.log(localStorage.getItem('gemini-companion-db'));
```

### Exportar Dados (Backup Manual)

```javascript
// Copiar dados para clipboard
const data = localStorage.getItem('gemini-companion-db');
navigator.clipboard.writeText(data);
console.log('Dados copiados! Cole em um arquivo .txt');
```

### Importar Dados (Restaurar Backup)

```javascript
// Cole os dados salvos
const backup = 'SEU_BACKUP_AQUI';
localStorage.setItem('gemini-companion-db', backup);
location.reload();
```

---

## 💡 Dicas para Economizar Espaço

### 1. Limpeza Regular
- Limpe sessões antigas a cada 2-3 semanas
- Mantenha apenas 10-15 sessões mais recentes

### 2. Sessões Curtas
- Pare e reinicie sessões periodicamente
- Evite sessões muito longas (100+ mensagens)

### 3. Resumos Automáticos
- Os resumos já economizam espaço
- Não é necessário salvar transcrições completas

### 4. Análises de Tela
- Análises de imagem ocupam mais espaço
- Use com moderação

---

## 🔍 Troubleshooting

### "Não consigo ver o tamanho do armazenamento"
- Abra o painel de histórico
- O tamanho aparece no topo
- Se não aparecer, recarregue a página

### "Limpei tudo mas ainda dá erro"
- Limpe o cache do navegador
- Feche e reabra o navegador
- Tente modo anônimo

### "Perdi minhas conversas!"
- Dados no localStorage são permanentes até serem limpos
- Não há backup automático
- Faça backups manuais de conversas importantes

### "Quero mais espaço"
- Considere usar IndexedDB (requer modificação do código)
- Use extensões de backup
- Exporte conversas importantes regularmente

---

## 📈 Comparação de Armazenamento

| Método | Limite | Persistência | Complexidade |
|--------|--------|--------------|--------------|
| **localStorage** (atual) | 5-10 MB | Permanente | Simples |
| **IndexedDB** | 50+ MB | Permanente | Média |
| **OPFS** | GB+ | Permanente | Alta |
| **Servidor** | Ilimitado | Depende | Alta |

---

## 🚀 Melhorias Futuras

Possíveis implementações para aumentar capacidade:

1. **Migração para IndexedDB**
   - Limite muito maior (50+ MB)
   - Melhor performance
   - Mais complexo

2. **Compressão de Dados**
   - Reduz tamanho em ~50-70%
   - Usa bibliotecas como pako.js
   - Pequeno overhead de CPU

3. **Paginação Lazy**
   - Carrega apenas sessões visíveis
   - Reduz uso de memória
   - Melhor UX

4. **Exportação Automática**
   - Backup em arquivo local
   - Sincronização com nuvem
   - Restauração fácil

---

## 📞 Suporte

Problemas com armazenamento?

1. Verifique este guia primeiro
2. Tente limpar dados antigos
3. Consulte o console do navegador (F12)
4. Abra uma issue no GitHub

---

<div align="center">

**Gerencie seu espaço com sabedoria!** 💾

</div>
