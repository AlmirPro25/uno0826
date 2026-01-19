# 🔒 HARDENING CHECKLIST v3.0 - PRODUCTION READINESS

> **Status:** Pre-Production Security Audit  
> **Version:** 3.0.0-hardened  
> **Date:** 2026-01-19  
> **Objective:** Prove system is SaaS B2B production-ready  

---

## 📋 EXECUTIVE SUMMARY

This is **NOT** a feature addition. This is **VALIDATION** that the platform can handle:
- Multiple tenants WITHOUT cross-contamination
- Malicious tenants WITHOUT infrastructure bankruptcy
- Federation WITHOUT becoming attack vector
- GDPR compliance WITHOUT manual intervention

**All new features from v3.0 are FROZEN until this checklist is GREEN.**

---

## 🎯 CRITICAL RISKS ADDRESSED

### Risk #1: Multi-Tenancy ≠ Just "tenant_id"
**Problem:** Sharing vector index, budget, autoscaler between tenants → FATAL for SaaS  
**Solution:** Hard isolation via RLS + boundary enforcement  
**Validation:** `isolation_test.go` proves no cross-tenant access

### Risk #2: Vector Memory = Legal Liability
**Problem:** Infinite memory storage → GDPR violation + cost explosion  
**Solution:** Retention policies + right to be forgotten  
**Validation:** `boundary.go` implements purge + TTL

### Risk #3: Auto-Scaling = Cost Attack Vector
**Problem:** Malicious tenant forces scale-up → burns $$$ → bankruptcy  
**Solution:** Cost Governor with per-tenant limits  
**Validation:** `cost_governor.go` enforces worker/CPU/cost caps

### Risk #4: Federation = Systemic Risk
**Problem:** Open federation → any kernel can attack → distributed exploit  
**Solution:** Sandbox with whitelist + emergency stop  
**Validation:** `sandbox.go` implements kill-switch + rate limits

---

## ✅ HARDENING CHECKLIST

### PHASE 1: TENANT ISOLATION (CRITICAL)

#### 1.1 Data Isolation
- [x] **Code:** Tenant isolation tests (`isolation_test.go`)
- [ ] **Test:** Run isolation tests: `go test ./pkg/tenancy/...`
- [ ] **Verify:** No tenant can access another's data
- [ ] **Verify:** API key collision impossible (100 tenants test PASS)
- [ ] **Verify:** Concurrent creation doesn't create duplicates

**Commands:**
```bash
cd backend
go test -v ./pkg/tenancy/isolation_test.go
```

**Expected Result:**
```
PASS TestTenantDataIsolation
PASS TestTenantQuotaIsolation
PASS TestConcurrentTenantCreation
PASS TestTenantSuspensionIsolation
PASS TestAPIKeyUniqueness
```

#### 1.2 Schema Isolation (Postgres Only)
- [ ] **Setup:** Enable Postgres schema-per-tenant
- [ ] **Test:** Create 2 tenants → verify separate schemas
- [ ] **Test:** Insert data in Tenant A → query from Tenant B → MUST FAIL
- [ ] **Test:** Drop Tenant A schema → Tenant B unaffected

**SQL Verification:**
```sql
-- List schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

-- Verify isolation
SET search_path TO tenant_abc123;
SELECT COUNT(*) FROM agent_records;

SET search_path TO tenant_xyz789;
SELECT COUNT(*) FROM agent_records; -- Different count
```

#### 1.3 Quota Isolation
- [ ] **Test:** Exhaust Tenant A AI quota
- [ ] **Verify:** Tenant B can still make AI calls
- [ ] **Test:** Tenant A hits worker limit
- [ ] **Verify:** Tenant B can spawn workers

---

### PHASE 2: MEMORY BOUNDARY ENFORCEMENT

#### 2.1 Cross-Tenant Leakage Prevention
- [x] **Code:** Memory boundary enforcer (`memory/boundary.go`)
- [ ] **Test:** Store memory for Tenant A
- [ ] **Test:** Recall with Tenant B credentials → MUST FAIL
- [ ] **Test:** Paranoid validation finds no cross-tenant embeddings

**Go Test:**
```go
// Test: boundary_test.go
func TestMemoryTenantIsolation(t *testing.T) {
    enforcer := NewMemoryBoundaryEnforcer(vm)
    
    // Store for Tenant A
    enforcer.Store(ctx, StoreMemoryRequest{
        TenantID: "tnt_aaa",
        Content:  "Secret A",
    })
    
    // Try to recall as Tenant B
    memories, err := enforcer.Recall(ctx, RecallRequest{
        TenantID: "tnt_bbb",
        Query:    "Secret A",
    })
    
    assert.Empty(t, memories) // MUST be empty
}
```

#### 2.2 GDPR Compliance
- [ ] **Test:** Purge tenant data
- [ ] **Verify:** All memories deleted
- [ ] **Verify:** Purge is logged (audit trail)
- [ ] **Test:** Retention policy auto-deletes old memories

