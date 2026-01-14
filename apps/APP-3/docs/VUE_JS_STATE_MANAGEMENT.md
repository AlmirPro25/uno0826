# Vue.js para State Management - Guia Completo

## 🎯 Por Que Usar Vue.js?

### Problema com Vanilla JS (State Management Manual)

```javascript
// ❌ VANILLA JS - Muito trabalho manual
let state = {
  transactions: [],
  balance: 0
};

function addTransaction(tx) {
  state.transactions.push(tx);
  state.balance = calculateBalance(); // Recalcular manualmente
  
  // Atualizar DOM manualmente
  document.getElementById('balance').textContent = state.balance;
  renderTransactionList(); // Chamar render manualmente
  updateChart(); // Atualizar gráfico manualmente
}

function renderTransactionList() {
  const container = document.getElementById('transactions');
  container.innerHTML = ''; // Limpar tudo
  
  // Recriar tudo do zero
  state.transactions.forEach(tx => {
    const element = document.createElement('div');
    element.textContent = tx.description;
    container.appendChild(element);
  });
}
```

**Problemas:**
- ❌ Precisa chamar `render()` manualmente toda vez
- ❌ Código verboso e repetitivo
- ❌ Fácil esquecer de atualizar alguma parte do DOM
- ❌ Difícil manter sincronizado
- ❌ Performance ruim (recria tudo do zero)

### Solução com Vue.js (Reatividade Automática)

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">
  <!-- ✅ VUE.JS - Atualiza automaticamente -->
  <p>Balanço: {{ balance }}</p>
  
  <div v-for="tx in transactions" :key="tx.id">
    {{ tx.description }}
  </div>
  
  <button @click="addTransaction">Adicionar</button>
</div>

<script>
  const { createApp } = Vue;
  
  createApp({
    data() {
      return {
        transactions: []
      }
    },
    
    computed: {
      balance() {
        // Recalcula AUTOMATICAMENTE quando transactions muda
        return this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      }
    },
    
    methods: {
      addTransaction() {
        this.transactions.push({ id: Date.now(), amount: 100 });
        // DOM atualiza AUTOMATICAMENTE! 🎉
        // Não precisa chamar render()!
      }
    }
  }).mount('#app');
