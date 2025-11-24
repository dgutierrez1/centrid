#!/usr/bin/env bash

# discover-code-state.sh - Discover actual code state for a feature
# Usage: discover-code-state.sh <feature-dir>
# Output: JSON with discovered code state

set -euo pipefail

FEATURE_DIR="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

if [[ -z "$FEATURE_DIR" ]]; then
  echo "Error: Feature directory required" >&2
  echo "Usage: discover-code-state.sh <feature-dir>" >&2
  exit 1
fi

# Extract feature keywords from directory name
# e.g., "003-filesystem-markdown-editor" → "filesystem", "markdown", "editor"
extract_keywords() {
  local dir="$1"
  # Remove number prefix, split on hyphens, convert to lowercase
  echo "$dir" | sed 's/^[0-9]*-//' | tr '-' '\n' | tr '[:upper:]' '[:lower:]'
}

# Find files matching pattern in specific directory
find_files_in_dir() {
  local base_dir="$1"
  local name_pattern="$2"

  if [[ ! -d "$base_dir" ]]; then
    return
  fi

  find "$base_dir" -name "$name_pattern" -type f 2>/dev/null | sort || true
}

# Extract feature name variations
FEATURE_NAME=$(echo "$FEATURE_DIR" | sed 's/^[0-9]*-//')
KEYWORDS=($(extract_keywords "$FEATURE_DIR"))

# Initialize JSON structure
# Frontend
COMPONENTS=()
HOOKS=()
STATE_FILES=()
CONTEXTS=()
VALIDATORS=()
UTILS=()
CONSTANTS=()
FE_TYPES=()

# Backend
GRAPHQL_TYPES=()
SERVICES=()
REPOSITORIES=()
CONTROLLERS=()
EDGE_FUNCTIONS=()
DB_TABLES=()

# Shared
UI_COMPONENTS=()
UI_TYPES=()

# Step 1: Find frontend files
echo "# Discovering frontend files..." >&2

# Define base directories - Frontend
COMPONENTS_DIR="$PROJECT_ROOT/apps/web/src/components"
HOOKS_DIR="$PROJECT_ROOT/apps/web/src/lib/hooks"
STATE_DIR="$PROJECT_ROOT/apps/web/src/lib/state"
CONTEXTS_DIR="$PROJECT_ROOT/apps/web/src/lib/contexts"
VALIDATORS_DIR="$PROJECT_ROOT/apps/web/src/lib/validations"
UTILS_DIR="$PROJECT_ROOT/apps/web/src/lib/utils"
HELPERS_DIR="$PROJECT_ROOT/apps/web/src/lib/helpers"
CONSTANTS_DIR="$PROJECT_ROOT/apps/web/src/lib/constants"
FE_TYPES_DIR="$PROJECT_ROOT/apps/web/src/types"

# Find components (search by keywords)
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && COMPONENTS+=("$file")
  done < <(find_files_in_dir "$COMPONENTS_DIR" "*${keyword}*.tsx")
done

# Find UI package components (before hooks, so we can extract imports)
echo "# Discovering UI package files..." >&2

# Define UI package directories
UI_COMPONENTS_DIR_TMP="$PROJECT_ROOT/packages/ui/src/components"
UI_FEATURES_DIR_TMP="$PROJECT_ROOT/packages/ui/src/features"

# Find UI components
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && UI_COMPONENTS+=("$file")
  done < <(find_files_in_dir "$UI_COMPONENTS_DIR_TMP" "*${keyword}*.tsx")

  # Also check features directory
  if [[ -d "$UI_FEATURES_DIR_TMP" ]]; then
    while IFS= read -r dir; do
      if [[ -n "$dir" ]]; then
        while IFS= read -r file; do
          [[ -n "$file" ]] && UI_COMPONENTS+=("$file")
        done < <(find "$dir" -name "*.tsx" -type f 2>/dev/null | sort)
      fi
    done < <(find "$UI_FEATURES_DIR_TMP" -type d -name "*${keyword}*" 2>/dev/null)
  fi
done

# Find hooks (import-based discovery from components and UI package)
# Extract hook imports from component files
extract_hook_imports() {
  local file="$1"
  # Match patterns: from '@/lib/hooks/useXxx' or from "@/lib/hooks/useXxx"
  grep -oE "from ['\"]@/lib/hooks/[^'\"]+['\"]" "$file" 2>/dev/null | \
    sed -E "s/.*from ['\"]@\/lib\/hooks\/([^'\"]+)['\"].*/\1/" || true
}

