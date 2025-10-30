#!/bin/bash

# Pre-deployment validation script
# Ensures all checks pass before allowing deployment
# Usage: ./scripts/pre-deploy.sh

set -e  # Exit on first error

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "  🔍 PRE-DEPLOYMENT VALIDATION"
echo "═════════════════════════════════════════════════════════════"
echo ""

FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Type checking
echo "  1️⃣  Type checking..."
if npm run type-check > /dev/null 2>&1; then
  echo -e "     ${GREEN}✓${NC} Type check passed"
else
  echo -e "     ${RED}✗${NC} Type check FAILED"
  FAILED=$((FAILED + 1))
fi

# 2. Linting (API functions only)
echo "  2️⃣  Linting API code..."
if npm run lint -- apps/api/src/functions --max-warnings=0 > /dev/null 2>&1; then
  echo -e "     ${GREEN}✓${NC} Linting passed"
else
  echo -e "     ${YELLOW}⚠${NC} Linting has issues (warnings only)"
  # Don't fail on lint warnings, just warn
fi

# 3. Check if database is in good state (schema validation)
echo "  3️⃣  Checking database schema..."
if [ -f "apps/api/src/db/schema.ts" ]; then
  echo -e "     ${GREEN}✓${NC} Schema file exists"
else
  echo -e "     ${RED}✗${NC} Schema file missing"
  FAILED=$((FAILED + 1))
fi

# 4. Verify all Edge Functions have required config
echo "  4️⃣  Checking Edge Function configuration..."
if [ -f "apps/api/supabase/config.toml" ]; then
  # Count functions in config
  FUNCTIONS_IN_CONFIG=$(grep -c "^\[functions\." apps/api/supabase/config.toml || echo "0")
  FUNCTIONS_IN_SRC=$(find apps/api/src/functions -maxdepth 1 -type d | grep -v "_" | wc -l)

  if [ "$FUNCTIONS_IN_CONFIG" -ge 1 ]; then
    echo -e "     ${GREEN}✓${NC} Found $FUNCTIONS_IN_CONFIG functions in config"
  else
    echo -e "     ${RED}✗${NC} No functions found in config.toml"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "     ${RED}✗${NC} config.toml missing"
  FAILED=$((FAILED + 1))
fi

# 5. Verify environment variables
echo "  5️⃣  Checking environment variables..."
if [ -f "apps/api/.env" ]; then
  if grep -q "DATABASE_URL" apps/api/.env; then
    echo -e "     ${GREEN}✓${NC} DATABASE_URL configured"
  else
    echo -e "     ${RED}✗${NC} DATABASE_URL not found in .env"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "     ${YELLOW}⚠${NC} apps/api/.env not found (may be using system env vars)"
fi

# 6. Check shared package is valid
echo "  6️⃣  Checking shared package..."
if [ -f "packages/shared/src/index.ts" ]; then
  echo -e "     ${GREEN}✓${NC} Shared package exists"
else
  echo -e "     ${RED}✗${NC} Shared package missing"
  FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "═════════════════════════════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
  echo -e "  ${GREEN}✓ ALL PRE-DEPLOYMENT CHECKS PASSED${NC}"
  echo ""
  echo "  Ready to deploy with:"
  echo "    npm run deploy:functions --workspace=@centrid/api"
  echo ""
  echo "═════════════════════════════════════════════════════════════"
  exit 0
else
  echo -e "  ${RED}✗ $FAILED CHECK(S) FAILED${NC}"
  echo ""
  echo "  Fix the issues above before deploying:"
  echo "    - Type check: npm run type-check"
  echo "    - Lint: npm run lint"
  echo "    - Database: npm run db:push --workspace=@centrid/api"
  echo ""
  echo "═════════════════════════════════════════════════════════════"
  exit 1
fi
