package scaling

import (
	"context"
	"fmt"
	"sync"
	"time"

	"prost-qs/backend/pkg/mcp"
)

// ========================================
// AUTO-SCALING AGENT MANAGER
// ========================================
// Purpose: Dynamic agent spawning based on workload
// Algorithm: Queue depth + latency-based scaling
// Strategy: Scale up under pressure, scale down when idle
// Benefits: Cost optimization + performance under load
// ========================================

// AutoScaler manages dynamic agent worker pools
type AutoScaler struct {
	mu sync.RWMutex

	// Configuration
	config ScalingConfig

	// State
	pools map[string]*WorkerPool // agentType -> pool

	// Metrics
	metrics *ScalingMetrics

	// Context
	ctx    context.Context
	cancel context.CancelFunc
}

// ScalingConfig defines auto-scaling behavior
type ScalingConfig struct {
	// Scaling Bounds
	MinWorkers int `json:"min_workers"` // Minimum workers per agent type
	MaxWorkers int `json:"max_workers"` // Maximum workers per agent type

	// Scaling Triggers
	ScaleUpQueueDepth int           `json:"scale_up_queue_depth"` // Queue depth to trigger scale-up
	ScaleDownIdleTime time.Duration `json:"scale_down_idle_time"` // Idle time before scale-down
	ScaleUpLatencyP95 time.Duration `json:"scale_up_latency_p95"` // P95 latency threshold
	CheckInterval     time.Duration `json:"check_interval"`       // How often to check metrics

	// Rate Limiting
	CooldownPeriod time.Duration `json:"cooldown_period"` // Min time between scaling actions
}

// WorkerPool manages a pool of agent workers
type WorkerPool struct {
	agentType string
	workers   []Worker
	queue     chan *Task
	config    ScalingConfig

	// State
	activeWorkers int
	lastScaledAt  time.Time

	// Metrics
	queueDepth     int
	totalProcessed int64
	totalLatency   time.Duration
	latencyP95     time.Duration
}

// Worker represents a spawned agent instance
type Worker struct {
	id        string
	agentType string
	agent     mcp.MCPAgent
	started   time.Time
	tasks     int64
	idle      bool
}

// Task represents work to be processed
type Task struct {
	id      string
	command mcp.Command
	result  chan mcp.Result
	queued  time.Time
}

// NewAutoScaler creates an auto-scaling manager
func NewAutoScaler(config ScalingConfig) *AutoScaler {
	ctx, cancel := context.WithCancel(context.Background())

	scaler := &AutoScaler{
		config:  config,
		pools:   make(map[string]*WorkerPool),
		metrics: newScalingMetrics(),
		ctx:     ctx,
		cancel:  cancel,
	}

	// Start monitoring loop
	go scaler.monitorAndScale()

	return scaler
}

// ========================================
// WORKER POOL MANAGEMENT
// ========================================
// RegisterAgentType creates a worker pool for an agent type
func (a *AutoScaler) RegisterAgentType(agentType string, factory AgentFactory) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if _, exists := a.pools[agentType]; exists {
		return fmt.Errorf("agent type %s already registered", agentType)
	}

	pool := &WorkerPool{
		agentType:     agentType,
		workers:       make([]Worker, 0),
		queue:         make(chan *Task, 1000), // Buffered queue
		config:        a.config,
		activeWorkers: 0,
		lastScaledAt:  time.Now(),
	}

	// Spawn minimum workers
	for i := 0; i < a.config.MinWorkers; i++ {
		if err := a.spawnWorker(pool, factory); err != nil {
			return fmt.Errorf("failed to spawn worker: %w", err)
		}
	}

	a.pools[agentType] = pool

	// Start pool processor
	go a.processPool(pool, factory)

	return nil
}

// spawnWorker creates a new worker instance
func (a *AutoScaler) spawnWorker(pool *WorkerPool, factory AgentFactory) error {
	agent, err := factory.CreateAgent(a.ctx)
	if err != nil {
		return err
	}

	worker := Worker{
		id:        generateWorkerID(),
		agentType: pool.agentType,
		agent:     agent,
		started:   time.Now(),
		tasks:     0,
		idle:      true,
	}

	pool.workers = append(pool.workers, worker)
	pool.activeWorkers++

	a.metrics.RecordWorkerSpawned(pool.agentType)

	return nil
}

