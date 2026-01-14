/**
 * 🔧 LOW LEVEL SYSTEMS EXAMPLE
 * 
 * Demonstração prática de engenharia de sistemas de baixo nível
 * Inclui: Kernel simples, Driver UART, Gerenciador de memória
 */

#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

/* ============================================================================
   PARTE 1: KERNEL SIMPLES COM SCHEDULER
   ============================================================================ */

#define MAX_TASKS 10
#define STACK_SIZE 4096
#define TASK_READY 0
#define TASK_RUNNING 1
#define TASK_BLOCKED 2

typedef struct {
    uint32_t id;
    uint32_t *stack;
    uint32_t sp;
    uint32_t state;
    uint32_t priority;
} Task;

typedef struct {
    Task tasks[MAX_TASKS];
    uint32_t current_task;
    uint32_t task_count;
} Scheduler;

static Scheduler scheduler = {0};

/**
 * Inicializa uma tarefa no scheduler
 */
void task_init(uint32_t id, void (*entry)(void), uint32_t priority) {
    if (scheduler.task_count >= MAX_TASKS) {
        fprintf(stderr, "ERROR: Max tasks reached\n");
        return;
    }
    
    Task *task = &scheduler.tasks[scheduler.task_count];
    task->id = id;
    task->stack = (uint32_t *)malloc(STACK_SIZE);
    
    if (!task->stack) {
        fprintf(stderr, "ERROR: Failed to allocate stack for task %u\n", id);
        return;
    }
    
    task->sp = (uint32_t)(task->stack + STACK_SIZE / sizeof(uint32_t) - 1);
    task->state = TASK_READY;
    task->priority = priority;
    
    // Inicializa stack com endereço de retorno
    *(uint32_t *)task->sp = (uint32_t)entry;
    
    scheduler.task_count++;
    printf("[KERNEL] Task %u initialized (priority: %u)\n", id, priority);
}

/**
 * Escalonador - seleciona próxima tarefa por prioridade
 */
void schedule(void) {
    if (scheduler.task_count == 0) return;
    
    uint32_t next_task = 0;
    uint32_t highest_priority = 0;
    
    for (uint32_t i = 0; i < scheduler.task_count; i++) {
        if (scheduler.tasks[i].state == TASK_READY && 
            scheduler.tasks[i].priority > highest_priority) {
            highest_priority = scheduler.tasks[i].priority;
            next_task = i;
        }
    }
    
    scheduler.current_task = next_task;
}

/**
 * Context switch - simula troca de contexto
 */
void context_switch(void) {
    Task *current = &scheduler.tasks[scheduler.current_task];
    current->state = TASK_READY;
    
    schedule();
    
    Task *next = &scheduler.tasks[scheduler.current_task];
    next->state = TASK_RUNNING;
    
    printf("[KERNEL] Context switch: Task %u -> Task %u\n", 
           current->id, next->id);
}

/* ============================================================================
   PARTE 2: DRIVER UART (SERIAL COMMUNICATION)
   ============================================================================ */

// Simulação de registradores memory-mapped
typedef struct {
    volatile uint32_t data;
    volatile uint32_t status;
    volatile uint32_t control;
} UARTRegisters;

#define UART_TX_READY 0x01
#define UART_RX_READY 0x02
#define UART_ERROR    0x04

typedef struct {
    UARTRegisters *regs;
    uint32_t baudrate;
    uint8_t *rx_buffer;
    uint32_t rx_head;
    uint32_t rx_tail;
    uint32_t buffer_size;
} UARTDriver;

static UARTDriver uart_driver = {0};

/**
 * Inicializa driver UART
 */
int uart_init(uint32_t baudrate, uint32_t buffer_size) {
    uart_driver.baudrate = baudrate;
    uart_driver.buffer_size = buffer_size;
    uart_driver.rx_buffer = (uint8_t *)malloc(buffer_size);
    
    if (!uart_driver.rx_buffer) {
        fprintf(stderr, "ERROR: Failed to allocate UART RX buffer\n");
        return -1;
    }
    
    uart_driver.rx_head = 0;
    uart_driver.rx_tail = 0;
    
    printf("[UART] Initialized at %u baud\n", baudrate);
    return 0;
}

/**
 * Escreve caractere na UART
 */
