#!/usr/bin/env bash

# extract-context.sh - Generate context.md from source docs + code discovery
# Usage: extract-context.sh <feature-dir>
# Output: Writes context.md to specs/<feature-dir>/context.md

set -euo pipefail

FEATURE_DIR="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/.specify/scripts/context"
SPECS_DIR="$PROJECT_ROOT/specs"

if [[ -z "$FEATURE_DIR" ]]; then
  echo "Error: Feature directory required" >&2
  echo "Usage: extract-context.sh <feature-dir>" >&2
  exit 1
fi

FEATURE_PATH="$SPECS_DIR/$FEATURE_DIR"

if [[ ! -d "$FEATURE_PATH" ]]; then
  echo "Error: Feature directory not found: $FEATURE_PATH" >&2
  exit 1
fi

echo "Generating context for feature: $FEATURE_DIR" >&2

# Step 1: Calculate hash and check if regeneration needed
echo "Calculating source hash..." >&2
HASH_RESULT=$("$SCRIPTS_DIR/calculate-hash.sh" "$FEATURE_DIR")
SOURCE_HASH=$(echo "$HASH_RESULT" | jq -r '.source_hash')
NEEDS_REGEN=$(echo "$HASH_RESULT" | jq -r '.needs_regen')

if [[ "$NEEDS_REGEN" == "false" ]]; then
  echo "✅ Context is up-to-date (source docs unchanged)" >&2
  echo "📄 Load with: cat $FEATURE_PATH/context.md" >&2
  exit 0
fi

# Step 2: Discover code state
echo "Discovering code state..." >&2
CODE_STATE=$("$SCRIPTS_DIR/discover-code-state.sh" "$FEATURE_DIR" 2>/dev/null)

