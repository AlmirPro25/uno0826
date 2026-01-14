/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     ⏱️ REALTIME RTOS MANIFEST - MESTRE DO TEMPO REAL ⏱️                     ║
 * ║                                                                              ║
 * ║     "EM SISTEMAS DE TEMPO REAL, TARDE É O MESMO QUE ERRADO.                 ║
 * ║      1 MILISSEGUNDO DE ATRASO PODE CUSTAR VIDAS."                           ║
 * ║                                                                              ║
 * ║     NÍVEL: 97 (GOD MODE - DETERMINISTIC TIME)                               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - FreeRTOS, Zephyr, RTEMS, VxWorks
 * - Hard Real-Time vs Soft Real-Time
 * - Task Scheduling (Rate Monotonic, EDF)
 * - Priority Inversion Prevention
 * - Deterministic Latency
 * - Safety-Critical Systems (DO-178C, IEC 61508)
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type RTOSPlatform = 'freertos' | 'zephyr' | 'rtems' | 'vxworks' | 'nuttx' | 'threadx' | 'bare-metal';
export type RealtimeClass = 'hard' | 'firm' | 'soft';
export type SchedulingAlgorithm = 'rate-monotonic' | 'edf' | 'priority-preemptive' | 'round-robin';

export interface RTOSConfig {
  platform: RTOSPlatform;
  realtimeClass: RealtimeClass;
  maxLatency: string; // e.g., "1ms", "100us", "10ns"
  scheduler: SchedulingAlgorithm;
  targetMCU: string;
  safetyStandard?: string; // DO-178C, IEC 61508, ISO 26262
}

export interface TaskConfig {
  name: string;
  priority: number;
  stackSize: number;
  period?: number; // Para tasks periódicas
  deadline?: number;
  wcet: number; // Worst Case Execution Time
}

// ============================================================================
// TEMPLATES DE RTOS
// ============================================================================

export const RTOS_TEMPLATES = {
  'freertos-basic': {
    name: 'FreeRTOS Basic Application',
    platform: 'freertos',
    files: {
      'main.c': FREERTOS_MAIN_TEMPLATE(),
      'tasks.c': FREERTOS_TASKS_TEMPLATE(),
      'FreeRTOSConfig.h': FREERTOS_CONFIG_TEMPLATE(),
      'CMakeLists.txt': FREERTOS_CMAKE_TEMPLATE()
    }
  },
  
  'zephyr-basic': {
    name: 'Zephyr RTOS Application',
    platform: 'zephyr',
    files: {
      'src/main.c': ZEPHYR_MAIN_TEMPLATE(),
      'prj.conf': ZEPHYR_CONFIG_TEMPLATE(),
      'CMakeLists.txt': ZEPHYR_CMAKE_TEMPLATE()
    }
  },
  
  'bare-metal-rtos': {
    name: 'Bare Metal Mini-RTOS',
    platform: 'bare-metal',
    files: {
      'kernel/scheduler.c': BARE_METAL_SCHEDULER(),
      'kernel/task.c': BARE_METAL_TASK(),
      'kernel/semaphore.c': BARE_METAL_SEMAPHORE(),
      'startup.s': BARE_METAL_STARTUP()
    }
  }
};

// ============================================================================
// TEMPLATES DE CÓDIGO
// ============================================================================

