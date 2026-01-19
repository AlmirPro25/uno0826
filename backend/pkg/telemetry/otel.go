package telemetry

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	oteltrace "go.opentelemetry.io/otel/trace"
)

// ========================================
// OPENTELEMETRY DISTRIBUTED TRACING
// ========================================
// Purpose: Full observability of distributed agent-to-agent calls
// Benefits:
//   - Trace latency across UCP negotiations
//   - Debug cascading failures
//   - Performance bottleneck identification
// Backend: Jaeger, Tempo, or any OTLP-compatible collector
// ========================================

// TelemetryConfig holds OpenTelemetry configuration
type TelemetryConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string

	// OTLP Exporter settings
	OTLPEndpoint string // e.g., "localhost:4318" for Jaeger
	OTLPInsecure bool   // Use HTTP instead of HTTPS

	// Sampling
	SampleRate float64 // 0.0 to 1.0 (1.0 = 100% sampling)
}

// TracerProvider is a global singleton
var tracerProvider *trace.TracerProvider

// InitTelemetry initializes OpenTelemetry with OTLP exporter
func InitTelemetry(ctx context.Context, config TelemetryConfig) (func(), error) {
	// 1. Create Resource (describes the service)
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(config.ServiceName),
			semconv.ServiceVersion(config.ServiceVersion),
			semconv.DeploymentEnvironment(config.Environment),
			attribute.String("kernel.type", "prost-qs-sovereign"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// 2. Create OTLP HTTP Exporter
	client := otlptracehttp.NewClient(
		otlptracehttp.WithEndpoint(config.OTLPEndpoint),
		otlptracehttp.WithInsecure(), // Use HTTP for local Jaeger
	)

	exporter, err := otlptrace.New(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP exporter: %w", err)
	}

	// 3. Create Trace Provider with sampling
	sampler := trace.ParentBased(trace.TraceIDRatioBased(config.SampleRate))

	tracerProvider = trace.NewTracerProvider(
		trace.WithBatcher(exporter),
		trace.WithResource(res),
		trace.WithSampler(sampler),
	)

	// 4. Set global provider
	otel.SetTracerProvider(tracerProvider)

	// 5. Set global propagator (for distributed context)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	// Return shutdown function
	shutdown := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := tracerProvider.Shutdown(ctx); err != nil {
			fmt.Printf("Error shutting down tracer provider: %v\n", err)
		}
	}

	return shutdown, nil
}

// ========================================
// CONVENIENCE WRAPPERS
// ========================================

// Tracer returns a named tracer
func Tracer(name string) oteltrace.Tracer {
	return otel.Tracer(name)
}

// StartSpan creates a new span with common attributes automatically set
func StartSpan(ctx context.Context, tracerName string, spanName string, attrs ...attribute.KeyValue) (context.Context, oteltrace.Span) {
	tracer := otel.Tracer(tracerName)

	// Add common attributes
	attrs = append(attrs,
		attribute.String("kernel.component", "prost-qs"),
		attribute.Int64("timestamp", time.Now().Unix()),
	)

	return tracer.Start(ctx, spanName, oteltrace.WithAttributes(attrs...))
}

// ========================================
// AGENT-SPECIFIC TRACING
// ========================================

// TraceAgentExecution wraps agent command execution with tracing
func TraceAgentExecution(ctx context.Context, agentID string, command string, fn func(context.Context) error) error {
	ctx, span := StartSpan(ctx, "agent.execution", command,
		attribute.String("agent.id", agentID),
		attribute.String("agent.command", command),
	)
	defer span.End()

	err := fn(ctx)

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "success")
	}

	return err
}

// TraceCognitiveThink wraps AI Think() calls
func TraceCognitiveThink(ctx context.Context, agentID string, engineName string, goal string, fn func(context.Context) error) error {
	ctx, span := StartSpan(ctx, "cognitive.engine", "Think",
		attribute.String("agent.id", agentID),
		attribute.String("engine.name", engineName),
		attribute.String("goal", goal),
	)
	defer span.End()

	start := time.Now()
	err := fn(ctx)
	duration := time.Since(start)

	span.SetAttributes(
		attribute.Int64("duration_ms", duration.Milliseconds()),
	)

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "decision_made")
	}

	return err
}

// TraceUCPCall wraps external UCP HTTP calls
func TraceUCPCall(ctx context.Context, targetURL string, endpoint string, fn func(context.Context) error) error {
	ctx, span := StartSpan(ctx, "ucp.client", "http_call",
		attribute.String("ucp.target", targetURL),
		attribute.String("ucp.endpoint", endpoint),
	)
	defer span.End()

	start := time.Now()
	err := fn(ctx)
	duration := time.Since(start)

	span.SetAttributes(
		attribute.Int64("http.duration_ms", duration.Milliseconds()),
	)

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "200")
	}

	return err
}

// ========================================
// CUSTOM EVENTS (For Narrative Intelligence)
// ========================================

// RecordKernelEvent adds a custom event to the current span
func RecordKernelEvent(ctx context.Context, eventType string, eventData map[string]interface{}) {
	span := oteltrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}

	attrs := make([]attribute.KeyValue, 0, len(eventData))
	for k, v := range eventData {
		attrs = append(attrs, attribute.String("event."+k, fmt.Sprintf("%v", v)))
	}

	attrs = append(attrs, attribute.String("event.type", eventType))

	span.AddEvent("kernel.event", oteltrace.WithAttributes(attrs...))
}

// ========================================
// METRICS (Bonus: Prometheus-compatible)
// ========================================

// RecordMetric records a metric value in the current span
func RecordMetric(ctx context.Context, metricName string, value int64, unit string) {
	span := oteltrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}

	span.SetAttributes(
		attribute.Int64("metric."+metricName, value),
		attribute.String("metric.unit", unit),
	)
}

// ========================================
// DISTRIBUTED CONTEXT INJECTION
// ========================================

// InjectTraceContext injects trace context into HTTP headers
func InjectTraceContext(ctx context.Context, headers map[string]string) {
	propagator := otel.GetTextMapPropagator()
	propagator.Inject(ctx, &mapCarrier{data: headers})
}

// ExtractTraceContext extracts trace context from HTTP headers
func ExtractTraceContext(ctx context.Context, headers map[string]string) context.Context {
	propagator := otel.GetTextMapPropagator()
	return propagator.Extract(ctx, &mapCarrier{data: headers})
}

// mapCarrier implements TextMapCarrier for map[string]string
type mapCarrier struct {
	data map[string]string
}

func (c *mapCarrier) Get(key string) string {
	return c.data[key]
}

func (c *mapCarrier) Set(key string, value string) {
	c.data[key] = value
}

func (c *mapCarrier) Keys() []string {
	keys := make([]string, 0, len(c.data))
	for k := range c.data {
		keys = append(keys, k)
	}
	return keys
}

// ========================================
// HEALTH CHECK
// ========================================

// IsEnabled returns true if telemetry is initialized
func IsEnabled() bool {
	return tracerProvider != nil
}

// GetTracerProvider returns the global tracer provider
func GetTracerProvider() oteltrace.TracerProvider {
	if tracerProvider == nil {
		return otel.GetTracerProvider()
	}
	return tracerProvider
}
