/**
 * ============================================================================
 * FreeRTOS - EXEMPLO COMPLETO DE RTOS
 * ============================================================================
 * 
 * Este exemplo demonstra os principais conceitos de FreeRTOS:
 * - Tasks (tarefas)
 * - Queues (filas)
 * - Semaphores (semáforos)
 * - Mutexes
 * - Timers
 * - Event Groups
 * 
 * Para compilar, você precisa do FreeRTOS SDK instalado.
 * Este código é para referência e estudo.
 * 
 * Plataformas suportadas:
 * - ESP32 (ESP-IDF)
 * - STM32 (STM32CubeIDE)
 * - Raspberry Pi Pico
 * - Simulador POSIX
 * 
 * ============================================================================
 */

#include <stdio.h>
#include <string.h>
#include <stdint.h>

// Headers FreeRTOS (ajuste conforme sua plataforma)
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include "timers.h"
#include "event_groups.h"

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

#define TASK_STACK_SIZE     configMINIMAL_STACK_SIZE * 2
#define QUEUE_LENGTH        10
#define QUEUE_ITEM_SIZE     sizeof(SensorData)

// Event bits
#define EVENT_SENSOR_READY  (1 << 0)
#define EVENT_DATA_PROCESSED (1 << 1)
#define EVENT_ALARM_TRIGGERED (1 << 2)

// ============================================================================
// ESTRUTURAS DE DADOS
// ============================================================================

typedef struct {
    uint32_t sensor_id;
    float temperature;
    float humidity;
    uint32_t timestamp;
} SensorData;

typedef struct {
    uint32_t total_readings;
    float avg_temperature;
    float avg_humidity;
    float max_temperature;
    float min_temperature;
} Statistics;

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

// Handles
static TaskHandle_t sensor_task_handle = NULL;
static TaskHandle_t processor_task_handle = NULL;
static TaskHandle_t display_task_handle = NULL;
static TaskHandle_t alarm_task_handle = NULL;

static QueueHandle_t sensor_queue = NULL;
static SemaphoreHandle_t stats_mutex = NULL;
static SemaphoreHandle_t uart_semaphore = NULL;
static TimerHandle_t watchdog_timer = NULL;
static EventGroupHandle_t system_events = NULL;

// Dados compartilhados (protegidos por mutex)
static Statistics global_stats = {0};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Simula leitura de sensor
 */
static void read_sensor(SensorData *data, uint32_t sensor_id)
{
    data->sensor_id = sensor_id;
    data->temperature = 20.0f + (float)(rand() % 200) / 10.0f;  // 20-40°C
    data->humidity = 30.0f + (float)(rand() % 500) / 10.0f;     // 30-80%
    data->timestamp = xTaskGetTickCount();
}

/**
 * Print thread-safe (protegido por semáforo)
 */
static void safe_print(const char *format, ...)
{
    if (xSemaphoreTake(uart_semaphore, pdMS_TO_TICKS(100)) == pdTRUE) {
        va_list args;
        va_start(args, format);
        vprintf(format, args);
        va_end(args);
        xSemaphoreGive(uart_semaphore);
    }
}

// ============================================================================
// TASK: SENSOR (Produtor)
// ============================================================================

/**
 * Task que lê sensores e envia dados para a fila
 */