**Commands:**
```go
// Purge tenant
enforcer.PurgeTenantMemories(ctx, "tnt_xxx", "customer request")

// Verify deletion
stats, _ := enforcer.GetMemoryStats(ctx, "tnt_xxx")
assert.Equal(t, 0, stats.Total)
```

#### 2.3 Row-Level Security (Production Only)
- [ ] **Setup:** Enable Postgres RLS on `memory_records`
- [ ] **Test:** Set tenant context → query only returns that tenant's data
- [ ] **Test:** Try to bypass RLS → MUST FAIL

**SQL Test:**
```sql
-- Enable RLS
ALTER TABLE memory_records ENABLE ROW LEVEL SECURITY;

-- Set tenant context
SET app.current_tenant_id = 'tnt_aaa';

-- Should only see tenant A data
SELECT tenant_id, COUNT(*) FROM memory_records GROUP BY tenant_id;
```

---

### PHASE 3: COST GOVERNOR

#### 3.1 Worker Limit Enforcement
- [x] **Code:** Cost governor (`scaling/cost_governor.go`)
- [ ] **Test:** Set max workers = 3 for Starter tier
- [ ] **Test:** Try to spawn 4th worker → MUST FAIL
- [ ] **Verify:** Error message includes quota info

**Go Test:**
```go
governor := NewCostGovernor()
governor.SetPlanTierLimits("tnt_starter", "starter")

// Spawn 3 workers → OK
for i := 0; i < 3; i++ {
    err := governor.CanSpawnWorker("tnt_starter")
    assert.NoError(t, err)
    governor.TrackWorkerSpawned("tnt_starter", 0.10)
}

// 4th worker → FAIL
err := governor.CanSpawnWorker("tnt_starter")
assert.Error(t, err)
assert.Contains(t, err.Error(), "exceeded max workers")
```

#### 3.2 Cost Cap Enforcement
- [ ] **Test:** Set hourly cost cap = $0.50
- [ ] **Test:** Spawn workers until cost reaches $0.50
- [ ] **Test:** Next spawn attempt → MUST FAIL with cost limit error

#### 3.3 Auto-Throttling
- [ ] **Test:** Trigger 6 violations
- [ ] **Verify:** Tenant auto-throttled for 5 minutes
- [ ] **Test:** Wait 5 minutes → verify throttle lifted

---

### PHASE 4: FEDERATION SANDBOX

#### 4.1 Whitelist Enforcement
- [x] **Code:** Federation sandbox (`federation/sandbox.go`)
- [ ] **Config:** Enable sandbox mode (`SandboxMode: true`)
- [ ] **Test:** Try to discover non-whitelisted kernel → MUST FAIL
- [ ] **Test:** Whitelist kernel → discovery succeeds
- [ ] **Test:** Remove from whitelist → invocation fails

**Go Test:**
```go
sandbox := NewFederationSandbox(client, ProductionSandboxConfig())

// Try to invoke non-whitelisted kernel
_, err := sandbox.InvokeRemoteAgent(ctx, "kernel_unknown", req)
assert.Error(t, err)
assert.Contains(t, err.Error(), "not whitelisted")

// Whitelist it
sandbox.WhitelistKernel("kernel_unknown", "admin@acme.com")

// Now succeeds
resp, err := sandbox.InvokeRemoteAgent(ctx, "kernel_unknown", req)
assert.NoError(t, err)
```

#### 4.2 Blacklist Enforcement
- [ ] **Test:** Blacklist a kernel
- [ ] **Test:** Try to invoke → MUST FAIL
- [ ] **Verify:** Blacklist reason included in error

#### 4.3 Rate Limiting
- [ ] **Test:** Set rate limit = 60/minute
- [ ] **Test:** Make 61 requests in 1 minute → 61st FAILS
- [ ] **Test:** Wait 1 minute → counter resets

#### 4.4 Emergency Stop
- [ ] **Test:** Trigger `EmergencyStop("security incident")`
- [ ] **Verify:** ALL federation requests fail
- [ ] **Test:** Resume → federation works again

**Commands:**
```go
sandbox.EmergencyStop("Detected malicious kernel")

// All calls fail
_, err := sandbox.InvokeRemoteAgent(ctx, "kernel_any", req)
assert.Error(t, err)
assert.Contains(t, err.Error(), "emergency stop")

// Resume
sandbox.Resume("admin@acme.com")
```

---

### PHASE 5: INTEGRATION TESTS

#### 5.1 End-to-End Multi-Tenant Scenario
- [ ] **Scenario:** 2 tenants using same infrastructure
- [ ] **Test:** Tenant A spawns workers
- [ ] **Test:** Tenant B spawns workers
- [ ] **Verify:** Workers isolated (separate pools)
- [ ] **Test:** Tenant A hits quota
- [ ] **Verify:** Tenant B unaffected

#### 5.2 Memory + Quota Integration
- [ ] **Test:** Tenant stores 100k memories
- [ ] **Test:** Check memory stats → verify count
- [ ] **Test:** Apply retention policy → old memories deleted
- [ ] **Test:** Purge tenant → all data gone