void uart_putchar(char c) {
    // Simula espera por TX ready
    printf("[UART TX] 0x%02X ('%c')\n", (unsigned char)c, 
           (c >= 32 && c < 127) ? c : '?');
}

/**
 * Escreve string na UART
 */
void uart_puts(const char *str) {
    if (!str) return;
    
    while (*str) {
        uart_putchar(*str++);
    }
}

/**
 * Lê caractere da UART (com buffer)
 */
int uart_getchar(void) {
    if (uart_driver.rx_head == uart_driver.rx_tail) {
        return -1;  // Buffer vazio
    }
    
    uint8_t c = uart_driver.rx_buffer[uart_driver.rx_tail];
    uart_driver.rx_tail = (uart_driver.rx_tail + 1) % uart_driver.buffer_size;
    
    return c;
}

/**
 * Simula recebimento de dados na UART
 */
void uart_receive_data(const uint8_t *data, uint32_t len) {
    for (uint32_t i = 0; i < len; i++) {
        uint32_t next_head = (uart_driver.rx_head + 1) % uart_driver.buffer_size;
        
        if (next_head == uart_driver.rx_tail) {
            fprintf(stderr, "[UART] RX buffer overflow!\n");
            continue;
        }
        
        uart_driver.rx_buffer[uart_driver.rx_head] = data[i];
        uart_driver.rx_head = next_head;
    }
    
    printf("[UART RX] Received %u bytes\n", len);
}

/* ============================================================================
   PARTE 3: GERENCIADOR DE MEMÓRIA (HEAP)
   ============================================================================ */

#define HEAP_SIZE 65536

typedef struct {
    uint32_t size;
    uint8_t free;
    uint32_t magic;  // Detecção de corrupção
} BlockHeader;

#define MAGIC_ALLOCATED 0xDEADBEEF
#define MAGIC_FREE      0xCAFEBABE

static uint8_t heap[HEAP_SIZE];
static uint32_t heap_ptr = 0;
static uint32_t total_allocated = 0;
static uint32_t total_freed = 0;

/**
 * Aloca memória no heap customizado
 */
void *heap_malloc(size_t size) {
    if (size == 0) return NULL;
    
    uint32_t needed = size + sizeof(BlockHeader);
    
    if (heap_ptr + needed > HEAP_SIZE) {
        fprintf(stderr, "ERROR: Heap overflow! Requested %zu bytes\n", size);
        return NULL;
    }
    
    BlockHeader *header = (BlockHeader *)(heap + heap_ptr);
    header->size = size;
    header->free = 0;
    header->magic = MAGIC_ALLOCATED;
    
    void *ptr = heap + heap_ptr + sizeof(BlockHeader);
    heap_ptr += needed;
    total_allocated += size;
    
    printf("[HEAP] malloc(%zu) -> %p (total: %u bytes)\n", 
           size, ptr, total_allocated);
    
    return ptr;
}

/**
 * Libera memória (marca como livre)
 */
void heap_free(void *ptr) {
    if (!ptr) return;
    
    BlockHeader *header = (BlockHeader *)ptr - 1;
    
    // Verifica magic number
    if (header->magic != MAGIC_ALLOCATED) {
        fprintf(stderr, "ERROR: Invalid magic number - possible corruption!\n");
        return;
    }
    
    header->free = 1;
    header->magic = MAGIC_FREE;
    total_freed += header->size;
    
    printf("[HEAP] free(%p) -> %u bytes freed (total freed: %u)\n", 
           ptr, header->size, total_freed);
}

/**
 * Realoca memória
 */
void *heap_realloc(void *ptr, size_t new_size) {
    if (!ptr) return heap_malloc(new_size);
    if (new_size == 0) {
        heap_free(ptr);
        return NULL;
    }
    
    BlockHeader *header = (BlockHeader *)ptr - 1;
    
    if (new_size <= header->size) {
        return ptr;  // Já cabe
    }
    
    void *new_ptr = heap_malloc(new_size);
    if (new_ptr) {
        memcpy(new_ptr, ptr, header->size);
        heap_free(ptr);
    }
    
    return new_ptr;
}

/**
 * Imprime estatísticas do heap
 */
void heap_stats(void) {
    printf("\n[HEAP STATS]\n");
    printf("  Total allocated: %u bytes\n", total_allocated);
    printf("  Total freed: %u bytes\n", total_freed);
    printf("  Heap pointer: %u / %u bytes\n", heap_ptr, HEAP_SIZE);
    printf("  Utilization: %.1f%%\n", (float)heap_ptr / HEAP_SIZE * 100);
}

