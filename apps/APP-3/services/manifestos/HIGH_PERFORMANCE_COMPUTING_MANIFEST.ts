/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     ⚡ HIGH PERFORMANCE COMPUTING MANIFEST - MESTRE DA VELOCIDADE ⚡         ║
 * ║                                                                              ║
 * ║     "CADA CICLO DE CPU CONTA. CADA CACHE MISS É UM CRIME.                   ║
 * ║      OTIMIZAÇÃO NÃO É LUXO, É SOBREVIVÊNCIA."                               ║
 * ║                                                                              ║
 * ║     NÍVEL: 96 (GOD MODE - MAXIMUM THROUGHPUT)                               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - SIMD (SSE, AVX, AVX-512, NEON)
 * - GPU Computing (CUDA, OpenCL, Vulkan Compute)
 * - Parallel Computing (OpenMP, MPI, Threading)
 * - Cache Optimization
 * - Memory Bandwidth Optimization
 * - Vectorization
 * - Lock-free Data Structures
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type SIMDExtension = 'sse' | 'sse2' | 'sse4' | 'avx' | 'avx2' | 'avx512' | 'neon' | 'sve';
export type GPUPlatform = 'cuda' | 'opencl' | 'vulkan' | 'metal' | 'hip' | 'sycl';
export type ParallelModel = 'openmp' | 'mpi' | 'pthread' | 'tbb' | 'rayon' | 'tokio';

export interface HPCConfig {
  targetArch: 'x86_64' | 'arm64' | 'gpu';
  simdExtensions: SIMDExtension[];
  gpuPlatform?: GPUPlatform;
  parallelModel: ParallelModel;
  optimizationLevel: 'O2' | 'O3' | 'Ofast';
  vectorWidth: 128 | 256 | 512;
}

// ============================================================================
// TEMPLATES DE CÓDIGO HPC
// ============================================================================

export const HPC_TEMPLATES = {
  'simd-avx2': {
    name: 'AVX2 SIMD Operations',
    files: {
      'simd_ops.c': SIMD_AVX2_TEMPLATE(),
      'simd_ops.h': SIMD_HEADER_TEMPLATE(),
      'benchmark.c': SIMD_BENCHMARK_TEMPLATE(),
      'Makefile': SIMD_MAKEFILE_TEMPLATE()
    }
  },
  
  'cuda-basic': {
    name: 'CUDA GPU Computing',
    files: {
      'kernel.cu': CUDA_KERNEL_TEMPLATE(),
      'main.cpp': CUDA_MAIN_TEMPLATE(),
      'Makefile': CUDA_MAKEFILE_TEMPLATE()
    }
  },
  
  'openmp-parallel': {
    name: 'OpenMP Parallel Computing',
    files: {
      'parallel.c': OPENMP_TEMPLATE(),
      'Makefile': OPENMP_MAKEFILE_TEMPLATE()
    }
  },
  
  'rust-rayon': {
    name: 'Rust Rayon Parallel',
    files: {
      'src/main.rs': RUST_RAYON_TEMPLATE(),
      'Cargo.toml': RUST_HPC_CARGO_TEMPLATE()
    }
  }
};

// ============================================================================
// TEMPLATES DE CÓDIGO
// ============================================================================

