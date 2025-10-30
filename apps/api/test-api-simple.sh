#!/bin/bash

# Simple Edge Function Test Script
# Tests the API edge function directly

set -e

# Configuration
PROJECT_ID="xennuhfmnucybtyzfgcl"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4MzUyMCwiZXhwIjoyMDc2NjU5NTIwfQ.Ur5mzg-ZUGfIO31-buAzORvEZH-93b5uAJPa2Z6YI7Q"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${2:-$NC}$1${NC}"
}

log "🚀 Testing Edge Function Directly" "$BOLD$MAGENTA"
log "================================" "$MAGENTA"

# Test 1: Health check endpoint (if available)
log "\n🏥 Testing health endpoint..." "$CYAN"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${SUPABASE_URL}/functions/v1/api/health" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  --max-time 10)

HTTP_CODE="${HEALTH_RESPONSE: -3}"
RESPONSE_BODY="${HEALTH_RESPONSE%???}"

log "📊 Health Check Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Health endpoint working!" "$GREEN"
else
    log "ℹ️ Health endpoint not available (this is expected)" "$YELLOW"
fi

# Test 2: Basic endpoint test
log "\n🧪 Testing basic API endpoint..." "$CYAN"
BASIC_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${SUPABASE_URL}/functions/v1/api" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  --max-time 30)

HTTP_CODE="${BASIC_RESPONSE: -3}"
RESPONSE_BODY="${BASIC_RESPONSE%???}"

log "📊 Basic Endpoint Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Basic endpoint working!" "$GREEN"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    log "ℹ️ Basic endpoint returns 404 (expected - no routes defined)" "$YELLOW"
else
    log "❌ Basic endpoint failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

# Test 3: Test with authentication middleware (should fail without proper token)
log "\n🔒 Testing auth middleware..." "$CYAN"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${SUPABASE_URL}/functions/v1/api/threads" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  --max-time 30)

HTTP_CODE="${AUTH_RESPONSE: -3}"
RESPONSE_BODY="${AUTH_RESPONSE%???}"

log "📊 Auth Test Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "401" ]; then
    log "✅ Auth middleware working (correctly rejecting service role token)" "$GREEN"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    log "ℹ️ Routes not yet implemented (returns 404)" "$YELLOW"
else
    log "❌ Auth test failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

# Test 4: Test OPTIONS request (CORS preflight)
log "\n🌐 Testing CORS preflight..." "$CYAN"
CORS_RESPONSE=$(curl -s -w "%{http_code}" -X OPTIONS "${SUPABASE_URL}/functions/v1/api/threads" \
  -H "Origin: http://localhost:3003" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  --max-time 10)

HTTP_CODE="${CORS_RESPONSE: -3}"
RESPONSE_BODY="${CORS_RESPONSE%???}"

log "📊 CORS Preflight Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    log "✅ CORS preflight working!" "$GREEN"
else
    log "❌ CORS preflight failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

log "\n🎉 Edge Function Tests Completed!" "$BOLD$GREEN"
log "\n📋 Summary:" "$YELLOW"
log "• If basic endpoint works → Edge function is booting correctly" "$YELLOW"
log "• If auth middleware works → Security is functioning" "$YELLOW"
log "• If CORS works → Frontend can communicate with backend" "$YELLOW"
log "\n🔧 Next Steps:" "$CYAN"
log "1. Implement the actual route handlers (threads, messages, etc.)" "$CYAN"
log "2. Test with real user authentication from the frontend" "$CYAN"
log "3. Verify realtime subscriptions are working" "$CYAN"