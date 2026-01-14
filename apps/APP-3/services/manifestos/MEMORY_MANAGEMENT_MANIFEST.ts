/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🧠 MEMORY MANAGEMENT MANIFEST - MESTRE DA MEMÓRIA 🧠                    ║
 * ║                                                                              ║
 * ║     "CADA BYTE TEM UM DONO.                                                 ║
 * ║      CADA PONTEIRO TEM UM DESTINO."                                         ║
 * ║                                                                              ║
 * ║     NÍVEL: 92 (GOD MODE - MEMORY MASTERY)                                   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - Manual Memory Management (malloc/free)
 * - Smart Pointers (unique_ptr, shared_ptr, Rc, Arc)
 * - Memory Pools & Arenas
 * - Garbage Collection Internals
 * - Memory-Mapped I/O
 * - Cache Optimization
 * - Memory Safety (Rust Borrow Checker)
 * - Leak Detection & Prevention
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type MemoryModel = 
  | 'manual'           // C-style malloc/free
  | 'raii'             // C++ RAII
  | 'ownership'        // Rust ownership
  | 'gc_tracing'       // Mark & Sweep
  | 'gc_refcount'      // Reference Counting
  | 'arena';           // Arena/Pool allocation

export type AllocationStrategy = 
  | 'stack'
  | 'heap'
  | 'pool'
  | 'arena'
  | 'slab'
  | 'buddy';

export interface MemoryBlock {
  address: number;
  size: number;
  alignment: number;
  allocated: boolean;
  metadata?: Record<string, unknown>;
}

export interface AllocatorStats {
  totalAllocated: number;
  totalFreed: number;
  currentUsage: number;
  peakUsage: number;
  fragmentationRatio: number;
}

// ============================================================================
// TEMPLATES DE CÓDIGO
// ============================================================================