function SIMD_AVX2_TEMPLATE(): string {
  return `/**
 * AVX2 SIMD Operations
 * 
 * Processa 8 floats ou 4 doubles por instrução
 * Speedup típico: 4-8x vs código escalar
 * 
 * Compilar: gcc -O3 -mavx2 -mfma simd_ops.c -o simd_demo
 */

#include <immintrin.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Alinhamento para AVX (32 bytes)
#define ALIGN_AVX __attribute__((aligned(32)))

// ═══════════════════════════════════════════════════════════════════════════
// OPERAÇÕES VETORIAIS BÁSICAS
// ═══════════════════════════════════════════════════════════════════════════

// Soma de arrays (8 floats por iteração)
void vector_add_avx(const float* a, const float* b, float* result, size_t n) {
    size_t i = 0;
    
    // Processa 8 elementos por vez
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vr = _mm256_add_ps(va, vb);
        _mm256_storeu_ps(&result[i], vr);
    }
    
    // Processa elementos restantes
    for (; i < n; i++) {
        result[i] = a[i] + b[i];
    }
}

// Multiplicação de arrays
void vector_mul_avx(const float* a, const float* b, float* result, size_t n) {
    size_t i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vr = _mm256_mul_ps(va, vb);
        _mm256_storeu_ps(&result[i], vr);
    }
    
    for (; i < n; i++) {
        result[i] = a[i] * b[i];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FMA (FUSED MULTIPLY-ADD) - a * b + c em uma instrução
// ═══════════════════════════════════════════════════════════════════════════

// result = a * b + c (mais preciso e rápido que separado)
void vector_fma_avx(const float* a, const float* b, const float* c, 
                    float* result, size_t n) {
    size_t i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vc = _mm256_loadu_ps(&c[i]);
        __m256 vr = _mm256_fmadd_ps(va, vb, vc);  // a*b + c
        _mm256_storeu_ps(&result[i], vr);
    }
    
    for (; i < n; i++) {
        result[i] = a[i] * b[i] + c[i];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DOT PRODUCT (Produto Escalar)
// ═══════════════════════════════════════════════════════════════════════════

float dot_product_avx(const float* a, const float* b, size_t n) {
    __m256 sum = _mm256_setzero_ps();
    size_t i = 0;
    
    // Acumula produtos em vetor
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        sum = _mm256_fmadd_ps(va, vb, sum);
    }
    
    // Redução horizontal (soma os 8 elementos do vetor)
    __m128 hi = _mm256_extractf128_ps(sum, 1);
    __m128 lo = _mm256_castps256_ps128(sum);
    __m128 sum128 = _mm_add_ps(hi, lo);
    sum128 = _mm_hadd_ps(sum128, sum128);
    sum128 = _mm_hadd_ps(sum128, sum128);
    
    float result = _mm_cvtss_f32(sum128);
    
    // Elementos restantes
    for (; i < n; i++) {
        result += a[i] * b[i];
    }
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MATRIX MULTIPLICATION (Multiplicação de Matrizes)
// ═══════════════════════════════════════════════════════════════════════════

// C = A * B (matrizes NxN)
void matrix_mul_avx(const float* A, const float* B, float* C, size_t N) {
    // Zera matriz resultado
    memset(C, 0, N * N * sizeof(float));
    
    // Blocked matrix multiplication para melhor cache usage
    const size_t BLOCK = 64;
    
    for (size_t i0 = 0; i0 < N; i0 += BLOCK) {
        for (size_t j0 = 0; j0 < N; j0 += BLOCK) {
            for (size_t k0 = 0; k0 < N; k0 += BLOCK) {
                
                size_t i_max = (i0 + BLOCK < N) ? i0 + BLOCK : N;
                size_t j_max = (j0 + BLOCK < N) ? j0 + BLOCK : N;
                size_t k_max = (k0 + BLOCK < N) ? k0 + BLOCK : N;
                
                for (size_t i = i0; i < i_max; i++) {
                    for (size_t k = k0; k < k_max; k++) {
                        __m256 a_ik = _mm256_set1_ps(A[i * N + k]);
                        
                        for (size_t j = j0; j + 8 <= j_max; j += 8) {
                            __m256 b_kj = _mm256_loadu_ps(&B[k * N + j]);
                            __m256 c_ij = _mm256_loadu_ps(&C[i * N + j]);
                            c_ij = _mm256_fmadd_ps(a_ik, b_kj, c_ij);
                            _mm256_storeu_ps(&C[i * N + j], c_ij);
                        }
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARAÇÕES E MÁSCARAS
// ═══════════════════════════════════════════════════════════════════════════

// Conta elementos maiores que threshold
size_t count_greater_avx(const float* data, float threshold, size_t n) {
    __m256 thresh = _mm256_set1_ps(threshold);
    __m256i count = _mm256_setzero_si256();
    __m256i ones = _mm256_set1_epi32(1);
    size_t i = 0;
    
    for (; i + 8 <= n; i += 8) {
        __m256 v = _mm256_loadu_ps(&data[i]);
        __m256 mask = _mm256_cmp_ps(v, thresh, _CMP_GT_OQ);
        __m256i mask_int = _mm256_castps_si256(mask);
        mask_int = _mm256_and_si256(mask_int, ones);
        count = _mm256_add_epi32(count, mask_int);
    }
    
    // Redução horizontal
    int counts[8];
    _mm256_storeu_si256((__m256i*)counts, count);
    size_t total = 0;
    for (int j = 0; j < 8; j++) total += counts[j];
    
    // Elementos restantes
    for (; i < n; i++) {
        if (data[i] > threshold) total++;
    }
    
    return total;
}`;
}

