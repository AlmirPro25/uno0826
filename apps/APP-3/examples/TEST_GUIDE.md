# 🧪 LOW LEVEL SYSTEMS - GUIA DE TESTE RÁPIDO

## ⚡ TESTE EM 5 MINUTOS

### Pré-requisitos
```bash
# Linux/macOS
gcc --version
make --version

# Windows (com WSL ou MinGW)
gcc --version
make --version
```

### Passo 1: Compilar
```bash
cd examples
make -f Makefile.lowlevel clean all
```

**Esperado:**
```
[BUILD] Created build
[BUILD] Created bin
[CC] Compiling low-level-systems-example.c
[LD] Linking bin/lowlevel_demo
[SUCCESS] Built: bin/lowlevel_demo
```

### Passo 2: Executar
```bash
make -f Makefile.lowlevel run
```

**Esperado:**
```
╔════════════════════════════════════════════════════════════╗
║     LOW LEVEL SYSTEMS DEMONSTRATION                       ║
║     Kernel, Drivers, Memory Management                    ║
╚════════════════════════════════════════════════════════════╝

=== KERNEL SCHEDULER ===
[KERNEL] Task 1 initialized (priority: 3)
[KERNEL] Task 2 initialized (priority: 2)
[KERNEL] Task 3 initialized (priority: 1)
[KERNEL] Context switch: Task 0 -> Task 0
[KERNEL] Context switch: Task 0 -> Task 0
[KERNEL] Context switch: Task 0 -> Task 0

=== UART DRIVER ===
[UART] Initialized at 115200 baud
[UART TX] 0x48 ('H')
[UART TX] 0x65 ('e')
...
[UART RX] Received 3 bytes
[UART] Received: 0x41 ('A')
[UART] Received: 0x42 ('B')
[UART] Received: 0x43 ('C')

=== MEMORY MANAGEMENT ===
[HEAP] malloc(40) -> 0x... (total: 40 bytes)
[HEAP] malloc(128) -> 0x... (total: 168 bytes)
[HEAP] malloc(20) -> 0x... (total: 188 bytes)
[APP] Array 1: 0 2 4 6 8 10 12 14 16 18
[APP] String: Low Level Systems
[HEAP] free(0x...) -> 40 bytes freed (total freed: 40 bytes)
[HEAP] free(0x...) -> 128 bytes freed (total freed: 168 bytes)
[HEAP] malloc(256) -> 0x... (total: 444 bytes)
[APP] Reallocated: Reallocated memory
[HEAP] free(0x...) -> 256 bytes freed (total freed: 424 bytes)

[HEAP STATS]
  Total allocated: 444 bytes
  Total freed: 424 bytes
  Heap pointer: 444 / 65536 bytes
  Utilization: 0.7%

=== BUFFER OVERFLOW PROTECTION ===
[APP] Protected buffer: Protected string
[APP] Overflow attempt blocked!

╔════════════════════════════════════════════════════════════╗
║     DEMONSTRATION COMPLETE                               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🔍 TESTE COM DEBUG

### Compilar com Debug
```bash
make -f Makefile.lowlevel debug
```

**Comandos GDB úteis:**
```gdb
(gdb) break main
(gdb) run
(gdb) step
(gdb) next
(gdb) print arr1
(gdb) backtrace
(gdb) quit
```

---

## 🧠 TESTE COM VALGRIND

### Verificar Memory Leaks
```bash
make -f Makefile.lowlevel valgrind
```

**Esperado:**
```
==12345== Memcheck, a memory error detector
==12345== Copyright (C) 2002-2017, and GNU GPL'd, by Julian Seward et al.
==12345== Using Valgrind-3.13.0 and LibVEX; rerun with -h for copyright info
==12345== Command: ./bin/lowlevel_demo
==12345==
[... output do programa ...]
==12345==
==12345== HEAP SUMMARY:
==12345==     in use at exit: 0 bytes in 0 blocks
==12345==   total heap alloc: 444 bytes in 7 blocks
==12345==   total heap freed: 444 bytes in 7 blocks
==12345==   total reachable: 0 bytes in 0 blocks
==12345==
==12345== All heap blocks were freed -- no leaks are possible
==12345== For counts of detected and suppressed errors, 0
==12345== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