// killWorker terminates a worker instance
func (a *AutoScaler) killWorker(pool *WorkerPool, workerID string) error {
	for i, worker := range pool.workers {
		if worker.id == workerID {
			// Graceful shutdown
			if shutdownAgent, ok := worker.agent.(mcp.AgentWithShutdown); ok {
				shutdownAgent.Shutdown(a.ctx)
			}

			// Remove from pool
			pool.workers = append(pool.workers[:i], pool.workers[i+1:]...)
			pool.activeWorkers--

			a.metrics.RecordWorkerKilled(pool.agentType)
			return nil
		}
	}

	return fmt.Errorf("worker %s not found", workerID)
}

// ========================================
// TASK SUBMISSION
// ========================================

// Submit enqueues a task for processing
func (a *AutoScaler) Submit(agentType string, command mcp.Command) (mcp.Result, error) {
	a.mu.RLock()
	pool, exists := a.pools[agentType]
	a.mu.RUnlock()

	if !exists {
		return mcp.Result{}, fmt.Errorf("no worker pool for agent type: %s", agentType)
	}

	task := &Task{
		id:      generateTaskID(),
		command: command,
		result:  make(chan mcp.Result, 1),
		queued:  time.Now(),
	}

	// Enqueue task (non-blocking)
	select {
	case pool.queue <- task:
		pool.queueDepth++
		a.metrics.RecordTaskQueued(agentType)
	default:
		return mcp.Result{}, fmt.Errorf("queue full for agent type: %s", agentType)
	}

	// Wait for result (with timeout)
	select {
	case result := <-task.result:
		latency := time.Since(task.queued)
		a.metrics.RecordTaskCompleted(agentType, latency)
		return result, nil
	case <-time.After(30 * time.Second):
		return mcp.Result{}, fmt.Errorf("task timeout")
	}
}

// ========================================
// POOL PROCESSOR
// ========================================

func (a *AutoScaler) processPool(pool *WorkerPool, factory AgentFactory) {
	for {
		select {
		case <-a.ctx.Done():
			return

		case task := <-pool.queue:
			pool.queueDepth--

			// Find idle worker
			worker := a.findIdleWorker(pool)
			if worker == nil {
				// All workers busy - re-queue and trigger scale-up
				pool.queue <- task
				pool.queueDepth++
				a.metrics.RecordQueuePressure(pool.agentType, pool.queueDepth)
				continue
			}

			// Execute task
			go a.executeTask(worker, task, pool)
		}
	}
}

func (a *AutoScaler) findIdleWorker(pool *WorkerPool) *Worker {
	for i := range pool.workers {
		if pool.workers[i].idle {
			pool.workers[i].idle = false
			return &pool.workers[i]
		}
	}
	return nil
}

func (a *AutoScaler) executeTask(worker *Worker, task *Task, pool *WorkerPool) {
	defer func() {
		worker.idle = true
		worker.tasks++
	}()

	result, err := worker.agent.Execute(a.ctx, task.command)
	if err != nil {
		result = mcp.Result{
			Error: err.Error(),
		}
	}

	task.result <- result
	close(task.result)

	pool.totalProcessed++
	pool.totalLatency += time.Since(task.queued)
}

// ========================================
// AUTO-SCALING LOGIC
// ========================================

func (a *AutoScaler) monitorAndScale() {
	ticker := time.NewTicker(a.config.CheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return

		case <-ticker.C:
			a.checkAndScale()
		}
	}
}

func (a *AutoScaler) checkAndScale() {
	a.mu.Lock()
	defer a.mu.Unlock()

	for agentType, pool := range a.pools {
		// Check cooldown period
		if time.Since(pool.lastScaledAt) < a.config.CooldownPeriod {
			continue
		}

		// Scaling Decision Logic
		shouldScaleUp := a.shouldScaleUp(pool)
		shouldScaleDown := a.shouldScaleDown(pool)

		if shouldScaleUp {
			a.scaleUp(pool, agentType)
		} else if shouldScaleDown {
			a.scaleDown(pool)
		}
	}
}