function SIMD_HEADER_TEMPLATE(): string {
  return `#ifndef SIMD_OPS_H
#define SIMD_OPS_H

#include <stddef.h>

// Vector operations
void vector_add_avx(const float* a, const float* b, float* result, size_t n);
void vector_mul_avx(const float* a, const float* b, float* result, size_t n);
void vector_fma_avx(const float* a, const float* b, const float* c, float* result, size_t n);

// Reductions
float dot_product_avx(const float* a, const float* b, size_t n);

// Matrix operations
void matrix_mul_avx(const float* A, const float* B, float* C, size_t N);

// Comparisons
size_t count_greater_avx(const float* data, float threshold, size_t n);

#endif`;
}

function SIMD_BENCHMARK_TEMPLATE(): string {
  return `/**
 * SIMD Benchmark - Compara performance escalar vs AVX2
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "simd_ops.h"

#define N 10000000
#define ITERATIONS 100

// Versão escalar para comparação
void vector_add_scalar(const float* a, const float* b, float* result, size_t n) {
    for (size_t i = 0; i < n; i++) {
        result[i] = a[i] + b[i];
    }
}

float dot_product_scalar(const float* a, const float* b, size_t n) {
    float sum = 0.0f;
    for (size_t i = 0; i < n; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

double get_time_ms() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

int main() {
    float *a = aligned_alloc(32, N * sizeof(float));
    float *b = aligned_alloc(32, N * sizeof(float));
    float *c = aligned_alloc(32, N * sizeof(float));
    
    // Inicializa dados
    for (size_t i = 0; i < N; i++) {
        a[i] = (float)rand() / RAND_MAX;
        b[i] = (float)rand() / RAND_MAX;
    }
    
    printf("Benchmark: %d elements, %d iterations\\n\\n", N, ITERATIONS);
    
    // Benchmark vector add
    double t1 = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        vector_add_scalar(a, b, c, N);
    }
    double scalar_time = get_time_ms() - t1;
    
    t1 = get_time_ms();
    for (int i = 0; i < ITERATIONS; i++) {
        vector_add_avx(a, b, c, N);
    }
    double avx_time = get_time_ms() - t1;
    
    printf("Vector Add:\\n");
    printf("  Scalar: %.2f ms\\n", scalar_time);
    printf("  AVX2:   %.2f ms\\n", avx_time);
    printf("  Speedup: %.2fx\\n\\n", scalar_time / avx_time);
    
    // Benchmark dot product
    t1 = get_time_ms();
    float result_scalar = 0;
    for (int i = 0; i < ITERATIONS; i++) {
        result_scalar = dot_product_scalar(a, b, N);
    }
    scalar_time = get_time_ms() - t1;
    
    t1 = get_time_ms();
    float result_avx = 0;
    for (int i = 0; i < ITERATIONS; i++) {
        result_avx = dot_product_avx(a, b, N);
    }
    avx_time = get_time_ms() - t1;
    
    printf("Dot Product:\\n");
    printf("  Scalar: %.2f ms (result: %f)\\n", scalar_time, result_scalar);
    printf("  AVX2:   %.2f ms (result: %f)\\n", avx_time, result_avx);
    printf("  Speedup: %.2fx\\n", scalar_time / avx_time);
    
    free(a);
    free(b);
    free(c);
    
    return 0;
}`;
}

function SIMD_MAKEFILE_TEMPLATE(): string {
  return `CC = gcc
CFLAGS = -O3 -mavx2 -mfma -Wall -Wextra
LDFLAGS = -lm

all: simd_demo benchmark

simd_demo: simd_ops.c
\t$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

benchmark: benchmark.c simd_ops.c
\t$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
\trm -f simd_demo benchmark

.PHONY: all clean`;
}


