#!/bin/bash
# PostToolUse hook - Follow-up action reminders

FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)
[[ -z "$FILE_PATH" ]] && exit 0

# Schema changes → push + codegen
if [[ "$FILE_PATH" =~ apps/api/src/db/schema.ts ]]; then
  echo ""
  echo "⚠️  Database schema changed!"
  echo "   Next: cd apps/api && npm run db:push"
  echo "   Then: npm run codegen (from root)"
  echo ""
fi

# GraphQL files → codegen
if [[ "$FILE_PATH" =~ \.graphql$ ]]; then
  echo ""
  echo "🔮 GraphQL file changed"
  echo "   Next: npm run codegen"
  echo ""
fi

# package.json → suggest install
if [[ "$FILE_PATH" =~ package.json$ ]]; then
  echo ""
  echo "📦 package.json changed"
  echo "   Consider: npm install"
  echo ""
fi

# UI component → export reminder
if [[ "$FILE_PATH" =~ packages/ui/src/components/.*\.tsx ]]; then
  COMPONENT_NAME=$(basename "$FILE_PATH" .tsx)
  echo ""
  echo "📦 UI component created/modified: $COMPONENT_NAME"
  echo "   Remember: Export from packages/ui/src/components/index.ts"
  echo ""
fi

# Edge Function config.toml → deploy reminder
if [[ "$FILE_PATH" =~ apps/api/supabase/config.toml ]]; then
  echo ""
  echo "⚙️  Edge Function config changed"
  echo "   To deploy: cd apps/api && npm run deploy:functions"
  echo ""
fi

exit 0