function FREERTOS_MAIN_TEMPLATE(): string {
  return `/**
 * FreeRTOS Application - Main Entry Point
 * 
 * Características:
 * - Preemptive scheduling
 * - Priority-based task management
 * - Inter-task communication (queues, semaphores)
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include "timers.h"

// Task handles
static TaskHandle_t xSensorTask = NULL;
static TaskHandle_t xControlTask = NULL;
static TaskHandle_t xCommTask = NULL;

// Synchronization primitives
static QueueHandle_t xSensorQueue = NULL;
static SemaphoreHandle_t xDataMutex = NULL;

// Shared data (protected by mutex)
typedef struct {
    float temperature;
    float pressure;
    uint32_t timestamp;
} SensorData_t;

static SensorData_t sharedData;

// Task: Sensor Reading (High Priority - Hard Real-Time)
void vSensorTask(void *pvParameters) {
    SensorData_t data;
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xPeriod = pdMS_TO_TICKS(10); // 10ms period = 100Hz
    
    for (;;) {
        // Read sensors (simulated)
        data.temperature = read_temperature_sensor();
        data.pressure = read_pressure_sensor();
        data.timestamp = xTaskGetTickCount();
        
        // Send to queue (non-blocking)
        xQueueSend(xSensorQueue, &data, 0);
        
        // Precise periodic execution
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

// Task: Control Loop (Medium Priority - Hard Real-Time)
void vControlTask(void *pvParameters) {
    SensorData_t data;
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xPeriod = pdMS_TO_TICKS(20); // 20ms period = 50Hz
    
    for (;;) {
        // Receive sensor data
        if (xQueueReceive(xSensorQueue, &data, pdMS_TO_TICKS(5)) == pdTRUE) {
            // Update shared data with mutex protection
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(1)) == pdTRUE) {
                sharedData = data;
                xSemaphoreGive(xDataMutex);
            }
            
            // Execute control algorithm
            execute_control_loop(&data);
        }
        
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

// Task: Communication (Low Priority - Soft Real-Time)
void vCommTask(void *pvParameters) {
    SensorData_t localData;
    
    for (;;) {
        // Copy shared data with mutex protection
        if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            localData = sharedData;
            xSemaphoreGive(xDataMutex);
        }
        
        // Send telemetry (can tolerate delays)
        send_telemetry(&localData);
        
        vTaskDelay(pdMS_TO_TICKS(100)); // 100ms = 10Hz
    }
}

int main(void) {
    // Hardware initialization
    hardware_init();
    
    // Create synchronization primitives
    xSensorQueue = xQueueCreate(10, sizeof(SensorData_t));
    xDataMutex = xSemaphoreCreateMutex();
    
    if (xSensorQueue == NULL || xDataMutex == NULL) {
        // Critical error - halt
        while (1);
    }
    
    // Create tasks with priorities
    // Higher number = higher priority in FreeRTOS
    xTaskCreate(vSensorTask, "Sensor", 256, NULL, 3, &xSensorTask);
    xTaskCreate(vControlTask, "Control", 512, NULL, 2, &xControlTask);
    xTaskCreate(vCommTask, "Comm", 256, NULL, 1, &xCommTask);
    
    // Start scheduler - never returns
    vTaskStartScheduler();
    
    // Should never reach here
    for (;;);
    return 0;
}

// Idle hook - runs when no tasks are ready
void vApplicationIdleHook(void) {
    // Enter low-power mode
    __WFI();
}

// Stack overflow hook
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName) {
    // Critical error - log and halt
    printf("Stack overflow in task: %s\\n", pcTaskName);
    while (1);
}`;
}

function FREERTOS_TASKS_TEMPLATE(): string {
  return `/**
 * FreeRTOS Task Implementations
 */

#include "FreeRTOS.h"
#include "task.h"
#include <stdint.h>

// Simulated sensor reading
float read_temperature_sensor(void) {
    // In real implementation: read from ADC/I2C/SPI
    static float temp = 25.0f;
    temp += ((float)(rand() % 100) - 50) / 1000.0f;
    return temp;
}

float read_pressure_sensor(void) {
    // In real implementation: read from sensor
    static float pressure = 1013.25f;
    pressure += ((float)(rand() % 100) - 50) / 100.0f;
    return pressure;
}

// Control algorithm (PID example)
typedef struct {
    float kp, ki, kd;
    float integral;
    float prev_error;
} PIDController_t;

static PIDController_t pid = {1.0f, 0.1f, 0.01f, 0.0f, 0.0f};

void execute_control_loop(void *data) {
    // Simplified PID control
    float setpoint = 25.0f;
    float current = ((SensorData_t*)data)->temperature;
    float error = setpoint - current;
    
    pid.integral += error;
    float derivative = error - pid.prev_error;
    pid.prev_error = error;
    
    float output = pid.kp * error + pid.ki * pid.integral + pid.kd * derivative;
    
    // Apply control output
    apply_actuator(output);
}

void apply_actuator(float value) {
    // In real implementation: PWM, DAC, etc.
}

void send_telemetry(void *data) {
    SensorData_t *d = (SensorData_t*)data;
    // In real implementation: UART, CAN, Ethernet, etc.
    printf("T=%.2f P=%.2f t=%lu\\n", d->temperature, d->pressure, d->timestamp);
}

void hardware_init(void) {
    // Initialize clocks, peripherals, etc.
}`;
}

