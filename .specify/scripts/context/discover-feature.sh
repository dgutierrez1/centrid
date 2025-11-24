#!/usr/bin/env bash

# discover-feature.sh - Feature discovery for context system
# Usage: discover-feature.sh [ARGUMENTS]
# Output: Feature directory path (e.g., "003-filesystem-markdown-editor")

set -euo pipefail

ARGS="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SPECS_DIR="$PROJECT_ROOT/specs"

# Find all feature directories
find_all_features() {
  find "$SPECS_DIR" -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' | sort | xargs -n1 basename
}

# Auto-detect feature from current branch
auto_detect_feature() {
  local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

  if [[ -z "$current_branch" ]] || [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
    echo "Error: Could not auto-detect feature. Not on a feature branch." >&2
    echo "Usage: /speckit.context [feature-number|keyword|full-name]" >&2
    exit 1
  fi

  # Check if branch matches a feature directory
  if [[ -d "$SPECS_DIR/$current_branch" ]]; then
    echo "$current_branch"
    return 0
  fi

  echo "Error: Branch '$current_branch' does not match any feature directory." >&2
  exit 1
}

# List all features with status
list_features() {
  echo "Available features in codebase:"
  echo ""

  while IFS= read -r feature; do
    local has_context=""
    if [[ -f "$SPECS_DIR/$feature/context.md" ]]; then
      has_context="✅ cached"
    else
      has_context="⬜ uncached"
    fi

    local short_name=$(echo "$feature" | cut -d'-' -f2- | tr '-' ' ' | awk '{print tolower($0)}' | tr ' ' '-')
    local command_file="$PROJECT_ROOT/.claude/commands/feature.$short_name.md"

    if [[ -f "$command_file" ]]; then
      echo "- **$feature** [$has_context] → /feature.$short_name"
    else
      echo "- **$feature** [$has_context]"
    fi
  done < <(find_all_features)

  echo ""
  echo "Run '/speckit.context [feature]' to generate/load context"
  exit 0
}

# Match feature by number (e.g., "004")
match_by_number() {
  local number="$1"
  local padded=$(printf "%03d" "$number" 2>/dev/null || echo "$number")

  while IFS= read -r feature; do
    if [[ "$feature" == "$padded"-* ]]; then
      echo "$feature"
      return 0
    fi
  done < <(find_all_features)

  return 1
}

# Match feature by keyword (fuzzy match)
match_by_keyword() {
  local keyword=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  local matches=()

  while IFS= read -r feature; do
    local feature_lower=$(echo "$feature" | tr '[:upper:]' '[:lower:]')
    if [[ "$feature_lower" == *"$keyword"* ]]; then
      matches+=("$feature")
    fi
  done < <(find_all_features)

  if [[ ${#matches[@]} -eq 0 ]]; then
    return 1
  elif [[ ${#matches[@]} -eq 1 ]]; then
    echo "${matches[0]}"
    return 0
  else
    echo "Error: Multiple features match '$1':" >&2
    for match in "${matches[@]}"; do
      echo "  - $match" >&2
    done
    echo "Please be more specific." >&2
    exit 1
  fi
}

# Match feature by exact directory name
match_exact() {
  local name="$1"

  if [[ -d "$SPECS_DIR/$name" ]]; then
    echo "$name"
    return 0
  fi

  return 1
}

# Main logic
main() {
  # Handle --list flag
  if [[ "$ARGS" == "--list" ]]; then
    list_features
  fi

  # Handle empty/auto-detect
  if [[ -z "$ARGS" ]]; then
    auto_detect_feature
    return 0
  fi

  # Try exact match first
  if match_exact "$ARGS"; then
    return 0
  fi

  # Try number match
  if [[ "$ARGS" =~ ^[0-9]+$ ]]; then
    if match_by_number "$ARGS"; then
      return 0
    fi
  fi

  # Try keyword match
  if match_by_keyword "$ARGS"; then
    return 0
  fi

  # No matches found
  echo "Error: Feature not found: '$ARGS'" >&2
  echo "" >&2
  echo "Did you mean one of these?" >&2
  find_all_features | head -n 5 >&2
  echo "" >&2
  echo "Usage:" >&2
  echo "  /speckit.context                  # Auto-detect from branch" >&2
  echo "  /speckit.context 004              # By number" >&2
  echo "  /speckit.context filesystem       # By keyword" >&2
  echo "  /speckit.context 003-filesystem-mvp  # By full name" >&2
  echo "  /speckit.context --list           # List all features" >&2
  exit 1
}

main
