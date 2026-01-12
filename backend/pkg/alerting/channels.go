package alerting

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// ========================================
// ALERT CHANNELS
// "Alertas chegam onde precisam chegar"
// ========================================

// LogChannel logs alerts to stdout
type LogChannel struct {
	enabled bool
}

// NewLogChannel creates a new log channel
func NewLogChannel() *LogChannel {
	return &LogChannel{enabled: true}
}

func (c *LogChannel) Name() string { return "log" }

func (c *LogChannel) Send(alert *Alert) error {
	emoji := c.getEmoji(alert.Severity)
	log.Printf("%s [%s] %s | %s: %s | source=%s value=%.2f threshold=%.2f",
		emoji, alert.Severity, alert.Type, alert.Title, alert.Message,
		alert.Source, alert.Value, alert.Threshold)
	return nil
}

func (c *LogChannel) IsEnabled() bool { return c.enabled }

func (c *LogChannel) getEmoji(severity AlertSeverity) string {
	switch severity {
	case SeverityEmergency:
		return "🚨"
	case SeverityCritical:
		return "🔴"
	case SeverityWarning:
		return "🟡"
	default:
		return "🔵"
	}
}

// ========================================
// WEBHOOK CHANNEL
// ========================================

// WebhookChannel sends alerts to a webhook URL
type WebhookChannel struct {
	name       string
	url        string
	enabled    bool
	httpClient *http.Client
	headers    map[string]string
}

// WebhookConfig holds webhook configuration
type WebhookConfig struct {
	Name    string
	URL     string
	Headers map[string]string
	Timeout time.Duration
}