function FREERTOS_CONFIG_TEMPLATE(): string {
  return `/**
 * FreeRTOS Configuration
 * 
 * CRITICAL: These settings affect real-time behavior!
 */

#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

// Scheduler settings
#define configUSE_PREEMPTION                    1
#define configUSE_PORT_OPTIMISED_TASK_SELECTION 1
#define configUSE_TICKLESS_IDLE                 0
#define configCPU_CLOCK_HZ                      168000000  // 168 MHz
#define configTICK_RATE_HZ                      1000       // 1ms tick
#define configMAX_PRIORITIES                    5
#define configMINIMAL_STACK_SIZE                128
#define configMAX_TASK_NAME_LEN                 16
#define configUSE_16_BIT_TICKS                  0
#define configIDLE_SHOULD_YIELD                 1

// Memory allocation
#define configSUPPORT_STATIC_ALLOCATION         1
#define configSUPPORT_DYNAMIC_ALLOCATION        1
#define configTOTAL_HEAP_SIZE                   (32 * 1024)
#define configAPPLICATION_ALLOCATED_HEAP        0

// Hook functions
#define configUSE_IDLE_HOOK                     1
#define configUSE_TICK_HOOK                     0
#define configCHECK_FOR_STACK_OVERFLOW          2
#define configUSE_MALLOC_FAILED_HOOK            1

// Runtime stats
#define configGENERATE_RUN_TIME_STATS           1
#define configUSE_TRACE_FACILITY                1
#define configUSE_STATS_FORMATTING_FUNCTIONS    1

// Co-routines (disabled for real-time)
#define configUSE_CO_ROUTINES                   0

// Software timers
#define configUSE_TIMERS                        1
#define configTIMER_TASK_PRIORITY               2
#define configTIMER_QUEUE_LENGTH                10
#define configTIMER_TASK_STACK_DEPTH            256

// Mutexes and semaphores
#define configUSE_MUTEXES                       1
#define configUSE_RECURSIVE_MUTEXES             1
#define configUSE_COUNTING_SEMAPHORES           1
#define configQUEUE_REGISTRY_SIZE               8

// Priority inheritance (prevents priority inversion!)
#define configUSE_TASK_NOTIFICATIONS            1
#define configTASK_NOTIFICATION_ARRAY_ENTRIES   3

// Interrupt nesting
#define configKERNEL_INTERRUPT_PRIORITY         255
#define configMAX_SYSCALL_INTERRUPT_PRIORITY    191
#define configMAX_API_CALL_INTERRUPT_PRIORITY   191

// Assert
#define configASSERT(x) if((x) == 0) { taskDISABLE_INTERRUPTS(); for(;;); }

// API includes
#define INCLUDE_vTaskPrioritySet                1
#define INCLUDE_uxTaskPriorityGet               1
#define INCLUDE_vTaskDelete                     1
#define INCLUDE_vTaskSuspend                    1
#define INCLUDE_vTaskDelayUntil                 1
#define INCLUDE_vTaskDelay                      1
#define INCLUDE_xTaskGetSchedulerState          1
#define INCLUDE_xTaskGetCurrentTaskHandle       1
#define INCLUDE_uxTaskGetStackHighWaterMark     1
#define INCLUDE_xTaskGetIdleTaskHandle          1
#define INCLUDE_eTaskGetState                   1
#define INCLUDE_xTimerPendFunctionCall          1
#define INCLUDE_xTaskAbortDelay                 1
#define INCLUDE_xTaskGetHandle                  1
#define INCLUDE_xTaskResumeFromISR              1

#endif /* FREERTOS_CONFIG_H */`;
}


function FREERTOS_CMAKE_TEMPLATE(): string {
  return `cmake_minimum_required(VERSION 3.20)
project(freertos_app C ASM)

set(CMAKE_C_STANDARD 11)

# FreeRTOS source
set(FREERTOS_DIR \${CMAKE_SOURCE_DIR}/FreeRTOS)

# Include directories
include_directories(
    \${CMAKE_SOURCE_DIR}/include
    \${FREERTOS_DIR}/include
    \${FREERTOS_DIR}/portable/GCC/ARM_CM4F
)

# FreeRTOS sources
set(FREERTOS_SOURCES
    \${FREERTOS_DIR}/tasks.c
    \${FREERTOS_DIR}/queue.c
    \${FREERTOS_DIR}/list.c
    \${FREERTOS_DIR}/timers.c
    \${FREERTOS_DIR}/event_groups.c
    \${FREERTOS_DIR}/stream_buffer.c
    \${FREERTOS_DIR}/portable/GCC/ARM_CM4F/port.c
    \${FREERTOS_DIR}/portable/MemMang/heap_4.c
)

# Application sources
set(APP_SOURCES
    src/main.c
    src/tasks.c
    startup.s
)

add_executable(\${PROJECT_NAME} \${APP_SOURCES} \${FREERTOS_SOURCES})

# Compiler flags for ARM Cortex-M4
target_compile_options(\${PROJECT_NAME} PRIVATE
    -mcpu=cortex-m4
    -mthumb
    -mfloat-abi=hard
    -mfpu=fpv4-sp-d16
    -O2
    -Wall -Wextra
    -ffunction-sections
    -fdata-sections
)

# Linker flags
target_link_options(\${PROJECT_NAME} PRIVATE
    -mcpu=cortex-m4
    -mthumb
    -mfloat-abi=hard
    -mfpu=fpv4-sp-d16
    -T\${CMAKE_SOURCE_DIR}/linker.ld
    -Wl,--gc-sections
    -Wl,-Map=\${PROJECT_NAME}.map
)`;
}