function CUDA_KERNEL_TEMPLATE(): string {
  return `/**
 * CUDA GPU Computing Example
 * 
 * Processa milhões de elementos em paralelo na GPU
 * Speedup típico: 10-100x vs CPU para workloads paralelos
 * 
 * Compilar: nvcc -O3 kernel.cu main.cpp -o cuda_demo
 */

#include <cuda_runtime.h>
#include <stdio.h>

// Macro para verificar erros CUDA
#define CUDA_CHECK(call) \\
    do { \\
        cudaError_t err = call; \\
        if (err != cudaSuccess) { \\
            fprintf(stderr, "CUDA error at %s:%d: %s\\n", \\
                    __FILE__, __LINE__, cudaGetErrorString(err)); \\
            exit(EXIT_FAILURE); \\
        } \\
    } while(0)

// ═══════════════════════════════════════════════════════════════════════════
// KERNELS CUDA
// ═══════════════════════════════════════════════════════════════════════════

// Kernel: Soma de vetores
__global__ void vector_add_kernel(const float* a, const float* b, float* c, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}

// Kernel: Multiplicação elemento a elemento
__global__ void vector_mul_kernel(const float* a, const float* b, float* c, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        c[idx] = a[idx] * b[idx];
    }
}

// Kernel: FMA (Fused Multiply-Add)
__global__ void vector_fma_kernel(const float* a, const float* b, 
                                   const float* c, float* d, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        d[idx] = __fmaf_rn(a[idx], b[idx], c[idx]);  // a*b + c
    }
}

// Kernel: Redução (soma de todos elementos)
__global__ void reduce_sum_kernel(const float* input, float* output, int n) {
    extern __shared__ float sdata[];
    
    int tid = threadIdx.x;
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    
    // Carrega dados para shared memory
    sdata[tid] = (idx < n) ? input[idx] : 0.0f;
    __syncthreads();
    
    // Redução em shared memory
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (tid < s) {
            sdata[tid] += sdata[tid + s];
        }
        __syncthreads();
    }
    
    // Thread 0 escreve resultado do bloco
    if (tid == 0) {
        atomicAdd(output, sdata[0]);
    }
}

// Kernel: Multiplicação de matrizes (versão simples)
__global__ void matrix_mul_kernel(const float* A, const float* B, float* C, int N) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    
    if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
            sum += A[row * N + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
}

// Kernel: Multiplicação de matrizes com shared memory (otimizado)
#define TILE_SIZE 16

__global__ void matrix_mul_tiled_kernel(const float* A, const float* B, float* C, int N) {
    __shared__ float As[TILE_SIZE][TILE_SIZE];
    __shared__ float Bs[TILE_SIZE][TILE_SIZE];
    
    int bx = blockIdx.x, by = blockIdx.y;
    int tx = threadIdx.x, ty = threadIdx.y;
    
    int row = by * TILE_SIZE + ty;
    int col = bx * TILE_SIZE + tx;
    
    float sum = 0.0f;
    
    for (int t = 0; t < (N + TILE_SIZE - 1) / TILE_SIZE; t++) {
        // Carrega tiles para shared memory
        if (row < N && t * TILE_SIZE + tx < N)
            As[ty][tx] = A[row * N + t * TILE_SIZE + tx];
        else
            As[ty][tx] = 0.0f;
            
        if (col < N && t * TILE_SIZE + ty < N)
            Bs[ty][tx] = B[(t * TILE_SIZE + ty) * N + col];
        else
            Bs[ty][tx] = 0.0f;
            
        __syncthreads();
        
        // Computa produto parcial
        for (int k = 0; k < TILE_SIZE; k++) {
            sum += As[ty][k] * Bs[k][tx];
        }
        
        __syncthreads();
    }
    
    if (row < N && col < N) {
        C[row * N + col] = sum;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPERS C++
// ═══════════════════════════════════════════════════════════════════════════

extern "C" {

void cuda_vector_add(const float* h_a, const float* h_b, float* h_c, int n) {
    float *d_a, *d_b, *d_c;
    size_t size = n * sizeof(float);
    
    // Aloca memória na GPU
    CUDA_CHECK(cudaMalloc(&d_a, size));
    CUDA_CHECK(cudaMalloc(&d_b, size));
    CUDA_CHECK(cudaMalloc(&d_c, size));
    
    // Copia dados para GPU
    CUDA_CHECK(cudaMemcpy(d_a, h_a, size, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_b, h_b, size, cudaMemcpyHostToDevice));
    
    // Configura grid e blocks
    int blockSize = 256;
    int numBlocks = (n + blockSize - 1) / blockSize;
    
    // Executa kernel
    vector_add_kernel<<<numBlocks, blockSize>>>(d_a, d_b, d_c, n);
    CUDA_CHECK(cudaGetLastError());
    
    // Copia resultado de volta
    CUDA_CHECK(cudaMemcpy(h_c, d_c, size, cudaMemcpyDeviceToHost));
    
    // Libera memória
    cudaFree(d_a);
    cudaFree(d_b);
    cudaFree(d_c);
}

void cuda_matrix_mul(const float* h_A, const float* h_B, float* h_C, int N) {
    float *d_A, *d_B, *d_C;
    size_t size = N * N * sizeof(float);
    
    CUDA_CHECK(cudaMalloc(&d_A, size));
    CUDA_CHECK(cudaMalloc(&d_B, size));
    CUDA_CHECK(cudaMalloc(&d_C, size));
    
    CUDA_CHECK(cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_B, h_B, size, cudaMemcpyHostToDevice));
    
    dim3 blockDim(TILE_SIZE, TILE_SIZE);
    dim3 gridDim((N + TILE_SIZE - 1) / TILE_SIZE, (N + TILE_SIZE - 1) / TILE_SIZE);
    
    matrix_mul_tiled_kernel<<<gridDim, blockDim>>>(d_A, d_B, d_C, N);
    CUDA_CHECK(cudaGetLastError());
    
    CUDA_CHECK(cudaMemcpy(h_C, d_C, size, cudaMemcpyDeviceToHost));
    
    cudaFree(d_A);
    cudaFree(d_B);
    cudaFree(d_C);
}

} // extern "C"`;
}