static void sensor_task(void *pvParameters)
{
    SensorData data;
    uint32_t sensor_id = (uint32_t)pvParameters;
    
    safe_print("[SENSOR %lu] Task started\n", sensor_id);
    
    while (1) {
        // Lê sensor
        read_sensor(&data, sensor_id);
        
        // Envia para fila (bloqueia se fila cheia)
        if (xQueueSend(sensor_queue, &data, pdMS_TO_TICKS(1000)) == pdTRUE) {
            safe_print("[SENSOR %lu] Sent: T=%.1f°C, H=%.1f%%\n",
                      sensor_id, data.temperature, data.humidity);
            
            // Sinaliza que dados estão prontos
            xEventGroupSetBits(system_events, EVENT_SENSOR_READY);
        } else {
            safe_print("[SENSOR %lu] Queue full!\n", sensor_id);
        }
        
        // Delay entre leituras
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// ============================================================================
// TASK: PROCESSOR (Consumidor)
// ============================================================================

/**
 * Task que processa dados dos sensores
 */
static void processor_task(void *pvParameters)
{
    SensorData data;
    
    safe_print("[PROCESSOR] Task started\n");
    
    while (1) {
        // Aguarda dados na fila
        if (xQueueReceive(sensor_queue, &data, pdMS_TO_TICKS(5000)) == pdTRUE) {
            
            // Atualiza estatísticas (protegido por mutex)
            if (xSemaphoreTake(stats_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                
                global_stats.total_readings++;
                
                // Média móvel
                float n = (float)global_stats.total_readings;
                global_stats.avg_temperature = 
                    ((n - 1) * global_stats.avg_temperature + data.temperature) / n;
                global_stats.avg_humidity = 
                    ((n - 1) * global_stats.avg_humidity + data.humidity) / n;
                
                // Max/Min
                if (global_stats.total_readings == 1) {
                    global_stats.max_temperature = data.temperature;
                    global_stats.min_temperature = data.temperature;
                } else {
                    if (data.temperature > global_stats.max_temperature)
                        global_stats.max_temperature = data.temperature;
                    if (data.temperature < global_stats.min_temperature)
                        global_stats.min_temperature = data.temperature;
                }
                
                xSemaphoreGive(stats_mutex);
            }
            
            // Verifica alarme
            if (data.temperature > 35.0f) {
                xEventGroupSetBits(system_events, EVENT_ALARM_TRIGGERED);
            }
            
            // Sinaliza processamento completo
            xEventGroupSetBits(system_events, EVENT_DATA_PROCESSED);
            
            safe_print("[PROCESSOR] Processed sensor %lu data\n", data.sensor_id);
        }
    }
}

// ============================================================================
// TASK: DISPLAY
// ============================================================================

/**
 * Task que exibe estatísticas periodicamente
 */
static void display_task(void *pvParameters)
{
    Statistics local_stats;
    
    safe_print("[DISPLAY] Task started\n");
    
    while (1) {
        // Aguarda evento de dados processados
        EventBits_t bits = xEventGroupWaitBits(
            system_events,
            EVENT_DATA_PROCESSED,
            pdTRUE,  // Clear bits on exit
            pdFALSE, // Wait for any bit
            pdMS_TO_TICKS(5000)
        );
        
        if (bits & EVENT_DATA_PROCESSED) {
            // Copia estatísticas (protegido por mutex)
            if (xSemaphoreTake(stats_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                memcpy(&local_stats, &global_stats, sizeof(Statistics));
                xSemaphoreGive(stats_mutex);
            }
            
            safe_print("\n╔════════════════════════════════════╗\n");
            safe_print("║         SYSTEM STATISTICS          ║\n");
            safe_print("╠════════════════════════════════════╣\n");
            safe_print("║ Total Readings: %10lu         ║\n", local_stats.total_readings);
            safe_print("║ Avg Temperature: %8.2f°C       ║\n", local_stats.avg_temperature);
            safe_print("║ Avg Humidity:    %8.2f%%        ║\n", local_stats.avg_humidity);
            safe_print("║ Max Temperature: %8.2f°C       ║\n", local_stats.max_temperature);
            safe_print("║ Min Temperature: %8.2f°C       ║\n", local_stats.min_temperature);
            safe_print("╚════════════════════════════════════╝\n\n");
        }
    }
}

// ============================================================================
// TASK: ALARM
// ============================================================================

/**
 * Task que monitora alarmes
 */
static void alarm_task(void *pvParameters)
{
    safe_print("[ALARM] Task started\n");
    
    while (1) {
        // Aguarda evento de alarme
        EventBits_t bits = xEventGroupWaitBits(
            system_events,
            EVENT_ALARM_TRIGGERED,
            pdTRUE,  // Clear bits on exit
            pdFALSE,
            portMAX_DELAY
        );
        
        if (bits & EVENT_ALARM_TRIGGERED) {
            safe_print("\n⚠️  ALARM: HIGH TEMPERATURE DETECTED! ⚠️\n\n");
            
            // Pisca LED (simulado)
            for (int i = 0; i < 5; i++) {
                safe_print("🔴 ");
                vTaskDelay(pdMS_TO_TICKS(200));
            }
            safe_print("\n");
        }
    }
}

// ============================================================================
// TIMER CALLBACK: WATCHDOG
// ============================================================================

/**
 * Callback do timer watchdog
 */
static void watchdog_callback(TimerHandle_t xTimer)
{
    static uint32_t counter = 0;
    counter++;
    
    safe_print("[WATCHDOG] Tick %lu - System alive\n", counter);
    
    // Verifica se tasks estão rodando
    if (sensor_task_handle != NULL) {
        eTaskState state = eTaskGetState(sensor_task_handle);
        if (state == eDeleted || state == eSuspended) {
            safe_print("[WATCHDOG] WARNING: Sensor task not running!\n");
        }
    }
}

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

/**
 * Cria todos os recursos do RTOS
 */
static BaseType_t create_rtos_resources(void)
{
    // Cria fila de sensores
    sensor_queue = xQueueCreate(QUEUE_LENGTH, QUEUE_ITEM_SIZE);
    if (sensor_queue == NULL) {
        printf("ERROR: Failed to create sensor queue\n");
        return pdFAIL;
    }
    
    // Cria mutex para estatísticas
    stats_mutex = xSemaphoreCreateMutex();
    if (stats_mutex == NULL) {
        printf("ERROR: Failed to create stats mutex\n");
        return pdFAIL;
    }
    
    // Cria semáforo binário para UART
    uart_semaphore = xSemaphoreCreateBinary();
    if (uart_semaphore == NULL) {
        printf("ERROR: Failed to create UART semaphore\n");
        return pdFAIL;
    }
    xSemaphoreGive(uart_semaphore);  // Inicializa como disponível
    
    // Cria event group
    system_events = xEventGroupCreate();
    if (system_events == NULL) {
        printf("ERROR: Failed to create event group\n");
        return pdFAIL;
    }
    
    // Cria timer watchdog (5 segundos)
    watchdog_timer = xTimerCreate(
        "Watchdog",
        pdMS_TO_TICKS(5000),
        pdTRUE,  // Auto-reload
        NULL,
        watchdog_callback
    );
    if (watchdog_timer == NULL) {
        printf("ERROR: Failed to create watchdog timer\n");
        return pdFAIL;
    }
    
    return pdPASS;
}

/**
 * Cria todas as tasks
 */
static BaseType_t create_tasks(void)
{
    BaseType_t ret;
    
    // Task Sensor 1
    ret = xTaskCreate(
        sensor_task,
        "Sensor1",
        TASK_STACK_SIZE,
        (void*)1,
        tskIDLE_PRIORITY + 2,
        &sensor_task_handle
    );
    if (ret != pdPASS) return pdFAIL;
    
    // Task Sensor 2
    ret = xTaskCreate(
        sensor_task,
        "Sensor2",
        TASK_STACK_SIZE,
        (void*)2,
        tskIDLE_PRIORITY + 2,
        NULL
    );
    if (ret != pdPASS) return pdFAIL;
    
    // Task Processor
    ret = xTaskCreate(
        processor_task,
        "Processor",
        TASK_STACK_SIZE,
        NULL,
        tskIDLE_PRIORITY + 3,
        &processor_task_handle
    );
    if (ret != pdPASS) return pdFAIL;
    
    // Task Display
    ret = xTaskCreate(
        display_task,
        "Display",
        TASK_STACK_SIZE,
        NULL,
        tskIDLE_PRIORITY + 1,
        &display_task_handle
    );
    if (ret != pdPASS) return pdFAIL;
    
    // Task Alarm
    ret = xTaskCreate(
        alarm_task,
        "Alarm",
        TASK_STACK_SIZE,
        NULL,
        tskIDLE_PRIORITY + 4,  // Alta prioridade
        &alarm_task_handle
    );
    if (ret != pdPASS) return pdFAIL;
    
    return pdPASS;
}

// ============================================================================
// MAIN
// ============================================================================

int main(void)
{
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║     FreeRTOS EXAMPLE - SENSOR MONITORING SYSTEM           ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    // Inicializa hardware (específico da plataforma)
    // hardware_init();
    
    // Cria recursos RTOS
    if (create_rtos_resources() != pdPASS) {
        printf("FATAL: Failed to create RTOS resources\n");
        return -1;
    }
    printf("✅ RTOS resources created\n");
    
    // Cria tasks
    if (create_tasks() != pdPASS) {
        printf("FATAL: Failed to create tasks\n");
        return -1;
    }
    printf("✅ Tasks created\n");
    
    // Inicia timer watchdog
    if (xTimerStart(watchdog_timer, 0) != pdPASS) {
        printf("WARNING: Failed to start watchdog timer\n");
    }
    printf("✅ Watchdog timer started\n");
    
    printf("\n🚀 Starting FreeRTOS scheduler...\n\n");
    
    // Inicia scheduler (nunca retorna)
    vTaskStartScheduler();
    
    // Nunca deve chegar aqui
    printf("FATAL: Scheduler returned!\n");
    return -1;
}

// ============================================================================
// HOOKS DO FREERTOS (Opcionais)
// ============================================================================

/**
 * Hook chamado quando há stack overflow
 */
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName)
{
    printf("FATAL: Stack overflow in task '%s'\n", pcTaskName);
    while (1);
}

/**
 * Hook chamado quando malloc falha
 */
void vApplicationMallocFailedHook(void)
{
    printf("FATAL: Malloc failed!\n");
    while (1);
}

/**
 * Hook chamado no idle task
 */
void vApplicationIdleHook(void)
{
    // Pode colocar o CPU em modo de baixo consumo aqui
    // __WFI();  // Wait For Interrupt (ARM)
}

/**
 * Hook chamado a cada tick
 */
void vApplicationTickHook(void)
{
    // Pode ser usado para timing preciso
}
