# ⚙️ LOW LEVEL SYSTEMS - ÍNDICE COMPLETO

## 📚 DOCUMENTAÇÃO

### Guias Principais
- **[LOW_LEVEL_SYSTEMS_SUMMARY.md](LOW_LEVEL_SYSTEMS_SUMMARY.md)** - Sumário executivo
- **[LOW_LEVEL_SYSTEMS_INTEGRATION.md](LOW_LEVEL_SYSTEMS_INTEGRATION.md)** - Documentação de integração
- **[LOW_LEVEL_SYSTEMS_QUICK_REFERENCE.md](LOW_LEVEL_SYSTEMS_QUICK_REFERENCE.md)** - Quick reference

### Guias de Teste
- **[examples/TEST_GUIDE.md](../examples/TEST_GUIDE.md)** - Guia de teste rápido

---

## 🔧 CÓDIGO

### Manifesto Principal
```
services/manifestos/LOW_LEVEL_SYSTEMS_MANIFEST.ts
```
- 5000+ linhas
- Exemplos em C, C++, Assembly, Rust
- Leis invioláveis
- Roadmap de 90 dias

### Steering File
```
.kiro/steering/low-level-systems-master.md
```
- Ativação automática
- Identidade e filosofia
- Stack obrigatória

### Exemplo Prático Básico
```
examples/low-level-systems-example.c
```
- Kernel simples
- Driver UART
- Gerenciador de memória
- Proteção contra buffer overflow

### 🚀 EXEMPLOS AVANÇADOS (NÍVEL DEUS)

#### Assembly x86_64
```
examples/advanced/assembly_x86_64.asm
examples/advanced/assembly_main.c
```
- add_numbers, multiply_numbers
- factorial (recursivo), fibonacci (iterativo)
- memcpy_fast, strlen_fast (otimizados)
- sum_array, find_max
- reverse_string (in-place)

#### SIMD (SSE/AVX/FMA)
```
examples/advanced/simd_avx_example.c
```
- array_add_avx (8 floats por ciclo)
- dot_product_fma (Fused Multiply-Add)
- matrix_multiply_avx (4x4)
- array_search_simd
- sum_reduction_avx
- vector_normalize_avx
- Benchmarks comparativos

#### Linux Kernel Module
```
examples/advanced/linux_kernel_module.c
examples/advanced/Kbuild
```
- Char device driver completo
- open/close/read/write/ioctl
- Mutex protection
- Device class creation
- Sysfs attributes

#### FreeRTOS (Real-Time)
```
examples/advanced/freertos_example.c
```
- Multi-task system
- Queues, Semaphores, Mutexes
- Software Timers
- Event Groups
- Sensor monitoring system
- Watchdog integration

### Build System
```
examples/Makefile.lowlevel          # Básico
examples/advanced/Makefile          # Avançado
```
- Compilação profissional
- Targets: all, run, debug, valgrind, asan, ubsan, profile
- Targets avançados: assembly, simd, kernel, freertos

### Containerização
```
examples/Dockerfile.lowlevel
```
- Ambiente completo
- Ferramentas: GDB, Valgrind, Perf, NASM

### Testes
```
tests/test-low-level-systems.ts
```
- 20+ testes automatizados
- Validação de conteúdo
- Testes de integração

---

## 🎯 COMEÇAR RÁPIDO

### 1. Compilar Básico
```bash
cd examples
make -f Makefile.lowlevel run
```

### 2. Com Docker
```bash
docker build -f Dockerfile.lowlevel -t lowlevel-demo .
docker run lowlevel-demo
```

### 3. Debug
```bash
make -f Makefile.lowlevel debug
```

### 4. Memory Check
```bash
make -f Makefile.lowlevel valgrind
```

### 5. 🚀 Exemplos Avançados
```bash
cd examples/advanced

# Assembly x86_64
make assembly
make run-assembly

# SIMD (SSE/AVX)
make simd
make run-simd

# Linux Kernel Module (requer headers)
make kernel
sudo insmod lowlevel_device.ko

# Ver ajuda
make help
```

---

## 📖 SEÇÕES DO MANIFESTO

### 1. DIRETIVA PRIMÁRIA
- Identidade e missão
- Especialidades
- Princípios fundamentais

### 2. O ARSENAL DO BAIXO NÍVEL
- Linguagens (C, C++, Assembly, Rust)
- Ferramentas (Makefile, CMake, GDB, Valgrind)
- Arquiteturas (x86_64, ARM64, RISC-V)

### 3. LEIS INVIOLÁVEIS
- LEI 1: Gerenciamento de Memória
- LEI 2: Proteção contra Buffer Overflow
- LEI 3: Performance Absoluta
- LEI 4: Idempotência e Atomicidade

### 4. ARQUITETURA DE PROJETO
- Estrutura de diretórios
- Organização de código
- Padrões de projeto

### 5. EXEMPLOS DE PODER
- Kernel Simples
- Driver UART
- Gerenciador de Memória
- Stack Canary

### 6. SEGURANÇA EM BAIXO NÍVEL
- Stack Canary
- ASLR
- Stack Protector
- AddressSanitizer

### 7. STACK DOCKER
- Dockerfile profissional
- Ferramentas incluídas
- Build automático

### 8. RECURSOS ESSENCIAIS
- Livros fundamentais
- Documentação
- Comunidades