function CUDA_MAIN_TEMPLATE(): string {
  return `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

extern "C" {
    void cuda_vector_add(const float* a, const float* b, float* c, int n);
    void cuda_matrix_mul(const float* A, const float* B, float* C, int N);
}

int main() {
    const int N = 1000000;
    
    float *a = (float*)malloc(N * sizeof(float));
    float *b = (float*)malloc(N * sizeof(float));
    float *c = (float*)malloc(N * sizeof(float));
    
    for (int i = 0; i < N; i++) {
        a[i] = (float)rand() / RAND_MAX;
        b[i] = (float)rand() / RAND_MAX;
    }
    
    printf("CUDA Vector Add: %d elements\\n", N);
    cuda_vector_add(a, b, c, N);
    printf("Done! c[0] = %f\\n", c[0]);
    
    free(a);
    free(b);
    free(c);
    
    return 0;
}`;
}

function CUDA_MAKEFILE_TEMPLATE(): string {
  return `NVCC = nvcc
NVCCFLAGS = -O3 -arch=sm_75

all: cuda_demo

cuda_demo: kernel.cu main.cpp
\t$(NVCC) $(NVCCFLAGS) -o $@ $^

clean:
\trm -f cuda_demo

.PHONY: all clean`;
}

function OPENMP_TEMPLATE(): string {
  return `/**
 * OpenMP Parallel Computing
 * 
 * Paralelização automática de loops em múltiplos cores
 * Compilar: gcc -O3 -fopenmp parallel.c -o parallel_demo
 */

#include <stdio.h>
#include <stdlib.h>
#include <omp.h>
#include <math.h>

#define N 100000000

// Soma paralela de array
double parallel_sum(const double* arr, size_t n) {
    double sum = 0.0;
    
    #pragma omp parallel for reduction(+:sum)
    for (size_t i = 0; i < n; i++) {
        sum += arr[i];
    }
    
    return sum;
}

// Multiplicação de matrizes paralela
void parallel_matrix_mul(const double* A, const double* B, double* C, int n) {
    #pragma omp parallel for collapse(2)
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            double sum = 0.0;
            for (int k = 0; k < n; k++) {
                sum += A[i * n + k] * B[k * n + j];
            }
            C[i * n + j] = sum;
        }
    }
}

// Monte Carlo Pi estimation
double monte_carlo_pi(long samples) {
    long inside = 0;
    
    #pragma omp parallel reduction(+:inside)
    {
        unsigned int seed = omp_get_thread_num();
        
        #pragma omp for
        for (long i = 0; i < samples; i++) {
            double x = (double)rand_r(&seed) / RAND_MAX;
            double y = (double)rand_r(&seed) / RAND_MAX;
            if (x*x + y*y <= 1.0) {
                inside++;
            }
        }
    }
    
    return 4.0 * inside / samples;
}

int main() {
    printf("OpenMP Parallel Computing Demo\\n");
    printf("Threads available: %d\\n\\n", omp_get_max_threads());
    
    // Test parallel sum
    double *arr = malloc(N * sizeof(double));
    for (size_t i = 0; i < N; i++) arr[i] = 1.0;
    
    double t1 = omp_get_wtime();
    double sum = parallel_sum(arr, N);
    double t2 = omp_get_wtime();
    
    printf("Parallel Sum: %.0f (%.3f ms)\\n", sum, (t2-t1)*1000);
    
    // Test Monte Carlo Pi
    t1 = omp_get_wtime();
    double pi = monte_carlo_pi(100000000);
    t2 = omp_get_wtime();
    
    printf("Monte Carlo Pi: %.10f (%.3f ms)\\n", pi, (t2-t1)*1000);
    
    free(arr);
    return 0;
}`;
}