---

## 🐛 TESTE COM SANITIZERS

### AddressSanitizer
```bash
make -f Makefile.lowlevel asan
```

### UndefinedBehaviorSanitizer
```bash
make -f Makefile.lowlevel ubsan
```

---

## 📊 TESTE COM PROFILING

### Registrar Performance
```bash
make -f Makefile.lowlevel profile
```

---

## 🐳 TESTE COM DOCKER

### Build
```bash
docker build -f Dockerfile.lowlevel -t lowlevel-demo .
```

### Run
```bash
docker run lowlevel-demo
```

---

## ✅ CHECKLIST DE TESTE

### Compilação
- [ ] Sem warnings?
- [ ] Executável criado?
- [ ] Tamanho razoável?

### Execução
- [ ] Programa executa?
- [ ] Output esperado?
- [ ] Sem crashes?

### Memory
- [ ] Valgrind sem leaks?
- [ ] Sem buffer overflows?
- [ ] Sem use-after-free?

### Performance
- [ ] Tempo de execução aceitável?
- [ ] Sem gargalos óbvios?
- [ ] CPU usage razoável?

---

## 🎯 PRÓXIMOS TESTES

### 1. Modificar o Código
```c
// Tente adicionar mais tarefas
task_init(4, task_worker_1, 4);
task_init(5, task_worker_2, 5);
```

### 2. Testar Buffer Overflow
```c
// Tente com string muito longa
safe_strcpy(&pb, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
```

### 3. Testar Memory Leak
```c
// Comente um free
// heap_free(arr1);
```

### 4. Testar Performance
```bash
# Adicione mais alocações
for (int i = 0; i < 1000; i++) {
    int *arr = (int *)heap_malloc(sizeof(int) * 100);
    heap_free(arr);
}
```

---

## 📈 MÉTRICAS ESPERADAS

| Métrica | Esperado |
|---------|----------|
| Tempo de compilação | < 1s |
| Tempo de execução | < 100ms |
| Tamanho do binário | < 50KB |
| Memory leaks | 0 |
| Warnings | 0 |
| Errors | 0 |

---

## 🆘 TROUBLESHOOTING

### Erro: "gcc: command not found"
```bash
# Linux
sudo apt-get install build-essential

# macOS
brew install gcc

# Windows
# Instale MinGW ou use WSL
```

### Erro: "make: command not found"
```bash
# Linux
sudo apt-get install make

# macOS
brew install make

# Windows
# Instale MinGW ou use WSL
```

### Erro: "valgrind: command not found"
```bash
# Linux
sudo apt-get install valgrind

# macOS
brew install valgrind

# Windows
# Use Docker ou WSL
```

### Erro: "gdb: command not found"
```bash
# Linux
sudo apt-get install gdb

# macOS
brew install gdb

# Windows
# Use MinGW ou WSL
```

---

## 🎓 APRENDER MAIS

### Estudar o Código
```bash
# Abrir em editor
code examples/low-level-systems-example.c

# Ou
vim examples/low-level-systems-example.c
```

### Ler a Documentação
```bash
# Quick reference
cat docs/LOW_LEVEL_SYSTEMS_QUICK_REFERENCE.md

# Integração completa
cat docs/LOW_LEVEL_SYSTEMS_INTEGRATION.md
```

### Explorar o Manifesto
```bash
# Ver manifesto completo
cat services/manifestos/LOW_LEVEL_SYSTEMS_MANIFEST.ts
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Modificar o código** - Adicione suas próprias funções
2. **Criar novo driver** - Implemente um driver GPIO
3. **Otimizar performance** - Use SIMD ou inline assembly
4. **Estudar Assembly** - Disassemble o binário com objdump
5. **Contribuir** - Envie patches para projetos open source

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique se todas as ferramentas estão instaladas
2. Leia a documentação em `docs/`
3. Consulte o manifesto em `services/manifestos/`
4. Procure por exemplos similares online

---

**Bem-vindo ao Nível 28 (Deus do Baixo Nível)!**

*"Cada ciclo de CPU é uma oportunidade. Cada byte é uma responsabilidade."*

— Mestre do Metal