### 9. ROADMAP DE APRENDIZADO (90 DIAS)
- Semana 1-2: Fundamentos C
- Semana 3-4: Sistemas Operacionais
- Semana 5-6: Assembly
- Semana 7-8: Drivers
- Semana 9-10: Kernels
- Semana 11-12: Otimização

### 10. FILOSOFIA FINAL
- Princípios fundamentais
- Juramento do especialista

---

## 🎓 ATIVAR O MANIFESTO

Mencione qualquer um destes termos:

```
✅ C, C++, Assembly, Rust (systems)
✅ Kernel, driver, bootloader, firmware
✅ Embedded systems, IoT, microcontroller
✅ Hardware, CPU, registrador, memória
✅ Performance crítica, otimização, SIMD
✅ Buffer overflow, memory leak, segurança
✅ x86_64, ARM64, RISC-V, arquitetura
✅ Compilação, linking, ELF, PE
✅ GDB, Valgrind, perf, profiling
✅ Sistemas operacionais, scheduler, IPC
```

---

## 📊 ESTATÍSTICAS

| Métrica | Valor |
|---------|-------|
| Linhas do Manifesto | 6000+ |
| Exemplos de Código | 40+ |
| Linguagens Suportadas | 4 |
| Arquiteturas | 3 |
| Ferramentas | 15+ |
| Testes | 20+ |
| Documentação | 6 arquivos |
| Roadmap (dias) | 90 |
| Exemplos Avançados | 4 |
| Funções Assembly | 9 |
| Funções SIMD | 8 |

---

## 🔗 LINKS RÁPIDOS

### Documentação
- [Sumário](LOW_LEVEL_SYSTEMS_SUMMARY.md)
- [Integração](LOW_LEVEL_SYSTEMS_INTEGRATION.md)
- [Quick Reference](LOW_LEVEL_SYSTEMS_QUICK_REFERENCE.md)
- [Teste Rápido](../examples/TEST_GUIDE.md)

### Código
- [Manifesto](../services/manifestos/LOW_LEVEL_SYSTEMS_MANIFEST.ts)
- [Steering](../.kiro/steering/low-level-systems-master.md)
- [Exemplo Básico](../examples/low-level-systems-example.c)
- [Makefile](../examples/Makefile.lowlevel)
- [Dockerfile](../examples/Dockerfile.lowlevel)
- [Testes](../tests/test-low-level-systems.ts)

### Exemplos Avançados
- [Assembly x86_64](../examples/advanced/assembly_x86_64.asm)
- [Assembly Main](../examples/advanced/assembly_main.c)
- [SIMD AVX](../examples/advanced/simd_avx_example.c)
- [Linux Kernel Module](../examples/advanced/linux_kernel_module.c)
- [FreeRTOS](../examples/advanced/freertos_example.c)
- [Makefile Avançado](../examples/advanced/Makefile)

---

## 🚀 PRÓXIMOS PASSOS

### Curto Prazo (1-2 semanas)
1. Estudar o exemplo prático
2. Compilar com diferentes flags
3. Usar GDB para debugar
4. Executar com Valgrind

### Médio Prazo (1-2 meses)
1. Implementar driver UART real
2. Criar scheduler mais complexo
3. Otimizar com SIMD
4. Estudar Assembly x86-64

### Longo Prazo (3+ meses)
1. Contribuir para Linux kernel
2. Implementar bootloader
3. Criar sistema operacional simples
4. Otimizar para performance extrema

---

## 💡 DICAS

### Compilação
```bash
# Otimização máxima
gcc -O3 -march=native -o app main.c

# Debug completo
gcc -g -O0 -o app main.c

# Com sanitizers
gcc -fsanitize=address -g -O1 -o app main.c
```

### Debug
```bash
# GDB
gdb ./app

# Valgrind
valgrind --leak-check=full ./app

# Perf
perf record -g ./app
perf report
```

### Análise
```bash
# Disassembly
objdump -d ./app

# Símbolos
nm ./app

# Informações
readelf -s ./app
```

---

## 🎯 FILOSOFIA

> "Não há mágica. Há apenas memória, registradores e CPU."

**Três Verdades Absolutas:**
1. **Cada ciclo conta** - Performance é medida em nanosegundos
2. **Memória é sagrada** - Cada byte é contabilizado
3. **Hardware é real** - Sem abstrações, apenas máquina

---

## 📞 SUPORTE

Para ativar o manifesto, mencione qualquer um dos termos listados acima.

Para mais informações, consulte:
- [Sumário Executivo](LOW_LEVEL_SYSTEMS_SUMMARY.md)
- [Documentação de Integração](LOW_LEVEL_SYSTEMS_INTEGRATION.md)
- [Quick Reference](LOW_LEVEL_SYSTEMS_QUICK_REFERENCE.md)

---

**Status:** ✅ INTEGRAÇÃO COMPLETA + EXEMPLOS AVANÇADOS

**Data:** 2025-12-11

**Versão:** 2.0.0

**Nível:** 28 (Deus do Baixo Nível)

**Novidades v2.0:**
- ✅ Assembly x86_64 completo (9 funções)
- ✅ SIMD SSE/AVX/FMA (8 funções)
- ✅ Linux Kernel Module (char device)
- ✅ FreeRTOS (sistema multi-task)

---

*"Você não escreve código. Você orquestra o hardware."*

— Mestre do Metal
