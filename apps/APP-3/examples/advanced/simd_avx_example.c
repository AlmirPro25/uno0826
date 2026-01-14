/**
 * ============================================================================
 * SIMD (SSE/AVX) - EXEMPLOS AVANÇADOS DE VETORIZAÇÃO
 * ============================================================================
 * 
 * Compilar: gcc -O3 -mavx2 -mfma simd_avx_example.c -o simd_avx_example
 * 
 * Flags importantes:
 *   -mavx     : Habilita AVX (256-bit)
 *   -mavx2    : Habilita AVX2 (mais instruções)
 *   -mfma     : Habilita FMA (Fused Multiply-Add)
 *   -msse4.2  : Habilita SSE4.2 (128-bit)
 * 
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>
#include <math.h>

// Headers SIMD
#include <immintrin.h>  // AVX, AVX2, FMA
#include <xmmintrin.h>  // SSE
#include <emmintrin.h>  // SSE2

// ============================================================================
// UTILIDADES
// ============================================================================

#define ALIGN_32 __attribute__((aligned(32)))
#define ALIGN_16 __attribute__((aligned(16)))

// Timer de alta precisão
double get_time_ms() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

// Aloca memória alinhada
void* aligned_malloc(size_t size, size_t alignment) {
    void* ptr = NULL;
    posix_memalign(&ptr, alignment, size);
    return ptr;
}

// ============================================================================
// EXEMPLO 1: SOMA DE ARRAYS (FLOAT)
// ============================================================================

// Versão escalar (baseline)
void add_arrays_scalar(float* a, float* b, float* c, size_t n) {
    for (size_t i = 0; i < n; i++) {
        c[i] = a[i] + b[i];
    }
}

// Versão SSE (128-bit = 4 floats por vez)
void add_arrays_sse(float* a, float* b, float* c, size_t n) {
    size_t i = 0;
    
    // Processa 4 floats por iteração
    for (; i + 4 <= n; i += 4) {
        __m128 va = _mm_load_ps(&a[i]);
        __m128 vb = _mm_load_ps(&b[i]);
        __m128 vc = _mm_add_ps(va, vb);
        _mm_store_ps(&c[i], vc);
    }
    
    // Processa resto escalarmente
    for (; i < n; i++) {
        c[i] = a[i] + b[i];
    }
}

// Versão AVX (256-bit = 8 floats por vez)
void add_arrays_avx(float* a, float* b, float* c, size_t n) {
    size_t i = 0;
    
    // Processa 8 floats por iteração
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_load_ps(&a[i]);
        __m256 vb = _mm256_load_ps(&b[i]);
        __m256 vc = _mm256_add_ps(va, vb);
        _mm256_store_ps(&c[i], vc);
    }
    
    // Processa resto com SSE
    for (; i + 4 <= n; i += 4) {
        __m128 va = _mm_load_ps(&a[i]);
        __m128 vb = _mm_load_ps(&b[i]);
        __m128 vc = _mm_add_ps(va, vb);
        _mm_store_ps(&c[i], vc);
    }
    
    // Processa resto escalarmente
    for (; i < n; i++) {
        c[i] = a[i] + b[i];
    }
}

// ============================================================================
// EXEMPLO 2: DOT PRODUCT (PRODUTO ESCALAR)
// ============================================================================

// Versão escalar
float dot_product_scalar(float* a, float* b, size_t n) {
    float sum = 0.0f;
    for (size_t i = 0; i < n; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

// Versão AVX com FMA (Fused Multiply-Add)
float dot_product_avx_fma(float* a, float* b, size_t n) {
    __m256 sum = _mm256_setzero_ps();
    size_t i = 0;
    
    // Processa 8 floats por iteração com FMA
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_load_ps(&a[i]);
        __m256 vb = _mm256_load_ps(&b[i]);
        sum = _mm256_fmadd_ps(va, vb, sum);  // sum += va * vb
    }
    
    // Redução horizontal (soma todos os 8 elementos)
    __m128 hi = _mm256_extractf128_ps(sum, 1);
    __m128 lo = _mm256_castps256_ps128(sum);
    __m128 sum128 = _mm_add_ps(hi, lo);
    sum128 = _mm_hadd_ps(sum128, sum128);
    sum128 = _mm_hadd_ps(sum128, sum128);
    
    float result = _mm_cvtss_f32(sum128);
    
    // Processa resto escalarmente
    for (; i < n; i++) {
        result += a[i] * b[i];
    }
    
    return result;
}

// ============================================================================
// EXEMPLO 3: MULTIPLICAÇÃO DE MATRIZES
// ============================================================================

// Versão escalar
void matmul_scalar(float* A, float* B, float* C, int M, int N, int K) {
    for (int i = 0; i < M; i++) {
        for (int j = 0; j < N; j++) {
            float sum = 0.0f;
            for (int k = 0; k < K; k++) {
                sum += A[i * K + k] * B[k * N + j];
            }
            C[i * N + j] = sum;
        }
    }
}

// Versão AVX otimizada (blocking + vectorization)
void matmul_avx(float* A, float* B, float* C, int M, int N, int K) {
    // Zera matriz C
    memset(C, 0, M * N * sizeof(float));
    
    // Block size para cache optimization
    const int BLOCK = 64;
    
    for (int i0 = 0; i0 < M; i0 += BLOCK) {
        for (int j0 = 0; j0 < N; j0 += BLOCK) {
            for (int k0 = 0; k0 < K; k0 += BLOCK) {
                
                int i_max = (i0 + BLOCK < M) ? i0 + BLOCK : M;
                int j_max = (j0 + BLOCK < N) ? j0 + BLOCK : N;
                int k_max = (k0 + BLOCK < K) ? k0 + BLOCK : K;
                
                for (int i = i0; i < i_max; i++) {
                    for (int k = k0; k < k_max; k++) {
                        __m256 a_val = _mm256_set1_ps(A[i * K + k]);
                        
                        int j;
                        for (j = j0; j + 8 <= j_max; j += 8) {
                            __m256 b_val = _mm256_loadu_ps(&B[k * N + j]);
                            __m256 c_val = _mm256_loadu_ps(&C[i * N + j]);
                            c_val = _mm256_fmadd_ps(a_val, b_val, c_val);
                            _mm256_storeu_ps(&C[i * N + j], c_val);
                        }
                        
                        // Resto escalar
                        for (; j < j_max; j++) {
                            C[i * N + j] += A[i * K + k] * B[k * N + j];
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// EXEMPLO 4: BUSCA EM ARRAY (FIND)
// ============================================================================

// Versão escalar
int find_scalar(int* arr, int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

// Versão AVX2 (processa 8 ints por vez)
int find_avx2(int* arr, int n, int target) {
    __m256i target_vec = _mm256_set1_epi32(target);
    int i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256i data = _mm256_loadu_si256((__m256i*)&arr[i]);
        __m256i cmp = _mm256_cmpeq_epi32(data, target_vec);
        int mask = _mm256_movemask_epi8(cmp);
        
        if (mask != 0) {
            // Encontrou! Descobre qual posição
            for (int j = 0; j < 8; j++) {
                if (arr[i + j] == target) return i + j;
            }
        }
    }
    
    // Resto escalar
    for (; i < n; i++) {
        if (arr[i] == target) return i;
    }
    
    return -1;
}

// ============================================================================
// EXEMPLO 5: SOMA DE ARRAY (REDUÇÃO)
// ============================================================================

// Versão escalar
int64_t sum_array_scalar(int* arr, size_t n) {
    int64_t sum = 0;
    for (size_t i = 0; i < n; i++) {
        sum += arr[i];
    }
    return sum;
}

// Versão AVX2
int64_t sum_array_avx2(int* arr, size_t n) {
    __m256i sum = _mm256_setzero_si256();
    size_t i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256i data = _mm256_loadu_si256((__m256i*)&arr[i]);
        sum = _mm256_add_epi32(sum, data);
    }
    
    // Redução horizontal
    __m128i hi = _mm256_extracti128_si256(sum, 1);
    __m128i lo = _mm256_castsi256_si128(sum);
    __m128i sum128 = _mm_add_epi32(hi, lo);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    sum128 = _mm_hadd_epi32(sum128, sum128);
    
    int64_t result = _mm_cvtsi128_si32(sum128);
    
    // Resto escalar
    for (; i < n; i++) {
        result += arr[i];
    }
    
    return result;
}

// ============================================================================
// EXEMPLO 6: NORMALIZAÇÃO DE VETOR
// ============================================================================

// Versão AVX
void normalize_vector_avx(float* vec, size_t n) {
    // Calcula magnitude
    float mag_sq = dot_product_avx_fma(vec, vec, n);
    float mag = sqrtf(mag_sq);
    
    if (mag < 1e-10f) return;  // Evita divisão por zero
    
    __m256 inv_mag = _mm256_set1_ps(1.0f / mag);
    size_t i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256 v = _mm256_load_ps(&vec[i]);
        v = _mm256_mul_ps(v, inv_mag);
        _mm256_store_ps(&vec[i], v);
    }
    
    // Resto escalar
    float inv_mag_scalar = 1.0f / mag;
    for (; i < n; i++) {
        vec[i] *= inv_mag_scalar;
    }
}

// ============================================================================
// BENCHMARK
// ============================================================================

void benchmark_add_arrays() {
    const size_t N = 10000000;  // 10 milhões
    const int ITERATIONS = 100;
    
    float* a = (float*)aligned_malloc(N * sizeof(float), 32);
    float* b = (float*)aligned_malloc(N * sizeof(float), 32);
    float* c = (float*)aligned_malloc(N * sizeof(float), 32);
    
    // Inicializa
    for (size_t i = 0; i < N; i++) {
        a[i] = (float)i;
        b[i] = (float)(N - i);
    }
    
    double start, end;
    
    // Benchmark Scalar
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        add_arrays_scalar(a, b, c, N);
    }
    end = get_time_ms();
    printf("Scalar:  %.2f ms (avg: %.3f ms)\n", end - start, (end - start) / ITERATIONS);
    
    // Benchmark SSE
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        add_arrays_sse(a, b, c, N);
    }
    end = get_time_ms();
    printf("SSE:     %.2f ms (avg: %.3f ms)\n", end - start, (end - start) / ITERATIONS);
    
    // Benchmark AVX
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        add_arrays_avx(a, b, c, N);
    }
    end = get_time_ms();
    printf("AVX:     %.2f ms (avg: %.3f ms)\n", end - start, (end - start) / ITERATIONS);
    
    free(a);
    free(b);
    free(c);
}

void benchmark_dot_product() {
    const size_t N = 10000000;
    const int ITERATIONS = 100;
    
    float* a = (float*)aligned_malloc(N * sizeof(float), 32);
    float* b = (float*)aligned_malloc(N * sizeof(float), 32);
    
    for (size_t i = 0; i < N; i++) {
        a[i] = (float)i / N;
        b[i] = (float)(N - i) / N;
    }
    
    double start, end;
    float result;
    
    // Scalar
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        result = dot_product_scalar(a, b, N);
    }
    end = get_time_ms();
    printf("Dot Scalar: %.2f ms, result: %.2f\n", end - start, result);
    
    // AVX+FMA
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        result = dot_product_avx_fma(a, b, N);
    }
    end = get_time_ms();
    printf("Dot AVX+FMA: %.2f ms, result: %.2f\n", end - start, result);
    
    free(a);
    free(b);
}

void benchmark_matmul() {
    const int M = 512, N = 512, K = 512;
    const int ITERATIONS = 10;
    
    float* A = (float*)aligned_malloc(M * K * sizeof(float), 32);
    float* B = (float*)aligned_malloc(K * N * sizeof(float), 32);
    float* C = (float*)aligned_malloc(M * N * sizeof(float), 32);
    
    for (int i = 0; i < M * K; i++) A[i] = (float)(i % 100) / 100.0f;
    for (int i = 0; i < K * N; i++) B[i] = (float)(i % 100) / 100.0f;
    
    double start, end;
    
    // Scalar
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        matmul_scalar(A, B, C, M, N, K);
    }
    end = get_time_ms();
    printf("MatMul Scalar: %.2f ms\n", end - start);
    
    // AVX
    start = get_time_ms();
    for (int iter = 0; iter < ITERATIONS; iter++) {
        matmul_avx(A, B, C, M, N, K);
    }
    end = get_time_ms();
    printf("MatMul AVX:    %.2f ms\n", end - start);
    
    free(A);
    free(B);
    free(C);
}

// ============================================================================
// MAIN
// ============================================================================

int main() {
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║     SIMD (SSE/AVX) BENCHMARK                              ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    printf("=== ADD ARRAYS ===\n");
    benchmark_add_arrays();
    
    printf("\n=== DOT PRODUCT ===\n");
    benchmark_dot_product();
    
    printf("\n=== MATRIX MULTIPLICATION (512x512) ===\n");
    benchmark_matmul();
    
    printf("\n✅ Benchmark complete!\n");
    
    return 0;
}