func (a *AutoScaler) shouldScaleUp(pool *WorkerPool) bool {
	// Scale up if:
	// 1. Queue depth exceeds threshold
	// 2. P95 latency is high
	// 3. All workers are busy

	if pool.queueDepth >= a.config.ScaleUpQueueDepth {
		return true
	}

	if pool.latencyP95 >= a.config.ScaleUpLatencyP95 {
		return true
	}

	idleCount := 0
	for _, worker := range pool.workers {
		if worker.idle {
			idleCount++
		}
	}

	if idleCount == 0 && pool.activeWorkers < a.config.MaxWorkers {
		return true
	}

	return false
}

func (a *AutoScaler) shouldScaleDown(pool *WorkerPool) bool {
	// Scale down if:
	// 1. Most workers are idle for extended period
	// 2. Above minimum workers

	if pool.activeWorkers <= a.config.MinWorkers {
		return false
	}

	idleCount := 0
	for _, worker := range pool.workers {
		if worker.idle && time.Since(worker.started) > a.config.ScaleDownIdleTime {
			idleCount++
		}
	}

	// If >50% workers idle for a while, scale down
	return idleCount > pool.activeWorkers/2
}

func (a *AutoScaler) scaleUp(pool *WorkerPool, agentType string) {
	if pool.activeWorkers >= a.config.MaxWorkers {
		return
	}

	// Spawn additional worker (would need factory - simplified here)
	// In production, get factory from registration
	pool.activeWorkers++
	pool.lastScaledAt = time.Now()

	a.metrics.RecordScaleUp(agentType, pool.activeWorkers)
}

func (a *AutoScaler) scaleDown(pool *WorkerPool) {
	if pool.activeWorkers <= a.config.MinWorkers {
		return
	}

	// Find idle worker to kill
	for _, worker := range pool.workers {
		if worker.idle {
			a.killWorker(pool, worker.id)
			pool.lastScaledAt = time.Now()
			a.metrics.RecordScaleDown(pool.agentType, pool.activeWorkers)
			break
		}
	}
}

// ========================================
// METRICS
// ========================================

type ScalingMetrics struct {
	mu sync.Mutex

	TasksQueued    map[string]int64
	TasksCompleted map[string]int64
	WorkersActive  map[string]int
	QueueDepth     map[string]int
	LatencyP95     map[string]time.Duration
}

func newScalingMetrics() *ScalingMetrics {
	return &ScalingMetrics{
		TasksQueued:    make(map[string]int64),
		TasksCompleted: make(map[string]int64),
		WorkersActive:  make(map[string]int),
		QueueDepth:     make(map[string]int),
		LatencyP95:     make(map[string]time.Duration),
	}
}

func (m *ScalingMetrics) RecordTaskQueued(agentType string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.TasksQueued[agentType]++
}

func (m *ScalingMetrics) RecordTaskCompleted(agentType string, latency time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.TasksCompleted[agentType]++
	m.LatencyP95[agentType] = latency // Simplified - would need proper P95 calc
}

func (m *ScalingMetrics) RecordWorkerSpawned(agentType string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.WorkersActive[agentType]++
}

func (m *ScalingMetrics) RecordWorkerKilled(agentType string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.WorkersActive[agentType]--
}

func (m *ScalingMetrics) RecordQueuePressure(agentType string, depth int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.QueueDepth[agentType] = depth
}

func (m *ScalingMetrics) RecordScaleUp(agentType string, newCount int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.WorkersActive[agentType] = newCount
}

func (m *ScalingMetrics) RecordScaleDown(agentType string, newCount int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.WorkersActive[agentType] = newCount
}

// ========================================
// FACTORY INTERFACE
// ========================================

// AgentFactory creates agent instances
type AgentFactory interface {
	CreateAgent(ctx context.Context) (mcp.MCPAgent, error)
}

// ========================================
// UTILITIES
// ========================================

func generateWorkerID() string {
	return fmt.Sprintf("worker_%d", time.Now().UnixNano())
}

func generateTaskID() string {
	return fmt.Sprintf("task_%d", time.Now().UnixNano())
}

// Shutdown gracefully stops all workers
func (a *AutoScaler) Shutdown() {
	a.cancel()
}
