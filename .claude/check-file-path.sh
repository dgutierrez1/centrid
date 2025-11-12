#!/bin/bash
# PreToolUse hook - Context-aware guidance + blocking invalid operations
# Receives JSON via stdin with tool_input containing file_path

FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[[ -z "$FILE_PATH" ]] && exit 0

# ============================================================================
# BLOCKING RULES (exit non-zero to prevent operation)
# ============================================================================

# Block components.json in packages/ui (must use script)
if [[ "$FILE_PATH" =~ packages/ui/components.json ]]; then
  echo "❌ BLOCKED: Don't create components.json in packages/ui"
  echo "   Use: ./scripts/add-component.sh <name>"
  exit 1
fi

# ============================================================================
# GUIDANCE (exit 0 to allow, but show reminders)
# ============================================================================

# packages/ui - Pure UI components only
if [[ "$FILE_PATH" =~ packages/ui/src/ ]]; then
  echo "📦 packages/ui - Pure UI components:"
  echo "   ✅ Pure React components only"
  echo "   ❌ NO Supabase, Valtio, or server dependencies"
  echo "   📝 Remember to export from packages/ui/src/components/index.ts"
  echo ""
fi

# Edge Functions - Thin handlers
if [[ "$FILE_PATH" =~ apps/api/src/functions/.*/.*.ts ]]; then
  echo "⚡ Edge Function - Thin handler pattern:"
  echo "   ✅ Use Services (NOT Repositories)"
  echo "   ✅ Use logger (NOT console.log)"
  echo "   ❌ NO inline DB queries (db.select/insert/etc)"
  echo "   Pattern: Validate → Service call → Response"
  echo ""
fi

# Database schema changes
if [[ "$FILE_PATH" =~ apps/api/src/db/schema.ts ]]; then
  echo "🗄️  Database Schema:"
  echo "   After saving: cd apps/api && npm run db:push"
  echo "   Then: npm run codegen (updates GraphQL types)"
  echo ""
fi

# GraphQL schema/queries
if [[ "$FILE_PATH" =~ \.graphql$ ]]; then
  echo "🔮 GraphQL Schema/Query:"
  echo "   After saving: npm run codegen"
  echo "   Generates types in apps/web/src/types/graphql.ts"
  echo ""
fi

# New Edge Function detection
if [[ "$FILE_PATH" =~ apps/api/src/functions/([^/]+)/index.ts ]]; then
  FUNCTION_NAME="${BASH_REMATCH[1]}"

  # Check if function exists in config.toml
  if ! grep -q "\[functions.$FUNCTION_NAME\]" apps/api/supabase/config.toml 2>/dev/null; then
    echo "📝 New Edge Function detected: $FUNCTION_NAME"
    echo "   Don't forget: Add to apps/api/supabase/config.toml"
    echo ""
    echo "   [functions.$FUNCTION_NAME]"
    echo "   entrypoint = '../src/functions/$FUNCTION_NAME/index.ts'"
    echo "   import_map = '../import_map.json'"
    echo ""
  fi
fi

exit 0