// NewWebhookChannel creates a new webhook channel
func NewWebhookChannel(config WebhookConfig) *WebhookChannel {
	timeout := config.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &WebhookChannel{
		name:    config.Name,
		url:     config.URL,
		enabled: config.URL != "",
		headers: config.Headers,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *WebhookChannel) Name() string { return c.name }

func (c *WebhookChannel) Send(alert *Alert) error {
	payload := map[string]interface{}{
		"alert_id":   alert.ID,
		"type":       alert.Type,
		"severity":   alert.Severity,
		"title":      alert.Title,
		"message":    alert.Message,
		"source":     alert.Source,
		"value":      alert.Value,
		"threshold":  alert.Threshold,
		"tags":       alert.Tags,
		"created_at": alert.CreatedAt.Format(time.RFC3339),
		"count":      alert.Count,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal alert: %w", err)
	}

	req, err := http.NewRequest("POST", c.url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	for k, v := range c.headers {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}

	return nil
}

func (c *WebhookChannel) IsEnabled() bool { return c.enabled && c.url != "" }

// ========================================
// SLACK CHANNEL
// ========================================

// SlackChannel sends alerts to Slack
type SlackChannel struct {
	webhookURL string
	channel    string
	enabled    bool
	httpClient *http.Client
}

// NewSlackChannel creates a new Slack channel
func NewSlackChannel(webhookURL, channel string) *SlackChannel {
	return &SlackChannel{
		webhookURL: webhookURL,
		channel:    channel,
		enabled:    webhookURL != "",
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// NewSlackChannelFromEnv creates Slack channel from environment
func NewSlackChannelFromEnv() *SlackChannel {
	return NewSlackChannel(
		os.Getenv("SLACK_WEBHOOK_URL"),
		os.Getenv("SLACK_ALERT_CHANNEL"),
	)
}

func (c *SlackChannel) Name() string { return "slack" }

func (c *SlackChannel) Send(alert *Alert) error {
	color := c.getColor(alert.Severity)
	emoji := c.getEmoji(alert.Severity)

	payload := map[string]interface{}{
		"channel": c.channel,
		"attachments": []map[string]interface{}{
			{
				"color": color,
				"blocks": []map[string]interface{}{
					{
						"type": "header",
						"text": map[string]string{
							"type": "plain_text",
							"text": fmt.Sprintf("%s %s", emoji, alert.Title),
						},
					},
					{
						"type": "section",
						"fields": []map[string]string{
							{"type": "mrkdwn", "text": fmt.Sprintf("*Severity:*\n%s", alert.Severity)},
							{"type": "mrkdwn", "text": fmt.Sprintf("*Type:*\n%s", alert.Type)},
							{"type": "mrkdwn", "text": fmt.Sprintf("*Source:*\n%s", alert.Source)},
							{"type": "mrkdwn", "text": fmt.Sprintf("*Value:*\n%.2f (threshold: %.2f)", alert.Value, alert.Threshold)},
						},
					},
					{
						"type": "section",
						"text": map[string]string{
							"type": "mrkdwn",
							"text": alert.Message,
						},
					},
					{
						"type": "context",
						"elements": []map[string]string{
							{"type": "mrkdwn", "text": fmt.Sprintf("Alert ID: `%s` | Count: %d", alert.ID, alert.Count)},
						},
					},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal slack payload: %w", err)
	}

	resp, err := c.httpClient.Post(c.webhookURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to send slack message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("slack returned status %d", resp.StatusCode)
	}

	return nil
}

func (c *SlackChannel) IsEnabled() bool { return c.enabled && c.webhookURL != "" }

func (c *SlackChannel) getColor(severity AlertSeverity) string {
	switch severity {
	case SeverityEmergency:
		return "#8B0000" // Dark red
	case SeverityCritical:
		return "#FF0000" // Red
	case SeverityWarning:
		return "#FFA500" // Orange
	default:
		return "#36A64F" // Green
	}
}

func (c *SlackChannel) getEmoji(severity AlertSeverity) string {
	switch severity {
	case SeverityEmergency:
		return "🚨"
	case SeverityCritical:
		return "🔴"
	case SeverityWarning:
		return "⚠️"
	default:
		return "ℹ️"
	}
}

// ========================================
// PAGERDUTY CHANNEL
// ========================================

// PagerDutyChannel sends alerts to PagerDuty
type PagerDutyChannel struct {
	routingKey string
	enabled    bool
	httpClient *http.Client
}

// NewPagerDutyChannel creates a new PagerDuty channel
func NewPagerDutyChannel(routingKey string) *PagerDutyChannel {
	return &PagerDutyChannel{
		routingKey: routingKey,
		enabled:    routingKey != "",
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// NewPagerDutyChannelFromEnv creates PagerDuty channel from environment
func NewPagerDutyChannelFromEnv() *PagerDutyChannel {
	return NewPagerDutyChannel(os.Getenv("PAGERDUTY_ROUTING_KEY"))
}

func (c *PagerDutyChannel) Name() string { return "pagerduty" }

func (c *PagerDutyChannel) Send(alert *Alert) error {
	// Only send critical and emergency alerts to PagerDuty
	if alert.Severity != SeverityCritical && alert.Severity != SeverityEmergency {
		return nil
	}

	pdSeverity := "warning"
	switch alert.Severity {
	case SeverityEmergency:
		pdSeverity = "critical"
	case SeverityCritical:
		pdSeverity = "error"
	}

	payload := map[string]interface{}{
		"routing_key":  c.routingKey,
		"event_action": "trigger",
		"dedup_key":    fmt.Sprintf("%s:%s:%s", alert.Type, alert.Source, alert.Title),
		"payload": map[string]interface{}{
			"summary":   fmt.Sprintf("[%s] %s: %s", alert.Severity, alert.Title, alert.Message),
			"source":    alert.Source,
			"severity":  pdSeverity,
			"timestamp": alert.CreatedAt.Format(time.RFC3339),
			"custom_details": map[string]interface{}{
				"alert_id":  alert.ID,
				"type":      alert.Type,
				"value":     alert.Value,
				"threshold": alert.Threshold,
				"count":     alert.Count,
				"tags":      alert.Tags,
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal pagerduty payload: %w", err)
	}

	resp, err := c.httpClient.Post(
		"https://events.pagerduty.com/v2/enqueue",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return fmt.Errorf("failed to send pagerduty event: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("pagerduty returned status %d", resp.StatusCode)
	}

	return nil
}

func (c *PagerDutyChannel) IsEnabled() bool { return c.enabled && c.routingKey != "" }

// ========================================
// CALLBACK CHANNEL
// ========================================

// CallbackChannel calls a function when alert fires
type CallbackChannel struct {
	name     string
	callback func(*Alert) error
	enabled  bool
}

// NewCallbackChannel creates a new callback channel
func NewCallbackChannel(name string, callback func(*Alert) error) *CallbackChannel {
	return &CallbackChannel{
		name:     name,
		callback: callback,
		enabled:  callback != nil,
	}
}

func (c *CallbackChannel) Name() string { return c.name }

func (c *CallbackChannel) Send(alert *Alert) error {
	if c.callback == nil {
		return nil
	}
	return c.callback(alert)
}

func (c *CallbackChannel) IsEnabled() bool { return c.enabled }

// ========================================
// CHANNEL FACTORY
// ========================================

// SetupDefaultChannels configures default channels from environment
func SetupDefaultChannels(engine *AlertEngine) {
	// Slack channel
	slackChannel := NewSlackChannelFromEnv()
	if slackChannel.IsEnabled() {
		engine.AddChannel(slackChannel)
		log.Println("✅ Slack alert channel configured")
	}

	// PagerDuty channel
	pdChannel := NewPagerDutyChannelFromEnv()
	if pdChannel.IsEnabled() {
		engine.AddChannel(pdChannel)
		log.Println("✅ PagerDuty alert channel configured")
	}

	// Custom webhook
	webhookURL := os.Getenv("ALERT_WEBHOOK_URL")
	if webhookURL != "" {
		engine.AddChannel(NewWebhookChannel(WebhookConfig{
			Name: "custom_webhook",
			URL:  webhookURL,
		}))
		log.Println("✅ Custom webhook alert channel configured")
	}
}