function ZEPHYR_MAIN_TEMPLATE(): string {
  return `/**
 * Zephyr RTOS Application
 * 
 * Zephyr features:
 * - Device Tree based configuration
 * - Kconfig for build options
 * - Native POSIX simulation support
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/logging/log.h>

LOG_MODULE_REGISTER(main, LOG_LEVEL_INF);

// Thread stack sizes
#define SENSOR_STACK_SIZE 1024
#define CONTROL_STACK_SIZE 2048
#define COMM_STACK_SIZE 1024

// Thread priorities (lower = higher priority in Zephyr)
#define SENSOR_PRIORITY 2
#define CONTROL_PRIORITY 3
#define COMM_PRIORITY 5

// Thread stacks
K_THREAD_STACK_DEFINE(sensor_stack, SENSOR_STACK_SIZE);
K_THREAD_STACK_DEFINE(control_stack, CONTROL_STACK_SIZE);
K_THREAD_STACK_DEFINE(comm_stack, COMM_STACK_SIZE);

// Thread data
static struct k_thread sensor_thread;
static struct k_thread control_thread;
static struct k_thread comm_thread;

// Message queue
K_MSGQ_DEFINE(sensor_msgq, sizeof(struct sensor_data), 10, 4);

// Mutex for shared data
K_MUTEX_DEFINE(data_mutex);

struct sensor_data {
    float temperature;
    float pressure;
    int64_t timestamp;
};

static struct sensor_data shared_data;

// Sensor thread - 100Hz (10ms period)
void sensor_thread_fn(void *p1, void *p2, void *p3) {
    struct sensor_data data;
    
    while (1) {
        // Read sensors
        data.temperature = 25.0f + (k_uptime_get() % 100) / 100.0f;
        data.pressure = 1013.25f;
        data.timestamp = k_uptime_get();
        
        // Send to queue
        k_msgq_put(&sensor_msgq, &data, K_NO_WAIT);
        
        // Sleep for period
        k_sleep(K_MSEC(10));
    }
}

// Control thread - 50Hz (20ms period)
void control_thread_fn(void *p1, void *p2, void *p3) {
    struct sensor_data data;
    
    while (1) {
        // Receive from queue
        if (k_msgq_get(&sensor_msgq, &data, K_MSEC(5)) == 0) {
            // Update shared data
            k_mutex_lock(&data_mutex, K_MSEC(1));
            shared_data = data;
            k_mutex_unlock(&data_mutex);
            
            // Control algorithm
            LOG_INF("Control: T=%.2f", data.temperature);
        }
        
        k_sleep(K_MSEC(20));
    }
}

// Communication thread - 10Hz (100ms period)
void comm_thread_fn(void *p1, void *p2, void *p3) {
    struct sensor_data local_data;
    
    while (1) {
        // Copy shared data
        k_mutex_lock(&data_mutex, K_MSEC(10));
        local_data = shared_data;
        k_mutex_unlock(&data_mutex);
        
        // Send telemetry
        LOG_INF("Telemetry: T=%.2f P=%.2f", 
                local_data.temperature, local_data.pressure);
        
        k_sleep(K_MSEC(100));
    }
}

int main(void) {
    LOG_INF("Zephyr RTOS Application Started");
    
    // Create threads
    k_thread_create(&sensor_thread, sensor_stack, SENSOR_STACK_SIZE,
                    sensor_thread_fn, NULL, NULL, NULL,
                    SENSOR_PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(&sensor_thread, "sensor");
    
    k_thread_create(&control_thread, control_stack, CONTROL_STACK_SIZE,
                    control_thread_fn, NULL, NULL, NULL,
                    CONTROL_PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(&control_thread, "control");
    
    k_thread_create(&comm_thread, comm_stack, COMM_STACK_SIZE,
                    comm_thread_fn, NULL, NULL, NULL,
                    COMM_PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(&comm_thread, "comm");
    
    return 0;
}`;
}