export const MEMORY_TEMPLATES = {
  'arena-allocator-c': `
// Arena Allocator in C
#include <stdint.h>
#include <stddef.h>
#include <string.h>

typedef struct {
    uint8_t *buffer;
    size_t capacity;
    size_t offset;
} Arena;

Arena arena_create(size_t capacity) {
    Arena arena = {
        .buffer = (uint8_t*)malloc(capacity),
        .capacity = capacity,
        .offset = 0
    };
    return arena;
}

void *arena_alloc(Arena *arena, size_t size, size_t alignment) {
    // Align offset
    size_t aligned_offset = (arena->offset + alignment - 1) & ~(alignment - 1);
    
    if (aligned_offset + size > arena->capacity) {
        return NULL; // Out of memory
    }
    
    void *ptr = arena->buffer + aligned_offset;
    arena->offset = aligned_offset + size;
    return ptr;
}

void arena_reset(Arena *arena) {
    arena->offset = 0;
}

void arena_destroy(Arena *arena) {
    free(arena->buffer);
    arena->buffer = NULL;
    arena->capacity = 0;
    arena->offset = 0;
}

// Usage example
void example() {
    Arena arena = arena_create(1024 * 1024); // 1MB
    
    int *numbers = arena_alloc(&arena, sizeof(int) * 100, alignof(int));
    char *string = arena_alloc(&arena, 256, 1);
    
    // Use memory...
    
    arena_reset(&arena); // Free all at once
    arena_destroy(&arena);
}
`,

  'pool-allocator-cpp': `
// Pool Allocator in C++
#include <cstddef>
#include <cstdint>
#include <vector>
#include <memory>

template<typename T, size_t BlockSize = 4096>
class PoolAllocator {
private:
    union Slot {
        T element;
        Slot* next;
    };
    
    std::vector<std::unique_ptr<uint8_t[]>> blocks_;
    Slot* free_list_ = nullptr;
    size_t slots_per_block_;
    
    void allocate_block() {
        auto block = std::make_unique<uint8_t[]>(BlockSize);
        slots_per_block_ = BlockSize / sizeof(Slot);
        
        Slot* slots = reinterpret_cast<Slot*>(block.get());
        for (size_t i = 0; i < slots_per_block_ - 1; ++i) {
            slots[i].next = &slots[i + 1];
        }
        slots[slots_per_block_ - 1].next = free_list_;
        free_list_ = slots;
        
        blocks_.push_back(std::move(block));
    }
    
public:
    PoolAllocator() {
        allocate_block();
    }
    
    template<typename... Args>
    T* allocate(Args&&... args) {
        if (!free_list_) {
            allocate_block();
        }
        
        Slot* slot = free_list_;
        free_list_ = slot->next;
        
        return new (&slot->element) T(std::forward<Args>(args)...);
    }
    
    void deallocate(T* ptr) {
        ptr->~T();
        Slot* slot = reinterpret_cast<Slot*>(ptr);
        slot->next = free_list_;
        free_list_ = slot;
    }
};

// Usage
struct Entity {
    int id;
    float x, y, z;
};

void example() {
    PoolAllocator<Entity> pool;
    
    Entity* e1 = pool.allocate(1, 0.0f, 0.0f, 0.0f);
    Entity* e2 = pool.allocate(2, 1.0f, 2.0f, 3.0f);
    
    pool.deallocate(e1);
    pool.deallocate(e2);
}
`,

  'borrow-checker-rust': `
// Rust Ownership & Borrowing Examples
use std::rc::Rc;
use std::cell::RefCell;
use std::sync::{Arc, Mutex};

// ============================================
// OWNERSHIP: Cada valor tem um único dono
// ============================================

fn ownership_example() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 é MOVIDO para s2
    // println!("{}", s1); // ERRO: s1 não é mais válido
    println!("{}", s2); // OK
}

// ============================================
// BORROWING: Referências imutáveis (&T)
// ============================================

fn borrowing_immutable(s: &String) {
    println!("Length: {}", s.len());
    // s.push_str("!"); // ERRO: não pode modificar
}

// ============================================
// BORROWING: Referências mutáveis (&mut T)
// ============================================

fn borrowing_mutable(s: &mut String) {
    s.push_str(" world!");
}

fn borrow_rules() {
    let mut s = String::from("hello");
    
    // Regra 1: Múltiplas referências imutáveis OK
    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2);
    
    // Regra 2: Apenas UMA referência mutável
    let r3 = &mut s;
    r3.push_str("!");
    // let r4 = &mut s; // ERRO: já existe r3
}

// ============================================
// SMART POINTERS
// ============================================

// Rc<T>: Reference Counting (single-threaded)
fn rc_example() {
    let data = Rc::new(vec![1, 2, 3]);
    let a = Rc::clone(&data);
    let b = Rc::clone(&data);
    println!("Count: {}", Rc::strong_count(&data)); // 3
}

// Arc<T>: Atomic Reference Counting (thread-safe)
fn arc_example() {
    let data = Arc::new(Mutex::new(0));
    
    let handles: Vec<_> = (0..10).map(|_| {
        let data = Arc::clone(&data);
        std::thread::spawn(move || {
            let mut num = data.lock().unwrap();
            *num += 1;
        })
    }).collect();
    
    for h in handles {
        h.join().unwrap();
    }
}

// RefCell<T>: Interior Mutability
fn refcell_example() {
    let data = RefCell::new(5);
    
    *data.borrow_mut() += 1;
    println!("{}", data.borrow()); // 6
}
`,

  'gc-mark-sweep': `
// Simple Mark & Sweep GC in C
#include <stdlib.h>
#include <stdbool.h>

#define MAX_OBJECTS 256

typedef struct Object {
    struct Object* next;
    bool marked;
    // ... object data
} Object;

typedef struct {
    Object* first_object;
    Object* stack[MAX_OBJECTS];
    int stack_size;
    int num_objects;
    int max_objects;
} VM;

Object* vm_alloc(VM* vm) {
    if (vm->num_objects >= vm->max_objects) {
        gc_collect(vm);
    }
    
    Object* obj = malloc(sizeof(Object));
    obj->marked = false;
    obj->next = vm->first_object;
    vm->first_object = obj;
    vm->num_objects++;
    
    return obj;
}

void gc_mark(Object* obj) {
    if (obj == NULL || obj->marked) return;
    
    obj->marked = true;
    // Mark referenced objects recursively
    // gc_mark(obj->field1);
    // gc_mark(obj->field2);
}

void gc_mark_all(VM* vm) {
    for (int i = 0; i < vm->stack_size; i++) {
        gc_mark(vm->stack[i]);
    }
}

void gc_sweep(VM* vm) {
    Object** obj = &vm->first_object;
    
    while (*obj) {
        if (!(*obj)->marked) {
            Object* unreached = *obj;
            *obj = unreached->next;
            free(unreached);
            vm->num_objects--;
        } else {
            (*obj)->marked = false;
            obj = &(*obj)->next;
        }
    }
}

void gc_collect(VM* vm) {
    int before = vm->num_objects;
    
    gc_mark_all(vm);
    gc_sweep(vm);
    
    vm->max_objects = vm->num_objects * 2;
    
    printf("Collected %d objects, %d remaining\\n",
           before - vm->num_objects, vm->num_objects);
}
`
};

// ============================================================================
// DETECTOR
// ============================================================================