function OPENMP_MAKEFILE_TEMPLATE(): string {
  return `CC = gcc
CFLAGS = -O3 -fopenmp -Wall
LDFLAGS = -lm -fopenmp

all: parallel_demo

parallel_demo: parallel.c
\t$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
\trm -f parallel_demo

.PHONY: all clean`;
}

function RUST_RAYON_TEMPLATE(): string {
  return `//! Rust Rayon Parallel Computing
//! 
//! Data parallelism com zero-cost abstractions
//! cargo run --release

use rayon::prelude::*;
use std::time::Instant;

fn main() {
    println!("Rust Rayon Parallel Computing Demo\\n");
    
    let n = 100_000_000;
    let data: Vec<f64> = (0..n).map(|i| i as f64).collect();
    
    // Parallel sum
    let start = Instant::now();
    let sum: f64 = data.par_iter().sum();
    let duration = start.elapsed();
    println!("Parallel Sum: {} ({:.3} ms)", sum, duration.as_secs_f64() * 1000.0);
    
    // Parallel map
    let start = Instant::now();
    let squared: Vec<f64> = data.par_iter().map(|x| x * x).collect();
    let duration = start.elapsed();
    println!("Parallel Map (square): {} elements ({:.3} ms)", 
             squared.len(), duration.as_secs_f64() * 1000.0);
    
    // Parallel filter
    let start = Instant::now();
    let filtered: Vec<f64> = data.par_iter()
        .filter(|&&x| x % 2.0 == 0.0)
        .cloned()
        .collect();
    let duration = start.elapsed();
    println!("Parallel Filter (even): {} elements ({:.3} ms)", 
             filtered.len(), duration.as_secs_f64() * 1000.0);
    
    // Parallel reduce
    let start = Instant::now();
    let max = data.par_iter().reduce(|| &0.0, |a, b| if a > b { a } else { b });
    let duration = start.elapsed();
    println!("Parallel Max: {} ({:.3} ms)", max, duration.as_secs_f64() * 1000.0);
    
    // Monte Carlo Pi
    let samples = 100_000_000i64;
    let start = Instant::now();
    let inside: i64 = (0..samples)
        .into_par_iter()
        .map(|_| {
            let x: f64 = rand::random();
            let y: f64 = rand::random();
            if x*x + y*y <= 1.0 { 1 } else { 0 }
        })
        .sum();
    let pi = 4.0 * inside as f64 / samples as f64;
    let duration = start.elapsed();
    println!("Monte Carlo Pi: {:.10} ({:.3} ms)", pi, duration.as_secs_f64() * 1000.0);
}`;
}

function RUST_HPC_CARGO_TEMPLATE(): string {
  return `[package]
name = "hpc_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
rayon = "1.8"
rand = "0.8"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1`;
}


// ============================================================================
// COMBINAÇÕES POLYGLOT PARA HPC
// ============================================================================