function ZEPHYR_CONFIG_TEMPLATE(): string {
  return `# Zephyr Project Configuration

# Kernel options
CONFIG_MAIN_STACK_SIZE=2048
CONFIG_SYSTEM_WORKQUEUE_STACK_SIZE=1024
CONFIG_HEAP_MEM_POOL_SIZE=4096

# Scheduling
CONFIG_TIMESLICING=y
CONFIG_TIMESLICE_SIZE=10
CONFIG_SCHED_DUMB=n
CONFIG_SCHED_SCALABLE=y

# Logging
CONFIG_LOG=y
CONFIG_LOG_DEFAULT_LEVEL=3
CONFIG_LOG_BUFFER_SIZE=1024

# Shell (for debugging)
CONFIG_SHELL=y
CONFIG_SHELL_BACKEND_SERIAL=y

# Thread analyzer
CONFIG_THREAD_ANALYZER=y
CONFIG_THREAD_ANALYZER_USE_PRINTK=y

# Stack sentinel
CONFIG_STACK_SENTINEL=y

# Float support
CONFIG_FPU=y
CONFIG_FPU_SHARING=y

# Timing
CONFIG_TIMING_FUNCTIONS=y`;
}

function ZEPHYR_CMAKE_TEMPLATE(): string {
  return `cmake_minimum_required(VERSION 3.20)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(zephyr_app)

target_sources(app PRIVATE src/main.c)`;
}

function BARE_METAL_SCHEDULER(): string {
  return `/**
 * Bare Metal Mini-RTOS Scheduler
 * 
 * Simple preemptive scheduler with priority-based scheduling
 */

#include <stdint.h>
#include <stdbool.h>
#include "task.h"

#define MAX_TASKS 8
#define TICK_RATE_MS 1

typedef enum {
    TASK_READY,
    TASK_RUNNING,
    TASK_BLOCKED,
    TASK_SUSPENDED
} TaskState;

typedef struct {
    uint32_t *sp;           // Stack pointer
    uint32_t *stack_base;   // Stack base
    uint32_t stack_size;    // Stack size
    uint8_t priority;       // Priority (0 = highest)
    TaskState state;        // Current state
    uint32_t delay_ticks;   // Delay counter
    void (*entry)(void*);   // Entry function
    void *arg;              // Argument
    char name[16];          // Task name
} TCB_t;

static TCB_t tasks[MAX_TASKS];
static uint8_t task_count = 0;
static uint8_t current_task = 0;
static volatile uint32_t tick_count = 0;

// Assembly context switch (defined in startup.s)
extern void context_switch(uint32_t **old_sp, uint32_t *new_sp);
extern void start_first_task(uint32_t *sp);

// Initialize task stack
static uint32_t* init_stack(uint32_t *stack_top, void (*entry)(void*), void *arg) {
    // ARM Cortex-M stack frame (exception return)
    *(--stack_top) = 0x01000000;        // xPSR (Thumb bit)
    *(--stack_top) = (uint32_t)entry;   // PC
    *(--stack_top) = 0xFFFFFFFD;        // LR (return to thread mode)
    *(--stack_top) = 0;                 // R12
    *(--stack_top) = 0;                 // R3
    *(--stack_top) = 0;                 // R2
    *(--stack_top) = 0;                 // R1
    *(--stack_top) = (uint32_t)arg;     // R0 (argument)
    
    // Software saved registers
    *(--stack_top) = 0;  // R11
    *(--stack_top) = 0;  // R10
    *(--stack_top) = 0;  // R9
    *(--stack_top) = 0;  // R8
    *(--stack_top) = 0;  // R7
    *(--stack_top) = 0;  // R6
    *(--stack_top) = 0;  // R5
    *(--stack_top) = 0;  // R4
    
    return stack_top;
}

// Create a new task
int task_create(const char *name, void (*entry)(void*), void *arg,
                uint8_t priority, uint32_t *stack, uint32_t stack_size) {
    if (task_count >= MAX_TASKS) return -1;
    
    TCB_t *task = &tasks[task_count];
    
    strncpy(task->name, name, 15);
    task->name[15] = '\\0';
    task->stack_base = stack;
    task->stack_size = stack_size;
    task->priority = priority;
    task->state = TASK_READY;
    task->delay_ticks = 0;
    task->entry = entry;
    task->arg = arg;
    
    // Initialize stack
    task->sp = init_stack(stack + stack_size, entry, arg);
    
    task_count++;
    return task_count - 1;
}

// Find highest priority ready task
static uint8_t find_next_task(void) {
    uint8_t highest_priority = 255;
    uint8_t next_task = current_task;
    
    for (uint8_t i = 0; i < task_count; i++) {
        if (tasks[i].state == TASK_READY && tasks[i].priority < highest_priority) {
            highest_priority = tasks[i].priority;
            next_task = i;
        }
    }
    
    return next_task;
}

// Scheduler tick (called from SysTick ISR)
void scheduler_tick(void) {
    tick_count++;
    
    // Update delay counters
    for (uint8_t i = 0; i < task_count; i++) {
        if (tasks[i].state == TASK_BLOCKED && tasks[i].delay_ticks > 0) {
            tasks[i].delay_ticks--;
            if (tasks[i].delay_ticks == 0) {
                tasks[i].state = TASK_READY;
            }
        }
    }
    
    // Trigger context switch if needed
    uint8_t next = find_next_task();
    if (next != current_task) {
        // Trigger PendSV for context switch
        SCB->ICSR |= SCB_ICSR_PENDSVSET_Msk;
    }
}

// Context switch handler (PendSV)
void PendSV_Handler(void) {
    uint8_t next = find_next_task();
    
    if (next != current_task) {
        tasks[current_task].state = TASK_READY;
        context_switch(&tasks[current_task].sp, tasks[next].sp);
        current_task = next;
        tasks[current_task].state = TASK_RUNNING;
    }
}

// Delay current task
void task_delay(uint32_t ticks) {
    tasks[current_task].delay_ticks = ticks;
    tasks[current_task].state = TASK_BLOCKED;
    
    // Trigger reschedule
    SCB->ICSR |= SCB_ICSR_PENDSVSET_Msk;
}

// Start scheduler
void scheduler_start(void) {
    if (task_count == 0) return;
    
    // Configure SysTick for 1ms tick
    SysTick_Config(SystemCoreClock / 1000);
    
    // Set PendSV to lowest priority
    NVIC_SetPriority(PendSV_IRQn, 0xFF);
    
    // Start first task
    current_task = find_next_task();
    tasks[current_task].state = TASK_RUNNING;
    start_first_task(tasks[current_task].sp);
}`;
}