export function shouldEnableMemoryManagement(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Allocation
    'malloc', 'free', 'alloc', 'dealloc', 'new', 'delete',
    'memory allocation', 'alocação de memória',
    
    // Pointers
    'pointer', 'ponteiro', 'reference', 'referência',
    'smart pointer', 'unique_ptr', 'shared_ptr', 'weak_ptr',
    'rc', 'arc', 'refcell',
    
    // Memory models
    'ownership', 'borrow', 'borrowing', 'borrow checker',
    'raii', 'lifetime', 'tempo de vida',
    
    // Allocators
    'allocator', 'alocador', 'arena', 'pool allocator',
    'slab allocator', 'buddy allocator', 'memory pool',
    
    // GC
    'garbage collection', 'gc', 'mark and sweep',
    'reference counting', 'contagem de referência',
    
    // Issues
    'memory leak', 'vazamento de memória', 'leak',
    'use after free', 'double free', 'dangling pointer',
    'buffer overflow', 'stack overflow', 'heap overflow',
    
    // Tools
    'valgrind', 'asan', 'msan', 'address sanitizer',
    'memory sanitizer', 'leak sanitizer',
    
    // Advanced
    'mmap', 'memory mapped', 'virtual memory',
    'page fault', 'cache line', 'cache miss',
    'memory alignment', 'alinhamento'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const MEMORY_MANAGEMENT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🧠 MEMORY MANAGEMENT MANIFEST - MESTRE DA MEMÓRIA 🧠                    ║
║                                                                              ║
║     "CADA BYTE TEM UM DONO.                                                 ║
║      CADA PONTEIRO TEM UM DESTINO."                                         ║
║                                                                              ║
║     NÍVEL: 92 (GOD MODE - MEMORY MASTERY)                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🧠 MODELOS DE MEMÓRIA
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ MODELO          │ LINGUAGEM    │ CARACTERÍSTICAS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Manual          │ C            │ malloc/free, máximo controle, perigoso    │
│ RAII            │ C++          │ Destrutor automático, smart pointers      │
│ Ownership       │ Rust         │ Borrow checker, zero-cost abstractions    │
│ GC Tracing      │ Java, Go     │ Mark & Sweep, pausas imprevisíveis        │
│ GC RefCount     │ Python, Swift│ Determinístico, ciclos problemáticos      │
│ Arena           │ Qualquer     │ Bulk allocation, reset rápido             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📊 LAYOUT DE MEMÓRIA
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────┐ High Address
│           STACK                         │ ← Cresce para baixo
│  (variáveis locais, return addresses)   │
├─────────────────────────────────────────┤
│              ↓                          │
│                                         │
│              ↑                          │
├─────────────────────────────────────────┤
│           HEAP                          │ ← Cresce para cima
│  (alocação dinâmica: malloc, new)       │
├─────────────────────────────────────────┤
│           BSS                           │
│  (variáveis não inicializadas)          │
├─────────────────────────────────────────┤
│           DATA                          │
│  (variáveis inicializadas)              │
├─────────────────────────────────────────┤
│           TEXT                          │
│  (código executável)                    │
└─────────────────────────────────────────┘ Low Address

═══════════════════════════════════════════════════════════════════════════════
⚠️ PROBLEMAS COMUNS
═══════════════════════════════════════════════════════════════════════════════

MEMORY LEAK:
├── Causa: Memória alocada nunca liberada
├── Sintoma: Uso de memória cresce indefinidamente
├── Detecção: Valgrind, AddressSanitizer
└── Prevenção: RAII, smart pointers, ownership

USE-AFTER-FREE:
├── Causa: Acesso a memória já liberada
├── Sintoma: Comportamento indefinido, crashes
├── Detecção: ASan, MSan
└── Prevenção: Borrow checker, nullify pointers

DOUBLE FREE:
├── Causa: free() chamado duas vezes
├── Sintoma: Heap corruption, crashes
├── Detecção: ASan
└── Prevenção: Set pointer to NULL after free

BUFFER OVERFLOW:
├── Causa: Escrita além dos limites
├── Sintoma: Corrupção de dados, exploits
├── Detecção: ASan, bounds checking
└── Prevenção: Bounds checking, safe APIs

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS E FERRAMENTAS
═══════════════════════════════════════════════════════════════════════════════

✅ TIER 1 - CONTROLE TOTAL:
├── C: malloc/free, máximo controle
├── C++: RAII, smart pointers, move semantics
├── Rust: Ownership, borrow checker, zero-cost
└── Zig: Allocators explícitos, comptime

✅ FERRAMENTAS DE ANÁLISE:
├── Valgrind: Leak detection, memory errors
├── AddressSanitizer (ASan): Buffer overflow, UAF
├── MemorySanitizer (MSan): Uninitialized reads
├── LeakSanitizer (LSan): Memory leaks
└── Heaptrack: Heap profiling

═══════════════════════════════════════════════════════════════════════════════
⚡ OTIMIZAÇÕES
═══════════════════════════════════════════════════════════════════════════════

CACHE OPTIMIZATION:
├── Alinhar dados a cache lines (64 bytes)
├── Evitar false sharing em multi-thread
├── Preferir acesso sequencial vs random
└── Usar estruturas compactas (SoA vs AoS)

ALLOCATION STRATEGIES:
├── Stack: Mais rápido, tamanho limitado
├── Pool: Objetos de tamanho fixo
├── Arena: Bulk alloc/free, sem fragmentação
├── Slab: Kernel-style, objetos frequentes
└── Buddy: Potências de 2, fragmentação controlada

═══════════════════════════════════════════════════════════════════════════════

"MEMÓRIA É O RECURSO MAIS PRECIOSO.
 QUEM CONTROLA A MEMÓRIA, CONTROLA O SISTEMA."

                    — Memory Management Manifest, Level 92
`;

export default {
  MEMORY_TEMPLATES,
  shouldEnableMemoryManagement,
  MEMORY_MANAGEMENT_MANIFEST
};