# Collect all component files to scan (apps/web components + UI package)
ALL_COMPONENT_FILES=()
if [[ ${#COMPONENTS[@]} -gt 0 ]]; then
  ALL_COMPONENT_FILES+=("${COMPONENTS[@]}")
fi
if [[ ${#UI_COMPONENTS[@]} -gt 0 ]]; then
  ALL_COMPONENT_FILES+=("${UI_COMPONENTS[@]}")
fi

# Extract hook imports from all components
HOOK_IMPORTS=()
if [[ ${#ALL_COMPONENT_FILES[@]} -gt 0 ]]; then
  for comp_file in "${ALL_COMPONENT_FILES[@]}"; do
    # Check if path is absolute or relative
    if [[ "$comp_file" == /* ]]; then
      file_path="$comp_file"
    else
      file_path="$PROJECT_ROOT/$comp_file"
    fi

    if [[ -f "$file_path" ]]; then
      while IFS= read -r hook_name; do
        if [[ -n "$hook_name" ]]; then
          # Add .ts extension if not present
          if [[ ! "$hook_name" =~ \.ts$ ]]; then
            hook_name="${hook_name}.ts"
          fi
          HOOK_IMPORTS+=("$hook_name")
        fi
      done < <(extract_hook_imports "$file_path")
    fi
  done
fi

# Find those hook files
if [[ ${#HOOK_IMPORTS[@]} -gt 0 ]]; then
  for hook_file in "${HOOK_IMPORTS[@]}"; do
    hook_path="$HOOKS_DIR/$hook_file"
    if [[ -f "$hook_path" ]]; then
      HOOKS+=("$hook_path")
    fi
  done
fi

# Find state files
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && STATE_FILES+=("$file")
  done < <(find_files_in_dir "$STATE_DIR" "*${keyword}*.ts")
done

# Find contexts
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && CONTEXTS+=("$file")
  done < <(find_files_in_dir "$CONTEXTS_DIR" "*${keyword}*.tsx")
done

# Find validators
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && VALIDATORS+=("$file")
  done < <(find_files_in_dir "$VALIDATORS_DIR" "*${keyword}*.ts")
done

# Find utils and helpers
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && UTILS+=("$file")
  done < <(find_files_in_dir "$UTILS_DIR" "*${keyword}*.ts")

  while IFS= read -r file; do
    [[ -n "$file" ]] && UTILS+=("$file")
  done < <(find_files_in_dir "$HELPERS_DIR" "*${keyword}*.ts")
done

# Find constants
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && CONSTANTS+=("$file")
  done < <(find_files_in_dir "$CONSTANTS_DIR" "*${keyword}*.ts")
done

# Find type files
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && FE_TYPES+=("$file")
  done < <(find_files_in_dir "$FE_TYPES_DIR" "*${keyword}*.ts")
done

# Step 2: Find backend files
echo "# Discovering backend files..." >&2

# Define backend base directories
GRAPHQL_TYPES_DIR="$PROJECT_ROOT/apps/api/src/graphql/types"
CONTROLLERS_DIR="$PROJECT_ROOT/apps/api/src/graphql/controllers"
SERVICES_DIR="$PROJECT_ROOT/apps/api/src/services"
REPOSITORIES_DIR="$PROJECT_ROOT/apps/api/src/repositories"
EDGE_FUNCTIONS_DIR="$PROJECT_ROOT/apps/api/src/functions"
DB_SCHEMA_FILE="$PROJECT_ROOT/apps/api/src/db/schema.ts"

# Find GraphQL types
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && GRAPHQL_TYPES+=("$file")
  done < <(find_files_in_dir "$GRAPHQL_TYPES_DIR" "*${keyword}*.ts")
done

# Find services
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && SERVICES+=("$file")
  done < <(find_files_in_dir "$SERVICES_DIR" "*${keyword}*.ts")
done

# Find controllers
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && CONTROLLERS+=("$file")
  done < <(find_files_in_dir "$CONTROLLERS_DIR" "*${keyword}*.ts")
done

# Find repositories
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && REPOSITORIES+=("$file")
  done < <(find_files_in_dir "$REPOSITORIES_DIR" "*${keyword}*.ts")
done

# Find edge functions (directory-based)
for keyword in "${KEYWORDS[@]}"; do
  if [[ -d "$EDGE_FUNCTIONS_DIR" ]]; then
    while IFS= read -r dir; do
      if [[ -n "$dir" ]]; then
        while IFS= read -r file; do
          [[ -n "$file" ]] && EDGE_FUNCTIONS+=("$file")
        done < <(find "$dir" -name "*.ts" -type f 2>/dev/null | sort)
      fi
    done < <(find "$EDGE_FUNCTIONS_DIR" -type d -name "*${keyword}*" 2>/dev/null)
  fi
done

# Find database tables in schema
if [[ -f "$DB_SCHEMA_FILE" ]]; then
  for keyword in "${KEYWORDS[@]}"; do
    while IFS= read -r table; do
      [[ -n "$table" ]] && DB_TABLES+=("$table")
    done < <(grep -oE "export const ${keyword}[a-zA-Z0-9_]* = (pgTable|mysqlTable)" "$DB_SCHEMA_FILE" | sed -E 's/export const ([a-zA-Z0-9_]*) =.*/\1/' || true)
  done
fi

# Step 3: Find UI package types
echo "# Discovering UI package types..." >&2

# Define UI package types directory
UI_TYPES_DIR="$PROJECT_ROOT/packages/ui/src/types"

# Find UI types
for keyword in "${KEYWORDS[@]}"; do
  while IFS= read -r file; do
    [[ -n "$file" ]] && UI_TYPES+=("$file")
  done < <(find_files_in_dir "$UI_TYPES_DIR" "*${keyword}*.ts")
done

# Convert to relative paths and remove duplicates
convert_to_relative() {
  local arr_name=$1
  # Check if array has elements
  eval "local arr_len=\${#${arr_name}[@]}"

  if [[ $arr_len -eq 0 ]]; then
    return
  fi

  eval "local arr_copy=(\"\${${arr_name}[@]}\")"
  local unique=()
  local unique_str=" "

  for file in "${arr_copy[@]}"; do
    local rel_path="${file#$PROJECT_ROOT/}"
    if [[ ! "$unique_str" =~ " $rel_path " ]]; then
      unique+=("$rel_path")
      unique_str="$unique_str$rel_path "
    fi
  done

  eval "${arr_name}=(\"\${unique[@]}\")"
}

convert_to_relative COMPONENTS
convert_to_relative HOOKS
convert_to_relative STATE_FILES
convert_to_relative CONTEXTS
convert_to_relative VALIDATORS
convert_to_relative UTILS
convert_to_relative CONSTANTS
convert_to_relative FE_TYPES
convert_to_relative GRAPHQL_TYPES
convert_to_relative SERVICES
convert_to_relative CONTROLLERS
convert_to_relative REPOSITORIES
convert_to_relative EDGE_FUNCTIONS
convert_to_relative UI_COMPONENTS
convert_to_relative UI_TYPES

# Step 4: Extract GraphQL operations from hooks
echo "# Extracting GraphQL operations..." >&2

GRAPHQL_MUTATIONS=()
GRAPHQL_QUERIES=()

if [[ ${#HOOKS[@]} -gt 0 ]]; then
  for hook_file in "${HOOKS[@]}"; do
    if [[ -f "$PROJECT_ROOT/$hook_file" ]]; then
      # Extract mutations (pattern: useGraphQLMutation(SomeDocument) or useGraphQLMutation<Type>(SomeDocument))
      while IFS= read -r mutation; do
        [[ -n "$mutation" ]] && GRAPHQL_MUTATIONS+=("$mutation")
      done < <(grep -oE 'useGraphQLMutation(<[^>]+>)?\(([A-Z][a-zA-Z0-9]+Document)\)' "$PROJECT_ROOT/$hook_file" | sed -E 's/.*\(([A-Z][a-zA-Z0-9]+Document)\)/\1/' || true)

      # Extract queries (pattern: useGraphQLQuery(SomeDocument) or useGraphQLQuery<Type>(SomeDocument))
      while IFS= read -r query; do
        [[ -n "$query" ]] && GRAPHQL_QUERIES+=("$query")
      done < <(grep -oE 'useGraphQLQuery(<[^>]+>)?\(([A-Z][a-zA-Z0-9]+Document)\)' "$PROJECT_ROOT/$hook_file" | sed -E 's/.*\(([A-Z][a-zA-Z0-9]+Document)\)/\1/' || true)
    fi
  done
fi

# Remove duplicates from GraphQL operations
if [[ ${#GRAPHQL_MUTATIONS[@]} -gt 0 ]]; then
  GRAPHQL_MUTATIONS=($(printf '%s\n' "${GRAPHQL_MUTATIONS[@]}" | sort -u))
fi

if [[ ${#GRAPHQL_QUERIES[@]} -gt 0 ]]; then
  GRAPHQL_QUERIES=($(printf '%s\n' "${GRAPHQL_QUERIES[@]}" | sort -u))
fi

# Step 4: Discover state architecture
echo "# Discovering state architecture..." >&2

STATE_STORES=()
if [[ ${#STATE_FILES[@]} -gt 0 ]]; then
  for state_file in "${STATE_FILES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$state_file" ]]; then
      # Extract proxy export name (pattern: export const xxxState = proxy({...}))
      store_name=$(grep -oE 'export const [a-zA-Z0-9]+State = (proxy|proxyWithComputed)' "$PROJECT_ROOT/$state_file" | sed -E 's/export const ([a-zA-Z0-9]+State) =.*/\1/' || true)

      if [[ -n "$store_name" ]]; then
        file_basename=$(basename "$state_file")
        STATE_STORES+=("{\"name\": \"$store_name\", \"file\": \"$file_basename\"}")
      fi
    fi
  done
fi

# Step 5: Trace code flows (basic)
echo "# Tracing code flows..." >&2

CODE_FLOWS=()

# Find main container component
MAIN_CONTAINER=""
if [[ ${#COMPONENTS[@]} -gt 0 ]]; then
  for comp in "${COMPONENTS[@]}"; do
    if [[ "$comp" == *"Container"* ]] || [[ "$comp" == *"Workspace"* ]]; then
      MAIN_CONTAINER="$comp"
      break
    fi
  done
fi

if [[ -n "$MAIN_CONTAINER" ]] && [[ -f "$PROJECT_ROOT/$MAIN_CONTAINER" ]]; then
  # Extract event handlers (pattern: handleXxx or onXxx)
  handlers=$(grep -oE '(handle|on)[A-Z][a-zA-Z0-9]+\s*[=(]' "$PROJECT_ROOT/$MAIN_CONTAINER" | sed -E 's/\s*[=(].*//' | sort -u || true)

  if [[ -n "$handlers" ]]; then
    while IFS= read -r handler; do
      [[ -n "$handler" ]] && CODE_FLOWS+=("{\"entry\": \"$(basename "$MAIN_CONTAINER")\", \"handler\": \"$handler\"}")
    done <<< "$handlers"
  fi
fi

# Step 6: Extract function signatures
echo "# Extracting function signatures..." >&2

HOOK_SIGNATURES=()
if [[ ${#HOOKS[@]} -gt 0 ]]; then
  for hook in "${HOOKS[@]}"; do
    if [[ -f "$PROJECT_ROOT/$hook" ]]; then
      # Extract function signature with line number
      while IFS=: read -r line_num signature; do
        if [[ -n "$line_num" ]] && [[ -n "$signature" ]]; then
          # Clean up signature (remove opening brace and trim whitespace)
          signature=$(echo "$signature" | sed 's/{.*//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
          file_basename=$(basename "$hook")
          # Escape quotes for JSON
          signature_escaped=$(echo "$signature" | sed 's/"/\\"/g')
          HOOK_SIGNATURES+=("{\"file\": \"$file_basename\", \"line\": $line_num, \"signature\": \"$signature_escaped\"}")
        fi
      done < <(grep -n "^export function" "$PROJECT_ROOT/$hook" 2>/dev/null || true)
    fi
  done
fi

SERVICE_SIGNATURES=()
if [[ ${#SERVICES[@]} -gt 0 ]]; then
  for service in "${SERVICES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$service" ]]; then
      while IFS=: read -r line_num signature; do
        if [[ -n "$line_num" ]] && [[ -n "$signature" ]]; then
          signature=$(echo "$signature" | sed 's/{.*//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
          file_basename=$(basename "$service")
          signature_escaped=$(echo "$signature" | sed 's/"/\\"/g')
          SERVICE_SIGNATURES+=("{\"file\": \"$file_basename\", \"line\": $line_num, \"signature\": \"$signature_escaped\"}")
        fi
      done < <(grep -n "static async\|static [a-zA-Z]" "$PROJECT_ROOT/$service" 2>/dev/null | grep -v "//" || true)
    fi
  done
fi

# Step 7: Extract dependencies
echo "# Extracting dependencies..." >&2

# Initialize dependencies object as associative array (bash 4+)
declare -A DEPENDENCIES_MAP

if [[ ${#HOOKS[@]} -gt 0 ]]; then
  for hook in "${HOOKS[@]}"; do
    if [[ -f "$PROJECT_ROOT/$hook" ]]; then
      # Extract local imports (@ or relative ./)
      deps=$(grep "^import.*from ['\"][@./]" "$PROJECT_ROOT/$hook" 2>/dev/null | \
        sed "s/.*from //" | sed "s/['\"];//" | sed "s/['\"]$//" | tr '\n' ',' | sed 's/,$//' || true)

      if [[ -n "$deps" ]]; then
        # Split deps by comma and create JSON array
        IFS=',' read -ra dep_array <<< "$deps"
        dep_json=""
        for dep in "${dep_array[@]}"; do
          dep=$(echo "$dep" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
          dep_escaped=$(echo "$dep" | sed 's/"/\\"/g')
          if [[ -n "$dep_json" ]]; then
            dep_json="$dep_json, \"$dep_escaped\""
          else
            dep_json="\"$dep_escaped\""
          fi
        done
        DEPENDENCIES_MAP["$hook"]="[$dep_json]"
      fi
    fi
  done
fi

# Step 8: Trace data flows (enhanced)
echo "# Tracing data flows..." >&2

DATA_FLOWS=()

# Trace hook → GraphQL operations
if [[ ${#HOOKS[@]} -gt 0 ]]; then
  for hook in "${HOOKS[@]}"; do
    if [[ -f "$PROJECT_ROOT/$hook" ]]; then
      hook_basename=$(basename "$hook" .ts)

      # Find GraphQL client calls
      while IFS= read -r call; do
        if [[ -n "$call" ]]; then
          call_escaped=$(echo "$call" | sed 's/"/\\"/g')
          DATA_FLOWS+=("{\"entry\": \"$hook_basename\", \"calls\": \"$call_escaped\", \"type\": \"graphql\"}")
        fi
      done < <(grep -oE 'graphqlClient\.(mutation|query)\([A-Z][a-zA-Z0-9]+Document\)' "$PROJECT_ROOT/$hook" 2>/dev/null || true)

      # Find service calls
      while IFS= read -r call; do
        if [[ -n "$call" ]]; then
          call_escaped=$(echo "$call" | sed 's/"/\\"/g')
          DATA_FLOWS+=("{\"entry\": \"$hook_basename\", \"calls\": \"$call_escaped\", \"type\": \"service\"}")
        fi
      done < <(grep -oE '[a-zA-Z]+Service\.[a-zA-Z]+\(' "$PROJECT_ROOT/$hook" 2>/dev/null | sed 's/(//' || true)
    fi
  done
fi

# Trace service → repository calls
if [[ ${#SERVICES[@]} -gt 0 ]]; then
  for service in "${SERVICES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$service" ]]; then
      service_basename=$(basename "$service" .ts)

      # Find repository calls
      while IFS= read -r call; do
        if [[ -n "$call" ]]; then
          call_escaped=$(echo "$call" | sed 's/"/\\"/g')
          DATA_FLOWS+=("{\"entry\": \"$service_basename\", \"calls\": \"$call_escaped\", \"type\": \"repository\"}")
        fi
      done < <(grep -oE '[a-zA-Z]+Repository\.[a-zA-Z]+\(' "$PROJECT_ROOT/$service" 2>/dev/null | sed 's/(//' || true)
    fi
  done
fi

# Helper function to convert bash array to JSON array
array_to_json() {
  local arr_name=$1
  eval "local arr_len=\${#${arr_name}[@]}"

  if [[ $arr_len -eq 0 ]]; then
    echo "[]"
  else
    eval "printf '%s\\n' \"\${${arr_name}[@]}\"" | jq -R . | jq -s .
  fi
}

# Output JSON (grouped by architectural concern)
cat <<EOF
{
  "discovered_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "feature": "$FEATURE_DIR",
  "layers": {
    "ui": {
      "components": $(array_to_json COMPONENTS),
      "ui_package": $(array_to_json UI_COMPONENTS)
    },
    "state_management": {
      "hooks": $(array_to_json HOOKS),
      "state_stores": [$(if [[ ${#STATE_STORES[@]} -gt 0 ]]; then IFS=,; echo "${STATE_STORES[*]}"; fi)],
      "contexts": $(array_to_json CONTEXTS)
    },
    "frontend_utilities": {
      "validators": $(array_to_json VALIDATORS),
      "utils": $(array_to_json UTILS),
      "constants": $(array_to_json CONSTANTS),
      "types": $(array_to_json FE_TYPES)
    },
    "api_layer": {
      "graphql_types": $(array_to_json GRAPHQL_TYPES),
      "controllers": $(array_to_json CONTROLLERS)
    },
    "business_logic": {
      "services": $(array_to_json SERVICES)
    },
    "data_access": {
      "repositories": $(array_to_json REPOSITORIES),
      "edge_functions": $(array_to_json EDGE_FUNCTIONS),
      "db_tables": $(array_to_json DB_TABLES)
    },
    "shared": {
      "ui_types": $(array_to_json UI_TYPES)
    }
  },
  "integrations": {
    "graphql_operations": {
      "mutations": $(array_to_json GRAPHQL_MUTATIONS),
      "queries": $(array_to_json GRAPHQL_QUERIES)
    }
  },
  "signatures": {
    "hooks": [$(if [[ ${#HOOK_SIGNATURES[@]} -gt 0 ]]; then IFS=,; echo "${HOOK_SIGNATURES[*]}"; fi)],
    "services": [$(if [[ ${#SERVICE_SIGNATURES[@]} -gt 0 ]]; then IFS=,; echo "${SERVICE_SIGNATURES[*]}"; fi)]
  },
  "dependencies": {$(
    # Convert associative array to JSON object
    first=true
    for key in "${!DEPENDENCIES_MAP[@]}"; do
      if [[ "$first" == true ]]; then
        first=false
      else
        echo ","
      fi
      key_escaped=$(echo "$key" | sed 's/"/\\"/g')
      echo -n "    \"$key_escaped\": ${DEPENDENCIES_MAP[$key]}"
    done
  )
  },
  "data_flows": [$(if [[ ${#DATA_FLOWS[@]} -gt 0 ]]; then IFS=,; echo "${DATA_FLOWS[*]}"; fi)],
  "code_flows": [$(if [[ ${#CODE_FLOWS[@]} -gt 0 ]]; then IFS=,; echo "${CODE_FLOWS[*]}"; fi)],
  "stats": {
    "total_ui": $((${#COMPONENTS[@]} + ${#UI_COMPONENTS[@]})),
    "total_state_management": $((${#HOOKS[@]} + ${#STATE_FILES[@]} + ${#CONTEXTS[@]})),
    "total_frontend_utilities": $((${#VALIDATORS[@]} + ${#UTILS[@]} + ${#CONSTANTS[@]} + ${#FE_TYPES[@]})),
    "total_api": $((${#GRAPHQL_TYPES[@]} + ${#CONTROLLERS[@]})),
    "total_business_logic": ${#SERVICES[@]},
    "total_data_access": $((${#REPOSITORIES[@]} + ${#EDGE_FUNCTIONS[@]} + ${#DB_TABLES[@]})),
    "total_shared": ${#UI_TYPES[@]},
    "total_files": $((${#COMPONENTS[@]} + ${#HOOKS[@]} + ${#STATE_FILES[@]} + ${#CONTEXTS[@]} + ${#VALIDATORS[@]} + ${#UTILS[@]} + ${#CONSTANTS[@]} + ${#FE_TYPES[@]} + ${#GRAPHQL_TYPES[@]} + ${#SERVICES[@]} + ${#CONTROLLERS[@]} + ${#REPOSITORIES[@]} + ${#EDGE_FUNCTIONS[@]} + ${#DB_TABLES[@]} + ${#UI_COMPONENTS[@]} + ${#UI_TYPES[@]}))
  }
}
EOF