function BARE_METAL_TASK(): string {
  return `// Task management functions - see scheduler.c`;
}

function BARE_METAL_SEMAPHORE(): string {
  return `/**
 * Bare Metal Semaphore Implementation
 */

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    volatile int32_t count;
    // Wait queue would go here in full implementation
} Semaphore_t;

void semaphore_init(Semaphore_t *sem, int32_t initial) {
    sem->count = initial;
}

bool semaphore_take(Semaphore_t *sem, uint32_t timeout) {
    // Disable interrupts for atomic operation
    __disable_irq();
    
    if (sem->count > 0) {
        sem->count--;
        __enable_irq();
        return true;
    }
    
    __enable_irq();
    
    // In full implementation: block task and wait
    // For now: busy wait with timeout
    uint32_t start = tick_count;
    while (tick_count - start < timeout) {
        __disable_irq();
        if (sem->count > 0) {
            sem->count--;
            __enable_irq();
            return true;
        }
        __enable_irq();
    }
    
    return false;
}

void semaphore_give(Semaphore_t *sem) {
    __disable_irq();
    sem->count++;
    __enable_irq();
    
    // In full implementation: wake waiting task
}`;
}

function BARE_METAL_STARTUP(): string {
  return `/* ARM Cortex-M Startup and Context Switch */

.syntax unified
.cpu cortex-m4
.thumb

.global Reset_Handler
.global context_switch
.global start_first_task

/* Vector table */
.section .isr_vector, "a"
.word _estack
.word Reset_Handler
.word NMI_Handler
.word HardFault_Handler
/* ... more vectors ... */
.word SysTick_Handler
.word PendSV_Handler

/* Reset handler */
.section .text
.type Reset_Handler, %function
Reset_Handler:
    /* Initialize stack pointer */
    ldr sp, =_estack
    
    /* Copy .data section */
    ldr r0, =_sdata
    ldr r1, =_edata
    ldr r2, =_sidata
copy_data:
    cmp r0, r1
    bge zero_bss
    ldr r3, [r2], #4
    str r3, [r0], #4
    b copy_data

    /* Zero .bss section */
zero_bss:
    ldr r0, =_sbss
    ldr r1, =_ebss
    mov r2, #0
zero_loop:
    cmp r0, r1
    bge call_main
    str r2, [r0], #4
    b zero_loop

call_main:
    bl main
    b .

/* Context switch: save current, restore next */
.type context_switch, %function
context_switch:
    /* r0 = &old_sp, r1 = new_sp */
    
    /* Save current context */
    push {r4-r11, lr}
    str sp, [r0]
    
    /* Restore new context */
    mov sp, r1
    pop {r4-r11, lr}
    
    bx lr

/* Start first task */
.type start_first_task, %function
start_first_task:
    /* r0 = sp of first task */
    mov sp, r0
    pop {r4-r11, lr}
    pop {r0-r3, r12, lr, pc, xpsr}
    
    /* Never returns */`;
}