/* ============================================================================
   PARTE 4: PROTEÇÃO CONTRA BUFFER OVERFLOW
   ============================================================================ */

#define CANARY_VALUE 0xDEADBEEF

typedef struct {
    uint32_t canary_before;
    char buffer[64];
    uint32_t canary_after;
} ProtectedBuffer;

/**
 * Cópia segura com proteção de canary
 */
int safe_strcpy(ProtectedBuffer *pb, const char *src) {
    if (!pb || !src) return -1;
    
    pb->canary_before = CANARY_VALUE;
    pb->canary_after = CANARY_VALUE;
    
    size_t len = strlen(src);
    if (len >= sizeof(pb->buffer)) {
        fprintf(stderr, "ERROR: String too long for buffer\n");
        return -1;
    }
    
    strcpy(pb->buffer, src);
    
    // Verifica canaries
    if (pb->canary_before != CANARY_VALUE || pb->canary_after != CANARY_VALUE) {
        fprintf(stderr, "ERROR: Buffer overflow detected!\n");
        return -1;
    }
    
    return 0;
}

/* ============================================================================
   MAIN - DEMONSTRAÇÃO
   ============================================================================ */

void task_worker_1(void) {
    printf("[TASK 1] Working...\n");
}

void task_worker_2(void) {
    printf("[TASK 2] Working...\n");
}

void task_worker_3(void) {
    printf("[TASK 3] Working...\n");
}

int main(void) {
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║     LOW LEVEL SYSTEMS DEMONSTRATION                       ║\n");
    printf("║     Kernel, Drivers, Memory Management                    ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    /* ========== KERNEL & SCHEDULER ========== */
    printf("=== KERNEL SCHEDULER ===\n");
    task_init(1, task_worker_1, 3);
    task_init(2, task_worker_2, 2);
    task_init(3, task_worker_3, 1);
    
    for (int i = 0; i < 3; i++) {
        context_switch();
    }
    
    /* ========== UART DRIVER ========== */
    printf("\n=== UART DRIVER ===\n");
    uart_init(115200, 256);
    uart_puts("Hello from UART!\n");
    
    uint8_t rx_data[] = {0x41, 0x42, 0x43};  // ABC
    uart_receive_data(rx_data, 3);
    
    int c;
    while ((c = uart_getchar()) != -1) {
        printf("[UART] Received: 0x%02X ('%c')\n", c, c);
    }
    
    /* ========== MEMORY MANAGEMENT ========== */
    printf("\n=== MEMORY MANAGEMENT ===\n");
    
    int *arr1 = (int *)heap_malloc(sizeof(int) * 10);
    char *str1 = (char *)heap_malloc(128);
    float *arr2 = (float *)heap_malloc(sizeof(float) * 5);
    
    if (arr1) {
        for (int i = 0; i < 10; i++) {
            arr1[i] = i * 2;
        }
        printf("[APP] Array 1: ");
        for (int i = 0; i < 10; i++) {
            printf("%d ", arr1[i]);
        }
        printf("\n");
    }
    
    if (str1) {
        strcpy(str1, "Low Level Systems");
        printf("[APP] String: %s\n", str1);
    }
    
    heap_free(arr1);
    heap_free(str1);
    
    char *str2 = (char *)heap_malloc(256);
    if (str2) {
        strcpy(str2, "Reallocated memory");
        printf("[APP] Reallocated: %s\n", str2);
    }
    heap_free(str2);
    
    heap_stats();
    
    /* ========== BUFFER OVERFLOW PROTECTION ========== */
    printf("\n=== BUFFER OVERFLOW PROTECTION ===\n");
    
    ProtectedBuffer pb;
    if (safe_strcpy(&pb, "Protected string") == 0) {
        printf("[APP] Protected buffer: %s\n", pb.buffer);
    }
    
    // Tenta overflow (será detectado)
    if (safe_strcpy(&pb, "This is a very long string that will definitely overflow the buffer") != 0) {
        printf("[APP] Overflow attempt blocked!\n");
    }
    
    printf("\n╔════════════════════════════════════════════════════════════╗\n");
    printf("║     DEMONSTRATION COMPLETE                               ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n");
    
    return 0;
}
