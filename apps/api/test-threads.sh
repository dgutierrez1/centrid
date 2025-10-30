#!/bin/bash

# Thread Endpoint Test Script
# Tests thread endpoints with proper authentication

set -e

# Configuration
PROJECT_ID="xennuhfmnucybtyzfgcl"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM1MjAsImV4cCI6MjA3NjY1OTUyMH0.C3Y4zGw8hKjM4Xq8jN2PzX7wR6F5kL9m8P2qS1tW5uE"

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

# Generate random test user data
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PASSWORD="testpassword123"

log "🚀 Starting Thread Endpoint Tests" "$BOLD$MAGENTA"
log "=====================================" "$MAGENTA"

# Step 1: Create test user
log "\n🔐 Creating test user..." "$CYAN"
CREATE_RESPONSE=$(curl -s -w "%{http_code}" -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"data\": {
      \"first_name\": \"Test\",
      \"last_name\": \"User\"
    }
  }")

HTTP_CODE="${CREATE_RESPONSE: -3}"
RESPONSE_BODY="${CREATE_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Test user created successfully" "$GREEN"
    USER_DATA=$(echo "$RESPONSE_BODY" | jq '.')
    log "User ID: $(echo "$USER_DATA" | jq -r '.user.id')" "$BLUE"
else
    log "❌ Failed to create user (HTTP $HTTP_CODE)" "$RED"
    log "Response: $RESPONSE_BODY" "$RED"
    exit 1
fi

# Step 2: Sign in to get access token
log "\n🔑 Signing in user..." "$CYAN"
SIGNIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

HTTP_CODE="${SIGNIN_RESPONSE: -3}"
RESPONSE_BODY="${SIGNIN_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ User signed in successfully" "$GREEN"
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.access_token')
    log "Access Token: ${ACCESS_TOKEN:0:20}..." "$BLUE"
else
    log "❌ Failed to sign in (HTTP $HTTP_CODE)" "$RED"
    log "Response: $RESPONSE_BODY" "$RED"
    exit 1
fi

# Step 3: Test GET threads endpoint
log "\n🧵 Testing GET /api/threads endpoint..." "$CYAN"
GET_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${SUPABASE_URL}/functions/v1/api/threads" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE="${GET_RESPONSE: -3}"
RESPONSE_BODY="${GET_RESPONSE%???}"

log "📊 Response Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ GET threads endpoint working!" "$GREEN"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    log "❌ GET request failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

# Step 4: Test POST thread creation
log "\n📝 Testing POST /api/threads endpoint..." "$CYAN"
POST_RESPONSE=$(curl -s -w "%{http_code}" -X POST "${SUPABASE_URL}/functions/v1/api/threads" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Thread for Realtime",
    "content": "This is a test thread to verify realtime functionality"
  }')

HTTP_CODE="${POST_RESPONSE: -3}"
RESPONSE_BODY="${POST_RESPONSE%???}"

log "📊 Response Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    log "✅ Thread creation successful!" "$GREEN"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

    # Extract thread ID for potential future tests
    THREAD_ID=$(echo "$RESPONSE_BODY" | jq -r '.id // empty')
    if [ "$THREAD_ID" != "null" ] && [ -n "$THREAD_ID" ]; then
        log "Created Thread ID: $THREAD_ID" "$BLUE"
    fi
else
    log "❌ Thread creation failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

# Step 5: Test GET threads again to see created thread
log "\n🔍 Testing GET /api/threads again..." "$CYAN"
GET_RESPONSE2=$(curl -s -w "%{http_code}" -X GET "${SUPABASE_URL}/functions/v1/api/threads" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE="${GET_RESPONSE2: -3}"
RESPONSE_BODY="${GET_RESPONSE2%???}"

log "📊 Response Status: $HTTP_CODE" "$BLUE"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Second GET request successful!" "$GREEN"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    log "❌ Second GET request failed (HTTP $HTTP_CODE)" "$RED"
    log "\n📋 Response Data:" "$BOLD"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi

log "\n🎉 All tests completed!" "$BOLD$GREEN"
log "\n💡 Tips:" "$YELLOW"
log "• If endpoints work, your edge function is ready for realtime testing" "$YELLOW"
log "• Use the Supabase dashboard to monitor realtime subscriptions" "$YELLOW"
log "• Check browser console for realtime connection logs" "$YELLOW"
log "• Test realtime by opening the app in two browser windows" "$YELLOW"