export const HPC_POLYGLOT_COMBINATIONS = [
  {
    name: 'C/C++ SIMD + Python Interface',
    primary: 'cpp',
    secondary: 'python',
    useCase: 'Kernels otimizados em C++ com interface Python (NumPy style)',
    interop: 'pybind11, ctypes, Cython',
    example: 'NumPy, SciPy, TensorFlow'
  },
  {
    name: 'CUDA + Python',
    primary: 'cuda',
    secondary: 'python',
    useCase: 'GPU computing com interface Python',
    interop: 'PyCUDA, CuPy, Numba',
    example: 'PyTorch, JAX'
  },
  {
    name: 'Rust SIMD + Python',
    primary: 'rust',
    secondary: 'python',
    useCase: 'Kernels seguros em Rust com interface Python',
    interop: 'PyO3, maturin',
    example: 'Polars, pydantic-core'
  },
  {
    name: 'C++ + Rust Safety',
    primary: 'cpp',
    secondary: 'rust',
    useCase: 'Performance C++ com módulos críticos em Rust',
    interop: 'cxx, cbindgen',
    example: 'Firefox, Servo'
  },
  {
    name: 'Fortran + C',
    primary: 'fortran',
    secondary: 'c',
    useCase: 'Computação científica legada com interface C',
    interop: 'ISO_C_BINDING',
    example: 'BLAS, LAPACK'
  }
];

// ============================================================================
// DETECTOR DE REQUISITOS HPC
// ============================================================================

