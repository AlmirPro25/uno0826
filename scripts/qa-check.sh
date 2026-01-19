#!/bin/bash

# =========================================
# PROST-QS - Local QA Script
# =========================================
# 
# Executa validações de qualidade localmente
# antes de fazer push para o repositório.
#
# Uso: ./scripts/qa-check.sh
#
# Criado em: 19/01/2026
# =========================================

set -e

echo "🛡️ PROST-QS Quality Assurance Check"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper function
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAIL++))
    fi
}

warn_result() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARN++))
}

echo "📁 Checking from: $(pwd)"
echo ""

# =========================================
# 1. Go Vet (Static Analysis)
# =========================================
echo "🔍 Running Go Vet..."
cd backend
if go vet ./... 2>&1 | grep -v "^$"; then
    check_result 1 "Go Vet found issues"
else
    check_result 0 "Go Vet passed"
fi

# =========================================
# 2. Go Build
# =========================================
echo ""
echo "🔨 Building binary..."
if CGO_ENABLED=0 go build -o /tmp/prost-qs-test ./cmd/api/main.go 2>&1; then
    check_result 0 "Build successful"
    rm -f /tmp/prost-qs-test
else
    check_result 1 "Build failed"
fi

# =========================================
# 3. Run Tests
# =========================================
echo ""
echo "🧪 Running tests..."
export JWT_SECRET="qa_test_jwt_secret_32bytes_min!!"
export AES_SECRET_KEY="qa_test_aes_key_32bytes_minimum!"
export SECRETS_MASTER_KEY="qa_test_master_key_32bytes_min!"
export SQLITE_DB_PATH=":memory:"
export GIN_MODE="test"

TEST_OUTPUT=$(go test -race -coverprofile=/tmp/coverage.out ./... 2>&1)
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    check_result 0 "All tests passed"
else
    check_result 1 "Some tests failed"
    echo "$TEST_OUTPUT" | grep -E "^--- FAIL" || true
fi

# =========================================
# 4. Coverage Check
# =========================================
echo ""
echo "📊 Checking coverage..."
if [ -f /tmp/coverage.out ]; then
    COVERAGE=$(go tool cover -func=/tmp/coverage.out | grep total | awk '{print $3}' | sed 's/%//')
    echo "   Total Coverage: ${COVERAGE}%"
    
    MIN_COVERAGE=25
    if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
        warn_result "Coverage ${COVERAGE}% is below recommended ${MIN_COVERAGE}%"
    else
        check_result 0 "Coverage meets minimum (${COVERAGE}% >= ${MIN_COVERAGE}%)"
    fi
fi

cd ..

# =========================================
# 5. Check for Secrets in Code
# =========================================
echo ""
echo "🔒 Scanning for secrets..."
SECRETS_FOUND=0

# Check for API keys
if grep -rE "pq_pk_[a-zA-Z0-9]{32}" --include="*.md" --include="*.go" . 2>/dev/null | grep -v ".git" | grep -v node_modules; then
    SECRETS_FOUND=1
fi

if grep -rE "pq_sk_[a-zA-Z0-9]+" --include="*.md" --include="*.go" . 2>/dev/null | grep -v ".git" | grep -v node_modules; then
    SECRETS_FOUND=1
fi

if grep -rE "sk_live_[a-zA-Z0-9]+" --include="*.md" --include="*.go" --include="*.ts" . 2>/dev/null | grep -v ".git" | grep -v node_modules; then
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 1 ]; then
    warn_result "Potential secrets found in code - please review"
else
    check_result 0 "No secrets detected in code"
fi

# =========================================
# 6. Check .env not committed
# =========================================
echo ""
echo "📝 Checking .env files..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    check_result 1 ".env is tracked by git (SECURITY RISK!)"
else
    check_result 0 ".env is not tracked by git"
fi

# =========================================
# 7. Check for large files
# =========================================
echo ""
echo "📦 Checking for large files..."
LARGE_FILES=$(find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    warn_result "Large files found (>10MB):"
    echo "$LARGE_FILES" | head -5
else
    check_result 0 "No excessively large files"
fi

# =========================================
# Summary
# =========================================
echo ""
echo "==========================================="
echo "📋 QA SUMMARY"
echo "==========================================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ QA Check FAILED - Fix issues before pushing${NC}"
    exit 1
else
    if [ $WARN -gt 0 ]; then
        echo -e "${YELLOW}⚠️  QA Check passed with warnings${NC}"
    else
        echo -e "${GREEN}✅ QA Check PASSED - Safe to push${NC}"
    fi
    exit 0
fi