#### 5.3 Federation Security Flow
- [ ] **Test:** Discover new kernel
- [ ] **Verify:** Trust score calculated
- [ ] **Test:** If score < 70 → auto-reject
- [ ] **Test:** If score >= 70 → manual approval required
- [ ] **Test:** After approval → invocation succeeds

---

### PHASE 6: PERFORMANCE & LOAD TESTING

#### 6.1 Concurrent Tenants
- [ ] **Load:** 10 tenants × 100 req/s each
- [ ] **Verify:** No cross-tenant interference
- [ ] **Verify:** Response time < 200ms p95
- [ ] **Verify:** No memory leaks

**Tools:**
- k6 for load testing
- Grafana for metrics
- Jaeger for traces

#### 6.2 Quota Enforcement Under Load
- [ ] **Load:** Tenant hits quota while under 500 req/s
- [ ] **Verify:** Requests blocked instantly
- [ ] **Verify:** Other tenants unaffected
- [ ] **Verify:** No race conditions

#### 6.3 Auto-Scaler Stress Test
- [ ] **Load:** Spike from 10 to 1000 req/s
- [ ] **Verify:** Workers scale up within 30s
- [ ] **Verify:** Cost governor prevents runaway scaling
- [ ] **Load:** Drop to 10 req/s
- [ ] **Verify:** Workers scale down after idle period

---

### PHASE 7: SECURITY AUDIT

#### 7.1 Penetration Testing Scenarios
- [ ] **Attack:** Try SQL injection on tenant_id parameter
- [ ] **Attack:** Try to guess another tenant's API key
- [ ] **Attack:** Try to bypass RLS with SET search_path
- [ ] **Attack:** Try to force OOM with infinite memory storage
- [ ] **Attack:** Try to DDoS via federation invocations

#### 7.2 Secrets Management
- [ ] **Verify:** tenant secrets encrypted at rest
- [ ] **Verify:** API keys not in logs
- [ ] **Verify:** Database passwords in env vars only
- [ ] **Verify:** No hardcoded credentials

#### 7.3 Audit Trail
- [ ] **Verify:** All tenant creation logged
- [ ] **Verify:** All memory purges logged
- [ ] **Verify:** All federation calls logged
- [ ] **Verify:** All quota violations logged

---

## 📊 ACCEPTANCE CRITERIA

System is **PRODUCTION-READY** when:

### ✅ Tenant Isolation
- [ ] All isolation tests PASS
- [ ] Fuzz tests run 10,000 iterations WITHOUT panic
- [ ] Load test with 10 tenants shows ZERO cross-contamination

### ✅ GDPR Compliance
- [ ] Purge deletes 100% of tenant data
- [ ] Retention policies auto-enforce
- [ ] Audit trail complete and immutable

### ✅ Cost Protection
- [ ] Cost governor prevents runaway scaling
- [ ] No tenant can exceed tier limits
- [ ] Throttling triggers automatically on abuse

### ✅ Federation Security
- [ ] Sandbox mode blocks unauthorized kernels
- [ ] Rate limiting prevents DDoS
- [ ] Emergency stop works instantly

### ✅ Performance
- [ ] <200ms p95 latency under load
- [ ] Zero memory leaks in 24h soak test
- [ ] Auto-scaler handles 10x traffic spike

---

## 🚨 BLOCKER ISSUES (MUST FIX BEFORE PROD)

### Critical
- [ ] Implement Postgres RLS (or equivalent for SQLite)
- [ ] Add real embedding service (not mock)
- [ ] Enable HTTPS for all federation calls
- [ ] Implement API key rotation

### High
- [ ] Add distributed tracing for federation calls
- [ ] Implement webhook signing for tenant callbacks
- [ ] Add metrics export for cost governor
- [ ] Create admin dashboard for sandbox management

### Medium
- [ ] Document runbook for emergency stop
- [ ] Create tenant onboarding checklist
- [ ] Build automated quota alerts
- [ ] Add Slack/PagerDuty integration

---

## 🎯 NEXT STEPS (AFTER GREEN CHECKLIST)

### Week 1: Production Deploy (Staging)
- Deploy to staging environment
- Run full test suite
- Monitor for 48 hours
- Fix any issues found

### Week 2: Pilot Customer
- Onboard 1 paying customer (or free pilot)
- Real workload testing
- Gather feedback
- Iterate on UX

### Week 3-4: Scale Validation
- Onboard 2-3 more customers
- Monitor costs vs revenue
- Validate pricing model
- Prepare for Series A if metrics good

---

## 📝 SIGN-OFF

Before marking this checklist complete, the following must approve:

- [ ] **Tech Lead (You):** All tests pass, no known security issues
- [ ] **Security Review:** Penetration test results acceptable
- [ ] **Compliance:** GDPR requirements met
- [ ] **Finance:** Cost model validated with real usage data

---

**Status:** 🟡 IN PROGRESS  
**Target:** GREEN within 2 weeks  
**Next Review:** After isolation tests complete

---

**This is the path to production. No shortcuts.**