# Step 3: Read source docs for basic metadata
FEATURE_NUMBER=$(echo "$FEATURE_DIR" | cut -d'-' -f1)
FEATURE_SHORT_NAME=$(echo "$FEATURE_DIR" | cut -d'-' -f2- | tr '-' '_')
FEATURE_NAME=$(echo "$FEATURE_DIR" | cut -d'-' -f2- | tr '-' ' ' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')

# Determine status (simplified)
if [[ -f "$FEATURE_PATH/tasks.md" ]] && grep -q "100%" "$FEATURE_PATH/tasks.md" 2>/dev/null; then
  STATUS="completed"
elif git branch -a 2>/dev/null | grep -q "$FEATURE_DIR"; then
  STATUS="in-progress"
else
  STATUS="planned"
fi

# Extract quick summary from spec.md (first non-header paragraph)
QUICK_SUMMARY=""
if [[ -f "$FEATURE_PATH/spec.md" ]]; then
  QUICK_SUMMARY=$(sed -n '/^[^#]/,/^$/p' "$FEATURE_PATH/spec.md" | head -n 1 || echo "No summary available")
fi

# Step 4: Generate context.md
CONTEXT_FILE="$FEATURE_PATH/context.md"
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOKEN_ESTIMATE=2500  # Simplified estimate

cat > "$CONTEXT_FILE" <<EOF
---
feature: "$FEATURE_DIR"
number: "$FEATURE_NUMBER"
short_name: "$FEATURE_SHORT_NAME"
generated: "$GENERATED_AT"
version: "1.0.0"
status: "$STATUS"
source_docs: $(echo "$HASH_RESULT" | jq -c '.source_docs')
source_hash: "$SOURCE_HASH"
token_estimate: $TOKEN_ESTIMATE
---

# Feature Context: $FEATURE_NAME

**ID:** \`$FEATURE_DIR\` | **Status:** $STATUS | **Discovered:** $GENERATED_AT

## Quick Summary

$QUICK_SUMMARY

## Code State (Discovered: $GENERATED_AT)

### UI Layer ($(echo "$CODE_STATE" | jq '.stats.total_ui') files)

**Components** ($(echo "$CODE_STATE" | jq '.layers.ui.components | length')):
$(echo "$CODE_STATE" | jq -r '.layers.ui.components[]' | sed 's/^/- /' | head -n 10 || echo "- None found")
$(if [[ $(echo "$CODE_STATE" | jq '.layers.ui.components | length') -gt 10 ]]; then echo "- ... and $(echo "$CODE_STATE" | jq '.layers.ui.components | length - 10') more"; fi)

**UI Package** ($(echo "$CODE_STATE" | jq '.layers.ui.ui_package | length')):
$(echo "$CODE_STATE" | jq -r '.layers.ui.ui_package[]' | sed 's/^/- /' | head -n 10 || echo "- None found")
$(if [[ $(echo "$CODE_STATE" | jq '.layers.ui.ui_package | length') -gt 10 ]]; then echo "- ... and $(echo "$CODE_STATE" | jq '.layers.ui.ui_package | length - 10') more"; fi)

### State Management ($(echo "$CODE_STATE" | jq '.stats.total_state_management') files)

**Hooks** ($(echo "$CODE_STATE" | jq '.layers.state_management.hooks | length')):
$(echo "$CODE_STATE" | jq -r '.layers.state_management.hooks[]' | sed 's/^/- /' | head -n 15 || echo "- None found")
$(if [[ $(echo "$CODE_STATE" | jq '.layers.state_management.hooks | length') -gt 15 ]]; then echo "- ... and $(echo "$CODE_STATE" | jq '.layers.state_management.hooks | length - 15') more"; fi)

**State Stores** ($(echo "$CODE_STATE" | jq '.layers.state_management.state_stores | length')):
$(echo "$CODE_STATE" | jq -r '.layers.state_management.state_stores[] | "- **\(.name)** (\(.file))"' || echo "- None found")

**Contexts** ($(echo "$CODE_STATE" | jq '.layers.state_management.contexts | length')):
$(echo "$CODE_STATE" | jq -r '.layers.state_management.contexts[]' | sed 's/^/- /' || echo "- None found")

### Frontend Utilities ($(echo "$CODE_STATE" | jq '.stats.total_frontend_utilities') files)

**Validators** ($(echo "$CODE_STATE" | jq '.layers.frontend_utilities.validators | length')):
$(echo "$CODE_STATE" | jq -r '.layers.frontend_utilities.validators[]' | sed 's/^/- /' || echo "- None found")

**Utils** ($(echo "$CODE_STATE" | jq '.layers.frontend_utilities.utils | length')):
$(echo "$CODE_STATE" | jq -r '.layers.frontend_utilities.utils[]' | sed 's/^/- /' || echo "- None found")

**Constants** ($(echo "$CODE_STATE" | jq '.layers.frontend_utilities.constants | length')):
$(echo "$CODE_STATE" | jq -r '.layers.frontend_utilities.constants[]' | sed 's/^/- /' || echo "- None found")

**Types** ($(echo "$CODE_STATE" | jq '.layers.frontend_utilities.types | length')):
$(echo "$CODE_STATE" | jq -r '.layers.frontend_utilities.types[]' | sed 's/^/- /' || echo "- None found")

### API Layer ($(echo "$CODE_STATE" | jq '.stats.total_api') files)

**GraphQL Types** ($(echo "$CODE_STATE" | jq '.layers.api_layer.graphql_types | length')):
$(echo "$CODE_STATE" | jq -r '.layers.api_layer.graphql_types[]' | sed 's/^/- /' || echo "- None found")

**Controllers** ($(echo "$CODE_STATE" | jq '.layers.api_layer.controllers | length')):
$(echo "$CODE_STATE" | jq -r '.layers.api_layer.controllers[]' | sed 's/^/- /' || echo "- None found")

**Operations**:
- Mutations: $(echo "$CODE_STATE" | jq -r '.integrations.graphql_operations.mutations | join(", ")' || echo "None")
- Queries: $(echo "$CODE_STATE" | jq -r '.integrations.graphql_operations.queries | join(", ")' || echo "None")

### Business Logic ($(echo "$CODE_STATE" | jq '.stats.total_business_logic') files)

**Services** ($(echo "$CODE_STATE" | jq '.layers.business_logic.services | length')):
$(echo "$CODE_STATE" | jq -r '.layers.business_logic.services[]' | sed 's/^/- /' || echo "- None found")

### Data Access ($(echo "$CODE_STATE" | jq '.stats.total_data_access') files)

**Repositories** ($(echo "$CODE_STATE" | jq '.layers.data_access.repositories | length')):
$(echo "$CODE_STATE" | jq -r '.layers.data_access.repositories[]' | sed 's/^/- /' || echo "- None found")

**Edge Functions** ($(echo "$CODE_STATE" | jq '.layers.data_access.edge_functions | length')):
$(echo "$CODE_STATE" | jq -r '.layers.data_access.edge_functions[]' | sed 's/^/- /' || echo "- None found")

**Database Tables** ($(echo "$CODE_STATE" | jq '.layers.data_access.db_tables | length')):
$(echo "$CODE_STATE" | jq -r '.layers.data_access.db_tables[]' | sed 's/^/- /' || echo "- None found")

## Links

- **[Spec](./$FEATURE_PATH/spec.md)** - Full requirements and user stories
- **[Plan](./$FEATURE_PATH/plan.md)** - Complete technical approach
- **[Tasks](./$FEATURE_PATH/tasks.md)** - Implementation checklist

---

*Context generated automatically. Run \`/speckit.context $FEATURE_SHORT_NAME\` to regenerate.*
EOF

echo "✅ Context generated: $CONTEXT_FILE" >&2
echo "📊 Token estimate: $TOKEN_ESTIMATE tokens" >&2
echo "🔗 Source hash: $SOURCE_HASH" >&2
