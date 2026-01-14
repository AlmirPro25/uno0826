# ⚙️ LOW LEVEL SYSTEMS - QUICK REFERENCE

## 🚀 COMEÇAR RÁPIDO

### Compilar e Executar
```bash
cd examples
make -f Makefile.lowlevel run
```

### Com Docker
```bash
docker build -f Dockerfile.lowlevel -t lowlevel-demo .
docker run lowlevel-demo
```

### Debug com GDB
```bash
make -f Makefile.lowlevel debug
```

### Verificar Memory Leaks
```bash
make -f Makefile.lowlevel valgrind
```

---

## 📚 REFERÊNCIA RÁPIDA DE COMANDOS

### GCC Flags Essenciais
```bash
-Wall -Wextra          # Todos os warnings
-O2 / -O3              # Otimização
-g                     # Debug symbols
-fPIC                  # Position Independent Code
-fsanitize=address     # AddressSanitizer
-fsanitize=undefined   # UndefinedBehaviorSanitizer
-std=c11 / -std=c17    # Padrão C
-std=c++20             # Padrão C++
```

### GDB Comandos Essenciais
```gdb
break main             # Breakpoint
run                    # Executar
step                   # Próxima linha (entra em funções)
next                   # Próxima linha (pula funções)
continue               # Continuar
print var              # Imprimir variável
backtrace              # Stack trace
info registers         # Registradores
disassemble main       # Disassembly
```

### Valgrind
```bash
valgrind --leak-check=full ./app
valgrind --tool=callgrind ./app
valgrind --tool=cachegrind ./app
```

### Perf (Performance Profiling)
```bash
perf record -g ./app
perf report
perf stat ./app
```

---

## 🔧 PADRÕES COMUNS

### Alocação Segura de Memória
```c
// ✅ CERTO
int *arr = malloc(sizeof(int) * 10);
if (!arr) {
    perror("malloc failed");
    return -1;
}
// ... usar arr ...
free(arr);
arr = NULL;
```

### Proteção contra Buffer Overflow
```c
// ✅ CERTO
void safe_copy(char *dest, size_t dest_size, const char *src) {
    if (!dest || !src || dest_size == 0) return;
    
    size_t src_len = strlen(src);
    if (src_len >= dest_size) return;  // Erro
    
    memcpy(dest, src, src_len + 1);
}
```

### Acesso a Hardware (Memory-Mapped I/O)
```c
// Registrador em endereço fixo
volatile uint32_t *device_reg = (volatile uint32_t *)0x80000000;

// Leitura
uint32_t value = *device_reg;

// Escrita
*device_reg = 0x12345678;
```

### Atomicidade
```c
#include <stdatomic.h>

_Atomic(uint32_t) counter = 0;

// Operação atômica
atomic_fetch_add(&counter, 1);
```

---

## 📊 CHECKLIST PRÉ-DEPLOY

- [ ] Compilação sem warnings?
- [ ] Valgrind sem memory leaks?
- [ ] GDB consegue debugar?
- [ ] Performance dentro do esperado?
- [ ] Sem race conditions?
- [ ] Proteção contra buffer overflow?
- [ ] Símbolos de debug inclusos?
- [ ] Containerizado com Docker?

---

## 🎯 EXEMPLOS PRÁTICOS

### Exemplo 1: Kernel Simples
```c
// Ver: examples/low-level-systems-example.c
// Seção: PARTE 1: KERNEL SIMPLES COM SCHEDULER
```

### Exemplo 2: Driver UART
```c
// Ver: examples/low-level-systems-example.c
// Seção: PARTE 2: DRIVER UART
```

### Exemplo 3: Gerenciador de Memória
```c
// Ver: examples/low-level-systems-example.c
// Seção: PARTE 3: GERENCIADOR DE MEMÓRIA
```

### Exemplo 4: Proteção contra Buffer Overflow
```c
// Ver: examples/low-level-systems-example.c
// Seção: PARTE 4: PROTEÇÃO CONTRA BUFFER OVERFLOW
```

---

## 🔐 SEGURANÇA

### Stack Canary
```c
#define CANARY_VALUE 0xDEADBEEF

typedef struct {
    uint32_t canary;
    char buffer[64];
} ProtectedBuffer;
```

### ASLR (Address Space Layout Randomization)
```bash
# Compilar com ASLR
gcc -fPIE -pie -o app main.c

# Verificar ASLR
cat /proc/sys/kernel/randomize_va_space
```

### Stack Protector
```bash
gcc -fstack-protector-strong -o app main.c
```

---

## 📈 PERFORMANCE

### Inline Functions
```c
static inline int fast_add(int a, int b) {
    return a + b;
}
```

### SIMD (SSE/AVX)
```c
#include <immintrin.h>

__m256i v = _mm256_set1_epi32(1);
v = _mm256_add_epi32(v, v);
```

### Profiling
```bash
# Registrar eventos
perf record -g ./app

# Gerar flame graph
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

---

## 🐛 DEBUGGING

### Imprimir Registradores
```c
#include <stdio.h>

void print_registers() {
    register uint64_t rax asm("rax");
    register uint64_t rbx asm("rbx");
    printf("RAX: 0x%lx, RBX: 0x%lx\n", rax, rbx);
}
```

### Disassembly
```bash
objdump -d ./app | less
```

### Símbolos
```bash
nm ./app
readelf -s ./app
```

---

## 📚 RECURSOS

### Documentação
- Intel x86-64 ISA Manual
- ARM Architecture Reference Manual
- Linux Kernel Documentation
- POSIX Standard

### Livros
- "The C Programming Language" (K&R)
- "Computer Systems: A Programmer's Perspective"
- "Operating Systems: Three Easy Pieces"

### Online
- Stack Overflow (tag: c, assembly)
- GitHub (kernel, driver projects)
- Linux Kernel Mailing List

---

## 🎓 PRÓXIMOS PASSOS

1. **Estudar Assembly** - Entender x86-64 ou ARM64
2. **Implementar Driver** - Criar driver UART real
3. **Otimizar Performance** - Usar SIMD e profiling
4. **Estudar Kernels** - Linux kernel source
5. **Contribuir** - Enviar patches para projetos open source

---

*"Cada ciclo de CPU é uma oportunidade. Cada byte é uma responsabilidade."*

— Mestre do Metal