// ============================================================================
// COMBINAÇÕES POLYGLOT PARA RTOS
// ============================================================================

export const RTOS_POLYGLOT_COMBINATIONS = [
  {
    name: 'C RTOS + Rust Safety Modules',
    primary: 'c',
    secondary: 'rust',
    useCase: 'FreeRTOS em C com módulos críticos em Rust',
    interop: 'FFI, extern "C"',
    latencyImpact: 'Mínimo (zero-cost abstractions)'
  },
  {
    name: 'C RTOS + Assembly ISR',
    primary: 'c',
    secondary: 'assembly',
    useCase: 'Kernel em C, ISRs críticas em Assembly',
    interop: 'Inline assembly ou .S files',
    latencyImpact: 'Nenhum (máxima performance)'
  },
  {
    name: 'Rust RTOS + C HAL',
    primary: 'rust',
    secondary: 'c',
    useCase: 'RTOS em Rust usando HAL em C do fabricante',
    interop: 'bindgen, unsafe blocks',
    latencyImpact: 'Mínimo'
  },
  {
    name: 'RTOS + Python Simulation',
    primary: 'c',
    secondary: 'python',
    useCase: 'RTOS real + simulação/teste em Python',
    interop: 'Separados (HIL testing)',
    latencyImpact: 'N/A (ambientes separados)'
  }
];

// ============================================================================
// DETECTOR DE REQUISITOS RTOS
// ============================================================================