export function shouldEnableHPC(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // SIMD
    'simd', 'sse', 'avx', 'avx2', 'avx-512', 'avx512', 'neon', 'sve',
    'vectorização', 'vectorization', 'intrinsics',
    
    // GPU
    'cuda', 'opencl', 'vulkan compute', 'metal compute',
    'gpu computing', 'gpgpu', 'tensor cores',
    
    // Parallel
    'openmp', 'mpi', 'parallel', 'paralelo', 'multithread',
    'rayon', 'tbb', 'threading',
    
    // Performance
    'high performance', 'alta performance', 'hpc',
    'throughput', 'bandwidth', 'flops', 'gflops', 'tflops',
    'cache optimization', 'memory bandwidth',
    
    // Aplicações
    'matrix multiplication', 'multiplicação de matrizes',
    'dot product', 'produto escalar',
    'fft', 'convolution', 'convolução',
    'monte carlo', 'simulação', 'simulation',
    'machine learning', 'deep learning', 'neural network',
    
    // Lock-free
    'lock-free', 'wait-free', 'atomic', 'cas',
    'concurrent', 'concorrência'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const HIGH_PERFORMANCE_COMPUTING_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ⚡ HIGH PERFORMANCE COMPUTING MANIFEST - MESTRE DA VELOCIDADE ⚡         ║
║                                                                              ║
║     "CADA CICLO DE CPU CONTA. CADA CACHE MISS É UM CRIME.                   ║
║      OTIMIZAÇÃO NÃO É LUXO, É SOBREVIVÊNCIA."                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
⚡ HIERARQUIA DE PERFORMANCE
═══════════════════════════════════════════════════════════════════════════════

NÍVEL 1 - ALGORITMO:
├── Complexidade O(n) vs O(n²) vs O(n log n)
├── Escolha do algoritmo correto
└── Impacto: 10x - 1000x

NÍVEL 2 - CACHE:
├── Localidade espacial e temporal
├── Cache-friendly data structures
├── Blocking/Tiling para matrizes
└── Impacto: 2x - 10x

NÍVEL 3 - SIMD:
├── SSE: 4 floats por instrução
├── AVX2: 8 floats por instrução
├── AVX-512: 16 floats por instrução
└── Impacto: 2x - 8x

NÍVEL 4 - PARALELISMO:
├── Multi-threading (OpenMP, pthreads)
├── GPU (CUDA, OpenCL)
├── Distributed (MPI)
└── Impacto: Nx (N = cores/GPUs)

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS PARA HPC
═══════════════════════════════════════════════════════════════════════════════

✅ TIER 1 - MÁXIMA PERFORMANCE:
├── C         → Controle total, intrinsics
├── C++       → Zero-cost abstractions, templates
├── Rust      → Safety + performance, SIMD crates
├── Fortran   → Computação científica, auto-vectorization
└── Assembly  → Otimização manual de hot paths

✅ TIER 2 - BOA PERFORMANCE:
├── CUDA C/C++ → GPU computing
├── OpenCL C   → GPU portável
└── Julia      → JIT compilation, fácil de usar

⚠️ TIER 3 - INTERFACE (não para kernels):
├── Python    → NumPy, CuPy (chama C/CUDA)
└── MATLAB    → Prototipagem

❌ PROIBIDO PARA KERNELS HPC:
├── JavaScript
├── Java (GC pause)
├── Go (GC)
└── Ruby, PHP, etc

═══════════════════════════════════════════════════════════════════════════════
📊 SIMD EXTENSIONS POR ARQUITETURA
═══════════════════════════════════════════════════════════════════════════════

x86_64:
├── SSE (128-bit)   → 4 floats, 2 doubles
├── AVX (256-bit)   → 8 floats, 4 doubles
├── AVX2 (256-bit)  → + integer ops, FMA
├── AVX-512 (512-bit) → 16 floats, 8 doubles
└── Compilar: -msse4.2 -mavx2 -mfma -mavx512f

ARM:
├── NEON (128-bit)  → 4 floats
├── SVE (scalable)  → 128-2048 bits
└── Compilar: -march=armv8-a+simd

═══════════════════════════════════════════════════════════════════════════════
🎯 OTIMIZAÇÕES CRÍTICAS
═══════════════════════════════════════════════════════════════════════════════

1. ALINHAMENTO DE MEMÓRIA:
   float* data = aligned_alloc(32, n * sizeof(float));  // AVX
   float* data = aligned_alloc(64, n * sizeof(float));  // AVX-512

2. LOOP UNROLLING:
   for (int i = 0; i < n; i += 4) {
       result[i]   = a[i]   + b[i];
       result[i+1] = a[i+1] + b[i+1];
       result[i+2] = a[i+2] + b[i+2];
       result[i+3] = a[i+3] + b[i+3];
   }

3. BLOCKING PARA CACHE:
   // Processa em blocos que cabem no cache L1/L2
   for (int i0 = 0; i0 < N; i0 += BLOCK) {
       for (int j0 = 0; j0 < N; j0 += BLOCK) {
           // Processa bloco
       }
   }

4. PREFETCH:
   _mm_prefetch(&data[i + 64], _MM_HINT_T0);

5. BRANCH PREDICTION:
   if (__builtin_expect(condition, 1)) { ... }  // likely
   if (__builtin_expect(condition, 0)) { ... }  // unlikely

═══════════════════════════════════════════════════════════════════════════════
🔗 COMBINAÇÕES POLYGLOT VÁLIDAS
═══════════════════════════════════════════════════════════════════════════════

✅ C/C++ SIMD + Python:
   Kernels em C++, interface Python via pybind11
   Exemplo: NumPy, SciPy

✅ CUDA + Python:
   GPU kernels em CUDA, interface Python
   Exemplo: PyTorch, CuPy

✅ Rust + Python:
   Kernels seguros em Rust, interface Python via PyO3
   Exemplo: Polars

✅ Fortran + C:
   Computação científica em Fortran, interface C
   Exemplo: BLAS, LAPACK

═══════════════════════════════════════════════════════════════════════════════
📦 FERRAMENTAS ESSENCIAIS
═══════════════════════════════════════════════════════════════════════════════

PROFILING:
├── perf (Linux)
├── Intel VTune
├── NVIDIA Nsight
└── Valgrind (cachegrind)

BENCHMARKING:
├── Google Benchmark (C++)
├── criterion (Rust)
├── hyperfine (CLI)
└── timeit (Python)

COMPILADORES:
├── GCC (-O3 -march=native -ffast-math)
├── Clang (-O3 -march=native)
├── Intel ICC (-O3 -xHost)
└── NVCC (CUDA)

═══════════════════════════════════════════════════════════════════════════════

"PREMATURE OPTIMIZATION IS THE ROOT OF ALL EVIL.
 BUT KNOWING WHEN TO OPTIMIZE IS THE ROOT OF ALL PERFORMANCE."

                    — High Performance Computing Manifest, Level 96
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  HIGH_PERFORMANCE_COMPUTING_MANIFEST,
  HPC_TEMPLATES,
  HPC_POLYGLOT_COMBINATIONS,
  shouldEnableHPC
};