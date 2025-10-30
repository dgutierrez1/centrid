#!/bin/bash

# Simple test script for local API testing
# Usage: ./test-api-local.sh

BASE_URL="http://localhost:54321/functions/v1/api"

echo "🧪 Testing Centrid API locally..."
echo ""

# Test 1: Root endpoint (no auth)
echo "1️⃣ Testing GET / (API info)"
curl -s "$BASE_URL/" | jq '.'
echo ""

# Test 2: Health check (no auth)
echo "2️⃣ Testing GET /health"
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 3: Protected route (requires auth)
echo "3️⃣ Testing GET /api/test (requires auth)"
echo "   Without token (should fail with 401):"
curl -s "$BASE_URL/api/test" | jq '.'
echo ""

# Test 4: With auth token (replace with real token to test)
# echo "4️⃣ Testing GET /api/test (with auth)"
# TOKEN="your-jwt-token-here"
# curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/test" | jq '.'
# echo ""

echo "✅ Basic tests complete!"
echo ""
echo "To test with auth:"
echo "1. Get a JWT token from your Supabase auth"
echo "2. Run: curl -H \"Authorization: Bearer YOUR_TOKEN\" $BASE_URL/api/test"
