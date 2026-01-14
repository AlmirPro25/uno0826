/**
 * ============================================================================
 * ASSEMBLY MAIN - Wrapper C para funções Assembly
 * ============================================================================
 * 
 * Este arquivo demonstra como chamar funções Assembly a partir de C.
 * 
 * Compilar:
 *   nasm -f elf64 assembly_x86_64.asm -o assembly_x86_64.o
 *   gcc -c assembly_main.c -o assembly_main.o
 *   gcc assembly_x86_64.o assembly_main.o -o assembly_demo -no-pie
 * 
 * Ou simplesmente:
 *   make assembly
 * 
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <time.h>

// ============================================================================
// DECLARAÇÕES DAS FUNÇÕES ASSEMBLY
// ============================================================================

// Funções definidas em assembly_x86_64.asm
extern int64_t add_numbers(int64_t a, int64_t b);
extern int64_t multiply_numbers(int64_t a, int64_t b);
extern int64_t factorial(int64_t n);
extern int64_t fibonacci(int64_t n);
extern void* memcpy_fast(void* dest, const void* src, size_t n);
extern size_t strlen_fast(const char* str);
extern int64_t sum_array(int64_t* arr, size_t n);
extern int64_t find_max(int64_t* arr, size_t n);
extern void reverse_string(char* str, size_t len);

// ============================================================================
// FUNÇÕES DE BENCHMARK
// ============================================================================

double get_time_ms() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

// ============================================================================
// TESTES
// ============================================================================

void test_arithmetic() {
    printf("=== ARITHMETIC OPERATIONS ===\n");
    
    // Add
    int64_t a = 42, b = 58;
    int64_t result = add_numbers(a, b);
    printf("add_numbers(%ld, %ld) = %ld\n", a, b, result);
    
    // Multiply
    a = 7; b = 8;
    result = multiply_numbers(a, b);
    printf("multiply_numbers(%ld, %ld) = %ld\n", a, b, result);
    
    // Factorial
    for (int n = 0; n <= 10; n++) {
        result = factorial(n);
        printf("factorial(%d) = %ld\n", n, result);
    }
    
    // Fibonacci
    printf("\nFibonacci sequence:\n");
    for (int n = 0; n <= 15; n++) {
        result = fibonacci(n);
        printf("fib(%d) = %ld\n", n, result);
    }
}

void test_string_operations() {
    printf("\n=== STRING OPERATIONS ===\n");
    
    // strlen_fast
    const char* test_strings[] = {
        "Hello",
        "Hello, World!",
        "Assembly is powerful!",
        ""
    };
    
    for (int i = 0; i < 4; i++) {
        size_t len = strlen_fast(test_strings[i]);
        printf("strlen_fast(\"%s\") = %zu\n", test_strings[i], len);
    }
    
    // reverse_string
    char str1[] = "Hello, World!";
    printf("\nOriginal: \"%s\"\n", str1);
    reverse_string(str1, strlen(str1));
    printf("Reversed: \"%s\"\n", str1);
    
    char str2[] = "Assembly";
    printf("\nOriginal: \"%s\"\n", str2);
    reverse_string(str2, strlen(str2));
    printf("Reversed: \"%s\"\n", str2);
}

void test_array_operations() {
    printf("\n=== ARRAY OPERATIONS ===\n");
    
    int64_t arr[] = {10, 20, 30, 40, 50, 5, 15, 25, 35, 45};
    size_t n = sizeof(arr) / sizeof(arr[0]);
    
    printf("Array: ");
    for (size_t i = 0; i < n; i++) {
        printf("%ld ", arr[i]);
    }
    printf("\n");
    
    // Sum
    int64_t sum = sum_array(arr, n);
    printf("sum_array() = %ld\n", sum);
    
    // Max
    int64_t max = find_max(arr, n);
    printf("find_max() = %ld\n", max);
}

void test_memcpy() {
    printf("\n=== MEMCPY BENCHMARK ===\n");
    
    const size_t SIZE = 10000000;  // 10 MB
    const int ITERATIONS = 100;
    
    char* src = (char*)malloc(SIZE);
    char* dest = (char*)malloc(SIZE);
    
    // Inicializa
    for (size_t i = 0; i < SIZE; i++) {
        src[i] = (char)(i % 256);
    }
    
    double start, end;
    
    // Benchmark memcpy padrão
    start = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        memcpy(dest, src, SIZE);
    }
    end = get_time_ms();
    printf("Standard memcpy: %.2f ms (%.2f GB/s)\n", 
           end - start,
           (SIZE * ITERATIONS / 1e9) / ((end - start) / 1000));
    
    // Benchmark memcpy_fast (Assembly)
    start = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        memcpy_fast(dest, src, SIZE);
    }
    end = get_time_ms();
    printf("Assembly memcpy: %.2f ms (%.2f GB/s)\n", 
           end - start,
           (SIZE * ITERATIONS / 1e9) / ((end - start) / 1000));
    
    // Verifica correção
    int correct = 1;
    for (size_t i = 0; i < SIZE; i++) {
        if (dest[i] != src[i]) {
            correct = 0;
            break;
        }
    }
    printf("Verification: %s\n", correct ? "PASSED" : "FAILED");
    
    free(src);
    free(dest);
}

void test_factorial_benchmark() {
    printf("\n=== FACTORIAL BENCHMARK ===\n");
    
    const int ITERATIONS = 10000000;
    double start, end;
    int64_t result;
    
    // Benchmark Assembly factorial
    start = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        result = factorial(20);
    }
    end = get_time_ms();
    printf("Assembly factorial(20) x %d: %.2f ms\n", ITERATIONS, end - start);
    printf("Result: %ld\n", result);
}

void test_fibonacci_benchmark() {
    printf("\n=== FIBONACCI BENCHMARK ===\n");
    
    const int ITERATIONS = 10000000;
    double start, end;
    int64_t result;
    
    // Benchmark Assembly fibonacci
    start = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        result = fibonacci(30);
    }
    end = get_time_ms();
    printf("Assembly fibonacci(30) x %d: %.2f ms\n", ITERATIONS, end - start);
    printf("Result: %ld\n", result);
}

// ============================================================================
// MAIN
// ============================================================================

int main() {
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║     ASSEMBLY x86_64 DEMONSTRATION                         ║\n");
    printf("║     Calling Assembly functions from C                     ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    test_arithmetic();
    test_string_operations();
    test_array_operations();
    test_memcpy();
    test_factorial_benchmark();
    test_fibonacci_benchmark();
    
    printf("\n✅ All tests completed!\n");
    
    return 0;
}