</script>
```

**Vantagens:**
- ✅ DOM atualiza automaticamente
- ✅ Código limpo e declarativo
- ✅ Computed properties recalculam sozinhas
- ✅ Performance otimizada (Virtual DOM)
- ✅ Fácil de manter e escalar

## 📚 Conceitos Fundamentais

### 1. Data (Estado Reativo)

```javascript
data() {
  return {
    // Tudo aqui é REATIVO
    count: 0,
    message: 'Olá',
    items: [],
    user: { name: 'João', age: 25 }
  }
}
```

Quando você muda `this.count++`, o DOM atualiza automaticamente!

### 2. Computed Properties (Valores Calculados)

```javascript
computed: {
  // Recalcula automaticamente quando dependencies mudam
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  
  totalPrice() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },
  
  filteredItems() {
    return this.items.filter(item => item.active);
  }
}
```

**Vantagens:**
- ✅ Cacheadas (só recalcula quando necessário)
- ✅ Mais eficiente que methods
- ✅ Código mais limpo

### 3. Methods (Funções)

```javascript
methods: {
  addItem(item) {
    this.items.push(item);
  },
  
  deleteItem(id) {
    this.items = this.items.filter(item => item.id !== id);
  },
  
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
```

### 4. Watchers (Observadores)

```javascript
watch: {
  // Executar quando searchQuery mudar
  searchQuery(newValue, oldValue) {
    console.log(`Mudou de ${oldValue} para ${newValue}`);
    this.performSearch(newValue);
  },
  
  // Watch profundo (objetos aninhados)
  user: {
    handler(newValue) {
      this.saveToStorage();
    },
    deep: true
  }
}
```

### 5. Lifecycle Hooks (Ciclo de Vida)

```javascript
created() {
  // Executar quando a instância for criada
  console.log('Vue criado!');
},

mounted() {
  // Executar quando o DOM estiver pronto
  this.loadData();
  this.initChart();
},

updated() {
  // Executar quando o DOM for atualizado
  console.log('DOM atualizado!');
},

unmounted() {
  // Executar quando o componente for destruído
  this.cleanup();
}
```

## 🎨 Diretivas Essenciais

### v-if / v-else / v-show (Renderização Condicional)

```html
<!-- v-if: Remove/adiciona do DOM -->
<div v-if="isLoggedIn">
  Bem-vindo!
</div>
<div v-else>
  Faça login
</div>

<!-- v-show: Apenas esconde (display: none) -->
<div v-show="isVisible">
  Conteúdo
</div>
```

### v-for (Loops)

```html
<!-- Array simples -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>

<!-- Com índice -->
<div v-for="(item, index) in items" :key="item.id">
  {{ index + 1 }}. {{ item.name }}
</div>

<!-- Objeto -->
<div v-for="(value, key) in user" :key="key">
  {{ key }}: {{ value }}
</div>
```

### v-model (Two-Way Data Binding)

```html
<!-- Input text -->
<input v-model="message" placeholder="Digite algo">
<p>Você digitou: {{ message }}</p>

<!-- Checkbox -->
<input type="checkbox" v-model="checked">
<p>Marcado: {{ checked }}</p>

<!-- Select -->
<select v-model="selected">
  <option value="A">Opção A</option>
  <option value="B">Opção B</option>
</select>

<!-- Number modifier -->
<input v-model.number="age" type="number">

<!-- Trim modifier -->
<input v-model.trim="message">
```

### v-bind (:) (Bind Atributos)

```html
<!-- Bind atributo -->
<img :src="imageUrl" :alt="imageAlt">

<!-- Bind class -->
<div :class="{ active: isActive, 'text-red': hasError }">
  Conteúdo
</div>

<!-- Bind style -->
<div :style="{ color: textColor, fontSize: fontSize + 'px' }">
  Texto
</div>

<!-- Shorthand -->
<a :href="url">Link</a>
```

### v-on (@) (Event Listeners)

```html
<!-- Click -->
<button @click="handleClick">Clique</button>

<!-- Com parâmetro -->
<button @click="deleteItem(item.id)">Deletar</button>

<!-- Modificadores -->
<form @submit.prevent="handleSubmit">
  <input @keyup.enter="search">
</form>

<!-- Múltiplos eventos -->
<input @input="handleInput" @blur="handleBlur">
```

## 💡 Exemplo Completo: App de Tarefas

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app" class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Lista de Tarefas</h1>
    
    <!-- Estatísticas -->
    <div class="bg-blue-50 p-4 rounded-lg mb-4">
      <p>Total: {{ tasks.length }}</p>
      <p>Concluídas: {{ completedCount }} ({{ completionPercentage }}%)</p>
      <p>Pendentes: {{ pendingCount }}</p>
    </div>
    
    <!-- Formulário -->
    <form @submit.prevent="addTask" class="mb-4">
      <div class="flex gap-2">
        <input 
          v-model="newTaskText" 
          placeholder="Nova tarefa"
          class="flex-1 p-2 border rounded"
          required>
        <button 
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded">
          Adicionar
        </button>
      </div>
    </form>
    
    <!-- Filtros -->
    <div class="flex gap-2 mb-4">
      <button 
        @click="filter = 'all'"
        :class="{ 'bg-blue-600 text-white': filter === 'all' }"
        class="px-3 py-1 rounded border">
        Todas
      </button>
      <button 
        @click="filter = 'active'"
        :class="{ 'bg-blue-600 text-white': filter === 'active' }"
        class="px-3 py-1 rounded border">
        Ativas
      </button>
      <button 
        @click="filter = 'completed'"
        :class="{ 'bg-blue-600 text-white': filter === 'completed' }"
        class="px-3 py-1 rounded border">
        Concluídas
      </button>
    </div>
    
    <!-- Lista de Tarefas -->
    <div class="space-y-2">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="flex items-center gap-2 p-3 bg-white rounded-lg shadow">
        
        <input 
          type="checkbox" 
          v-model="task.completed"
          @change="saveToStorage"
          class="w-5 h-5">
        
        <span 
          :class="{ 'line-through text-gray-400': task.completed }"
          class="flex-1">
          {{ task.text }}
        </span>
        
        <button 
          @click="deleteTask(task.id)"
          class="text-red-600 hover:text-red-800">
          🗑️
        </button>
      </div>
      
      <p v-if="filteredTasks.length === 0" 
         class="text-center text-gray-500 py-8">
        Nenhuma tarefa {{ filter === 'all' ? '' : filter === 'active' ? 'ativa' : 'concluída' }}
      </p>
    </div>
    
    <!-- Ações em massa -->
    <div class="mt-4 flex gap-2">
      <button 
        @click="completeAll"
        class="flex-1 bg-green-600 text-white py-2 rounded">
        Completar Todas
      </button>
      <button 
        @click="clearCompleted"
        class="flex-1 bg-red-600 text-white py-2 rounded">
        Limpar Concluídas
      </button>
    </div>
  </div>
  
  <script>
    const { createApp } = Vue;
    
    createApp({
      data() {
        return {
          tasks: [],
          newTaskText: '',
          filter: 'all' // 'all', 'active', 'completed'
        }
      },
      
      computed: {
        filteredTasks() {
          if (this.filter === 'active') {
            return this.tasks.filter(task => !task.completed);
          }
          if (this.filter === 'completed') {
            return this.tasks.filter(task => task.completed);
          }
          return this.tasks;
        },
        
        completedCount() {
          return this.tasks.filter(task => task.completed).length;
        },
        
        pendingCount() {
          return this.tasks.filter(task => !task.completed).length;
        },
        
        completionPercentage() {
          if (this.tasks.length === 0) return 0;
          return Math.round((this.completedCount / this.tasks.length) * 100);
        }
      },
      
      methods: {
        addTask() {
          if (this.newTaskText.trim()) {
            this.tasks.push({
              id: Date.now(),
              text: this.newTaskText,
              completed: false,
              createdAt: new Date().toISOString()
            });
            this.newTaskText = '';
            this.saveToStorage();
          }
        },
        
        deleteTask(id) {
          this.tasks = this.tasks.filter(task => task.id !== id);
          this.saveToStorage();
        },
        
        completeAll() {
          this.tasks.forEach(task => task.completed = true);
          this.saveToStorage();
        },
        
        clearCompleted() {
          this.tasks = this.tasks.filter(task => !task.completed);
          this.saveToStorage();
        },
        
        saveToStorage() {
          localStorage.setItem('vue-tasks', JSON.stringify(this.tasks));
        },
        
        loadFromStorage() {
          const saved = localStorage.getItem('vue-tasks');
          if (saved) {
            this.tasks = JSON.parse(saved);
          }
        }
      },
      
      mounted() {
        this.loadFromStorage();
      }
    }).mount('#app');
  </script>
</body>
</html>
```

## 🎯 Quando Usar Vue.js vs Vanilla JS

### ✅ USE VUE.JS para:
- Apps de gerenciamento (tarefas, finanças, inventário)
- Dashboards com dados dinâmicos
- Formulários complexos com validação
- SPAs (Single Page Applications)
- Apps com muito estado que muda frequentemente
- Quando precisa de computed properties
- Quando quer código mais limpo e manutenível

### ❌ USE VANILLA JS para:
- Landing pages estáticas
- Sites institucionais simples
- Jogos (Canvas/WebGL)
- Animações pesadas
- Quando performance é CRÍTICA
- Quando o app é muito simples

## 📊 Comparação

| Aspecto | Vanilla JS | Vue.js |
|---------|-----------|--------|
| **Reatividade** | Manual | Automática |
| **Código** | Verboso | Limpo |
| **Performance** | Máxima | Excelente |
| **Manutenção** | Difícil | Fácil |
| **Curva de Aprendizado** | Baixa | Baixa |
| **Tamanho** | 0kb | ~30kb |
| **Build** | Não precisa | Não precisa (CDN) |

## 🚀 Próximos Passos

1. **Componentes:** Dividir o app em componentes reutilizáveis
2. **Vue Router:** Navegação entre páginas
3. **Pinia:** State management avançado
4. **Composition API:** Sintaxe alternativa mais moderna
5. **Build Tools:** Vite para apps maiores

---

**Conclusão:** Vue.js é perfeito para apps com estado complexo. Use via CDN para simplicidade máxima!
