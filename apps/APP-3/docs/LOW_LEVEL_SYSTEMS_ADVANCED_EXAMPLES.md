# 🚀 LOW LEVEL SYSTEMS - EXEMPLOS AVANÇADOS

## Visão Geral

Este documento descreve os exemplos avançados adicionados ao manifesto Low Level Systems na versão 2.0.

---

## 1. Assembly x86_64

### Arquivo: `examples/advanced/assembly_x86_64.asm`

Implementação completa de funções em Assembly x86_64 usando convenção de chamada System V AMD64.

### Funções Implementadas

| Função | Descrição | Complexidade |
|--------|-----------|--------------|
| `add_numbers` | Soma dois números | Básica |
| `multiply_numbers` | Multiplica dois números | Básica |
| `factorial` | Calcula fatorial (recursivo) | Intermediária |
| `fibonacci` | Calcula Fibonacci (iterativo) | Intermediária |
| `memcpy_fast` | Cópia de memória otimizada | Avançada |
| `strlen_fast` | Comprimento de string otimizado | Avançada |
| `sum_array` | Soma elementos de array | Intermediária |
| `find_max` | Encontra máximo em array | Intermediária |
| `reverse_string` | Inverte string in-place | Avançada |

### Compilar e Executar

```bash
cd examples/advanced
make assembly
make run-assembly
```

### Saída Esperada

```
╔════════════════════════════════════════════════════════════════╗
║     ASSEMBLY x86_64 DEMONSTRATION                             ║
╚════════════════════════════════════════════════════════════════╝

[TEST] add_numbers(10, 20) = 30 ✓
[TEST] multiply_numbers(7, 8) = 56 ✓
[TEST] factorial(10) = 3628800 ✓
[TEST] fibonacci(20) = 6765 ✓
...
```

---

## 2. SIMD (SSE/AVX/FMA)

### Arquivo: `examples/advanced/simd_avx_example.c`

Exemplos de processamento vetorial usando instruções SIMD para máxima performance.

### Funções Implementadas

| Função | Descrição | Speedup |
|--------|-----------|---------|
| `array_add_avx` | Soma de arrays (8 floats/ciclo) | ~8x |
| `dot_product_fma` | Produto escalar com FMA | ~8x |
| `matrix_multiply_avx` | Multiplicação de matriz 4x4 | ~4x |
| `array_search_simd` | Busca em array | ~8x |
| `sum_reduction_avx` | Soma de todos elementos | ~8x |
| `vector_normalize_avx` | Normalização de vetor | ~8x |

### Requisitos

- CPU com suporte a AVX2 e FMA
- GCC com flags `-mavx2 -mfma`

### Compilar e Executar

```bash
cd examples/advanced
make simd
make run-simd
```

### Verificar Suporte SIMD

```bash
cat /proc/cpuinfo | grep -E "sse|avx|fma"
```

---

## 3. Linux Kernel Module

### Arquivo: `examples/advanced/linux_kernel_module.c`

Driver de dispositivo de caractere completo para Linux kernel.

### Funcionalidades

- **open/close**: Controle de acesso ao dispositivo
- **read/write**: Leitura e escrita de dados
- **ioctl**: Comandos de controle
- **Mutex**: Proteção contra race conditions
- **Device class**: Criação automática em `/dev/`
- **Sysfs**: Atributos exportados

### Requisitos

```bash
# Instalar headers do kernel
sudo apt-get install linux-headers-$(uname -r)
```

### Compilar e Carregar

```bash
cd examples/advanced
make kernel
sudo insmod lowlevel_device.ko
```

### Testar

```bash
# Verificar se carregou
lsmod | grep lowlevel

# Ver mensagens do kernel
dmesg | tail

# Testar escrita/leitura
echo "Hello Kernel" | sudo tee /dev/lowlevel_device
sudo cat /dev/lowlevel_device
```

### Descarregar

```bash
sudo rmmod lowlevel_device
```

---

## 4. FreeRTOS

### Arquivo: `examples/advanced/freertos_example.c`

Sistema embarcado completo com múltiplas tasks, filas, semáforos e timers.

### Componentes

| Componente | Descrição |
|------------|-----------|
| **Tasks** | Sensor, Processing, Communication, Monitor |
| **Queues** | Comunicação entre tasks |
| **Semaphores** | Sincronização binária |
| **Mutexes** | Proteção de recursos compartilhados |
| **Timers** | Execução periódica |
| **Event Groups** | Sincronização de eventos |

### Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREERTOS SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Sensor Task │───▶│   Queue     │───▶│ Process Task│         │
│  │ (Priority 3)│    │ (10 items)  │    │ (Priority 2)│         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                               │                 │
│                                               ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Comm Task   │◀───│   Mutex     │◀───│ Shared Data │         │
│  │ (Priority 1)│    │ (Protection)│    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐                            │
│  │ Timer       │───▶│ Event Group │                            │
│  │ (1 second)  │    │ (Sync)      │                            │
│  └─────────────┘    └─────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Plataformas Suportadas

- **ESP32**: Use ESP-IDF
- **STM32**: Use STM32CubeIDE
- **POSIX Simulator**: Para testes em Linux

### Compilar (ESP32)

```bash
idf.py build
idf.py flash
idf.py monitor
```

---

## Build System

### Makefile Avançado

```bash
cd examples/advanced

# Ver ajuda
make help

# Compilar tudo (exceto kernel e freertos)
make all

# Targets individuais
make assembly      # Assembly x86_64
make simd          # SIMD SSE/AVX
make kernel        # Linux Kernel Module
make freertos      # Instruções FreeRTOS

# Executar
make run-assembly
make run-simd

# Limpar
make clean

# Informações do sistema
make info
```

---

## Checklist de Verificação

### Assembly
- [ ] NASM instalado (`nasm --version`)
- [ ] GCC instalado (`gcc --version`)
- [ ] Arquitetura x86_64 (`uname -m`)

### SIMD
- [ ] CPU suporta AVX2 (`grep avx2 /proc/cpuinfo`)
- [ ] CPU suporta FMA (`grep fma /proc/cpuinfo`)
- [ ] GCC >= 4.9

### Kernel Module
- [ ] Headers do kernel instalados
- [ ] Permissões de root
- [ ] Kernel >= 4.0

### FreeRTOS
- [ ] SDK da plataforma instalado
- [ ] Toolchain configurado
- [ ] Hardware disponível (ou simulador)

---

## Referências

### Assembly x86_64
- [Intel® 64 and IA-32 Architectures Software Developer's Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 ABI](https://refspecs.linuxbase.org/elf/x86_64-abi-0.99.pdf)

### SIMD
- [Intel Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html)
- [AVX Programming Reference](https://www.intel.com/content/dam/develop/external/us/en/documents/36945)

### Linux Kernel
- [Linux Device Drivers, 3rd Edition](https://lwn.net/Kernel/LDD3/)
- [Kernel Documentation](https://www.kernel.org/doc/html/latest/)

### FreeRTOS
- [FreeRTOS Documentation](https://www.freertos.org/Documentation/RTOS_book.html)
- [FreeRTOS API Reference](https://www.freertos.org/a00106.html)

---

**Versão:** 2.0.0
**Data:** 2025-12-11
**Status:** ✅ Completo