export function shouldEnableRTOS(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // RTOS específicos
    'freertos', 'zephyr', 'rtems', 'vxworks', 'nuttx', 'threadx',
    'rtos', 'real-time os', 'sistema operacional de tempo real',
    
    // Conceitos de tempo real
    'tempo real', 'real-time', 'real time', 'hard real-time', 'soft real-time',
    'determinístico', 'deterministic', 'deadline', 'wcet',
    'latência garantida', 'guaranteed latency',
    
    // Scheduling
    'rate monotonic', 'edf', 'earliest deadline first',
    'priority inversion', 'priority inheritance',
    'preemptive', 'preemption', 'scheduler',
    
    // Tasks
    'task', 'thread', 'semaphore', 'mutex', 'queue',
    'inter-task', 'ipc', 'message passing',
    
    // Timing
    'tick', 'timer', 'watchdog', 'periodic task',
    'jitter', 'latency', 'response time',
    
    // Safety
    'safety-critical', 'do-178', 'iec 61508', 'iso 26262',
    'misra', 'autosar', 'arinc 653',
    
    // Aplicações
    'controle de voo', 'flight control', 'automotive',
    'medical device', 'industrial control', 'plc'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const REALTIME_RTOS_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ⏱️ REALTIME RTOS MANIFEST - MESTRE DO TEMPO REAL ⏱️                     ║
║                                                                              ║
║     "EM SISTEMAS DE TEMPO REAL, TARDE É O MESMO QUE ERRADO.                 ║
║      1 MILISSEGUNDO DE ATRASO PODE CUSTAR VIDAS."                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
⏱️ CLASSIFICAÇÃO DE SISTEMAS DE TEMPO REAL
═══════════════════════════════════════════════════════════════════════════════

HARD REAL-TIME:
├── Deadline NUNCA pode ser perdido
├── Falha = catástrofe (vidas, equipamentos)
├── Exemplos: Controle de voo, ABS, pacemaker
├── Latência: microsegundos a milissegundos
└── Linguagens: C, Rust, Assembly APENAS

FIRM REAL-TIME:
├── Deadline ocasionalmente perdido é tolerável
├── Resultado tardio tem valor reduzido
├── Exemplos: Streaming de vídeo, robótica
├── Latência: milissegundos
└── Linguagens: C, Rust, C++

SOFT REAL-TIME:
├── Deadline é desejável mas não crítico
├── Resultado tardio ainda é útil
├── Exemplos: UI responsiva, jogos
├── Latência: dezenas de milissegundos
└── Linguagens: C, C++, Rust, Go (com cuidado)

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS PARA RTOS
═══════════════════════════════════════════════════════════════════════════════

✅ OBRIGATÓRIO PARA HARD REAL-TIME:
├── C (C11)      → Padrão da indústria, MISRA-C
├── Rust         → Memory safety, no_std
└── Assembly     → ISRs críticas, context switch

⚠️ PERMITIDO COM RESTRIÇÕES:
├── C++          → Sem exceções, sem RTTI, sem STL dinâmica
└── Ada          → SPARK para safety-critical

❌ PROIBIDO PARA REAL-TIME:
├── JavaScript/TypeScript → GC imprevisível
├── Python                → GC, GIL
├── Java                  → GC, JIT
├── Go                    → GC (mesmo com tuning)
└── C# / .NET             → GC

═══════════════════════════════════════════════════════════════════════════════
📋 RTOS POPULARES E SUAS CARACTERÍSTICAS
═══════════════════════════════════════════════════════════════════════════════

FreeRTOS:
├── Licença: MIT
├── Footprint: ~10KB
├── Plataformas: ARM, RISC-V, x86, etc
├── Certificações: SAFERTOS (IEC 61508, ISO 26262)
└── Ideal para: IoT, embedded geral

Zephyr:
├── Licença: Apache 2.0
├── Footprint: ~8KB mínimo
├── Plataformas: 400+ boards
├── Features: Device Tree, Kconfig, native POSIX
└── Ideal para: IoT, wearables, industrial

RTEMS:
├── Licença: BSD
├── Footprint: ~100KB
├── Plataformas: ARM, SPARC, PowerPC, x86
├── Certificações: DO-178B (aerospace)
└── Ideal para: Aerospace, space missions

VxWorks:
├── Licença: Comercial
├── Footprint: Variável
├── Certificações: DO-178C, IEC 61508
└── Ideal para: Aerospace, defense, medical

═══════════════════════════════════════════════════════════════════════════════
⚠️ REGRAS INVIOLÁVEIS PARA CÓDIGO REAL-TIME
═══════════════════════════════════════════════════════════════════════════════

1. NUNCA use alocação dinâmica em runtime
   → Aloque tudo na inicialização
   → Use pools de memória estáticos

2. NUNCA use recursão ilimitada
   → Stack overflow = crash
   → Prefira iteração

3. SEMPRE conheça o WCET de cada função
   → Worst Case Execution Time
   → Meça, não adivinhe

4. NUNCA bloqueie em seções críticas
   → Desabilite interrupções brevemente
   → Use spinlocks com timeout

5. SEMPRE use priority inheritance
   → Evita priority inversion
   → Configuração do RTOS

6. NUNCA durma em ISR
   → ISR deve ser < 10us idealmente
   → Defer work para tasks

7. SEMPRE valide timing em hardware real
   → Simulação não é suficiente
   → Use osciloscópio/logic analyzer

8. NUNCA confie em timing de software
   → Use hardware timers
   → Capture timestamps em ISR

═══════════════════════════════════════════════════════════════════════════════
🏗️ ESTRUTURA DE PROJETO RTOS
═══════════════════════════════════════════════════════════════════════════════

rtos-project/
├── src/
│   ├── main.c              # Inicialização e criação de tasks
│   ├── tasks/
│   │   ├── sensor_task.c   # Task de leitura de sensores
│   │   ├── control_task.c  # Task de controle (PID, etc)
│   │   └── comm_task.c     # Task de comunicação
│   ├── drivers/
│   │   ├── uart.c          # Driver UART
│   │   ├── spi.c           # Driver SPI
│   │   └── adc.c           # Driver ADC
│   └── hal/
│       └── stm32f4xx_hal.c # Hardware Abstraction Layer
├── include/
│   ├── FreeRTOSConfig.h    # Configuração do RTOS
│   ├── tasks.h             # Headers das tasks
│   └── drivers.h           # Headers dos drivers
├── startup/
│   ├── startup.s           # Startup assembly
│   └── system_init.c       # Clock, peripherals init
├── linker/
│   └── linker.ld           # Linker script
├── test/
│   ├── unit/               # Testes unitários
│   └── integration/        # Testes de integração
├── CMakeLists.txt
└── Makefile

═══════════════════════════════════════════════════════════════════════════════

"O TEMPO É O RECURSO MAIS PRECIOSO. EM RTOS, ELE É SAGRADO."

                    — Realtime RTOS Manifest, Level 97
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  REALTIME_RTOS_MANIFEST,
  RTOS_TEMPLATES,
  RTOS_POLYGLOT_COMBINATIONS,
  shouldEnableRTOS
};