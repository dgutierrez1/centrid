#!/usr/bin/env bash

# calculate-hash.sh - Calculate source hash for idempotence checking
# Usage: calculate-hash.sh <feature-dir>
# Output: JSON with hash and needs_regen boolean

set -euo pipefail

FEATURE_DIR="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SPECS_DIR="$PROJECT_ROOT/specs"

if [[ -z "$FEATURE_DIR" ]]; then
  echo "Error: Feature directory required" >&2
  echo "Usage: calculate-hash.sh <feature-dir>" >&2
  exit 1
fi

FEATURE_PATH="$SPECS_DIR/$FEATURE_DIR"

if [[ ! -d "$FEATURE_PATH" ]]; then
  echo "Error: Feature directory not found: $FEATURE_PATH" >&2
  exit 1
fi

# Find all source docs
SOURCE_DOCS=()
for doc in spec.md plan.md ux.md design.md data-model.md research.md tasks.md; do
  if [[ -f "$FEATURE_PATH/$doc" ]]; then
    SOURCE_DOCS+=("$FEATURE_PATH/$doc")
  fi
done

if [[ ${#SOURCE_DOCS[@]} -eq 0 ]]; then
  echo "Error: No source documents found in $FEATURE_PATH" >&2
  exit 1
fi

# Calculate hash of all source docs
SOURCE_HASH=$(cat "${SOURCE_DOCS[@]}" 2>/dev/null | shasum -a 256 | cut -d' ' -f1)

# Check if context.md exists
NEEDS_REGEN="true"
if [[ -f "$FEATURE_PATH/context.md" ]]; then
  # Extract existing hash from context.md
  EXISTING_HASH=$(grep "^source_hash:" "$FEATURE_PATH/context.md" 2>/dev/null | sed 's/source_hash: "\(.*\)"/\1/' || echo "")

  if [[ "$SOURCE_HASH" == "$EXISTING_HASH" ]]; then
    NEEDS_REGEN="false"
  fi
fi

# Output JSON
cat <<EOF
{
  "source_hash": "$SOURCE_HASH",
  "needs_regen": $NEEDS_REGEN,
  "source_docs": [$(IFS=,; echo "\"${SOURCE_DOCS[*]##*/}\"" | sed 's/" "/", "/g')]
}
EOF
