#!/usr/bin/env bash
# load-patterns.sh - Filter and load pattern files by metadata
# Usage: load-patterns.sh [--domain=frontend,backend] [--priority=core] [--related=graphql] [--all]

set -euo pipefail

# Get script directory (resolve symlinks)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/.specify/docs"

# Parse arguments
FILTER_DOMAINS=()
FILTER_PRIORITY=""
FILTER_RELATED=""
LOAD_ALL=false

for arg in "$@"; do
  case $arg in
    --domain=*)
      IFS=',' read -ra FILTER_DOMAINS <<< "${arg#*=}"
      ;;
    --priority=*)
      FILTER_PRIORITY="${arg#*=}"
      ;;
    --related=*)
      FILTER_RELATED="${arg#*=}"
      ;;
    --all)
      LOAD_ALL=true
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: load-patterns.sh [--domain=frontend,backend] [--priority=core] [--related=graphql] [--all]" >&2
      exit 1
      ;;
  esac
done

# Function to extract YAML frontmatter field
extract_field() {
  local file="$1"
  local field="$2"

  # Extract value between --- markers, find the field line
  awk -v field="$field" '
    BEGIN { in_frontmatter=0; found=0 }
    /^---$/ {
      if (in_frontmatter == 0) in_frontmatter=1
      else if (in_frontmatter == 1) exit
      next
    }
    in_frontmatter == 1 && $1 == field":" {
      # Remove field name and colon, trim whitespace
      sub(field":", "")
      gsub(/^[ \t]+|[ \t]+$/, "")
      print
      found=1
      exit
    }
  ' "$file"
}

# Function to check if value is in array string (e.g., "[foo, bar, baz]")
contains_value() {
  local haystack="$1"
  local needle="$2"

  # Remove brackets and split by comma
  haystack="${haystack#\[}"
  haystack="${haystack%\]}"

  # Check if needle appears as whole word in comma-separated list
  echo "$haystack" | grep -qE "(^|,| )$needle(,| |$)"
}

# Filter patterns
matching_patterns=()

for pattern_file in "$DOCS_DIR"/*.md; do
  # Skip template and non-existent files
  [[ ! -f "$pattern_file" ]] && continue
  [[ "$(basename "$pattern_file")" == "_template.md" ]] && continue

  # If --all flag, include everything
  if [[ "$LOAD_ALL" == true ]]; then
    matching_patterns+=("$pattern_file")
    continue
  fi

  # Extract metadata
  domain=$(extract_field "$pattern_file" "domain")
  priority=$(extract_field "$pattern_file" "priority")
  related=$(extract_field "$pattern_file" "related")

  # Apply filters
  passes_filter=true

  # Domain filter
  if [[ ${#FILTER_DOMAINS[@]} -gt 0 ]]; then
    domain_match=false
    for filter_domain in "${FILTER_DOMAINS[@]}"; do
      if [[ "$domain" == "$filter_domain" ]]; then
        domain_match=true
        break
      fi
    done
    [[ "$domain_match" == false ]] && passes_filter=false
  fi

  # Priority filter
  if [[ -n "$FILTER_PRIORITY" && "$priority" != "$FILTER_PRIORITY" ]]; then
    passes_filter=false
  fi

  # Related filter
  if [[ -n "$FILTER_RELATED" ]]; then
    if ! contains_value "$related" "$FILTER_PRIORITY"; then
      passes_filter=false
    fi
  fi

  # Add if passes all filters
  if [[ "$passes_filter" == true ]]; then
    matching_patterns+=("$pattern_file")
  fi
done

# Output matching pattern paths (one per line)
if [[ ${#matching_patterns[@]} -eq 0 ]]; then
  echo "# No patterns match the specified filters" >&2
  exit 0
fi

printf '%s\n' "${matching_patterns[@]}"
