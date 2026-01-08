package ads

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"prost-qs/backend/internal/jobs"
)

// ========================================
// ADS JOBS - PROCESSAMENTO ASSÍNCRONO
// ========================================

// RegisterAdsJobHandlers registra handlers de jobs do módulo Ads
func RegisterAdsJobHandlers(jobService *jobs.JobService, adsService *AdsService) {
	jobService.RegisterHandler(JobTypeApplyAdSpend, func(ctx context.Context, job *jobs.Job) error {
		return handleApplyAdSpend(ctx, job, adsService)
	})
}

// handleApplyAdSpend processa job de aplicar gasto
func handleApplyAdSpend(ctx context.Context, job *jobs.Job, adsService *AdsService) error {
	var payload ApplyAdSpendPayload
	if err := json.Unmarshal([]byte(job.Payload), &payload); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	spendEventID, err := uuid.Parse(payload.SpendEventID)
	if err != nil {
		return fmt.Errorf("invalid spend event id: %w", err)
	}

	return adsService.ApplySpendEvent(ctx, spendEventID)
}
