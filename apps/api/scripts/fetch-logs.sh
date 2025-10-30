#!/bin/bash

# Supabase Remote Log Fetcher for Local Development
# Usage: ./scripts/fetch-logs.sh [options]

set -e

# Configuration - Update these with your project details
PROJECT_ID="xennuhfmnucybtyzfgcl"
API_KEY="${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key-here}"
LOG_URL="https://${PROJECT_ID}.supabase.co/functions/v1/logs"

# Default parameters
LIMIT=50
SINCE="5 minutes ago"
FUNCTION=""
LEVEL="error"
FOLLOW=false
FILTER=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --since)
      SINCE="$2"
      shift 2
      ;;
    --function)
      FUNCTION="$2"
      shift 2
      ;;
    --level)
      LEVEL="$2"
      shift 2
      ;;
    --follow)
      FOLLOW=true
      shift
      ;;
    --filter)
      FILTER="$2"
      shift 2
      ;;
    --project-id)
      PROJECT_ID="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --limit N      Number of logs to fetch (default: 50)"
      echo "  --since TIME   Time period (e.g., '5 minutes ago', '1 hour ago')"
      echo "  --function NAME  Filter by function name"
      echo "  --level LEVEL  Filter by log level (error, warn, info, debug)"
      echo "  --follow       Follow logs continuously"
      echo "  --filter TEXT  Filter logs by text content"
      echo "  --project-id ID Supabase project ID"
      echo "  --help         Show this help message"
      echo ""
      echo "Environment Variables:"
      echo "  SUPABASE_SERVICE_ROLE_KEY  Your service role key"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate API key
if [[ "$API_KEY" == "your-service-role-key-here" ]]; then
  echo "❌ Error: Please set SUPABASE_SERVICE_ROLE_KEY environment variable"
  echo "or update the API_KEY variable in this script"
  exit 1
fi

# Build query parameters
QUERY_PARAMS="limit=$LIMIT"
if [[ -n "$SINCE" ]]; then
  # Convert relative time to ISO timestamp
  SINCE_ISO=$(date -u -d "$SINCE" +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -v-${SINCE} +%Y-%m-%dT%H:%M:%S 2>/dev/null)
  QUERY_PARAMS="$QUERY_PARAMS&since=$SINCE_ISO"
fi
if [[ -n "$FUNCTION" ]]; then
  QUERY_PARAMS="$QUERY_PARAMS&function=$FUNCTION"
fi
if [[ -n "$LEVEL" ]]; then
  QUERY_PARAMS="$QUERY_PARAMS&level=$LEVEL"
fi

# Function to fetch and display logs
fetch_logs() {
  echo "📊 Fetching logs from Supabase..."
  echo "🔗 Project: $PROJECT_ID"
  echo "⏰ Since: $SINCE ($(date -d "$SINCE" 2>/dev/null || echo 'Unknown'))"
  echo "🔍 Filters: function=$FUNCTION, level=$LEVEL"
  echo ""

  # Make API request
  RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    "$LOG_URL?$QUERY_PARAMS")

  HTTP_CODE="${RESPONSE: -3}"
  BODY="${RESPONSE%???}"

  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "❌ Error fetching logs (HTTP $HTTP_CODE)"
    if [[ -n "$BODY" ]]; then
      echo "Response: $BODY"
    fi
    return 1
  fi

  # Parse and display logs
  echo "$BODY" | jq -r '
    if .logs and (.logs | length) > 0 then
      .logs[] |
      "\(.created_at | strftime("%Y-%m-%d %H:%M:%S")) [\(.level | ascii_upcase)] \(.function_name // "unknown")" +
      if .context and .context.requestId then
        " [req:\(.context.requestId)]"
      else "" end +
      ": \(.message)" +
      if .duration then
        " (\(.duration)ms)"
      else "" end
    else
      "No logs found matching the criteria"
    end
  ' | while IFS= read -r line; do
    # Apply text filter if specified
    if [[ -z "$FILTER" ]] || [[ "$line" == *"$FILTER"* ]]; then
      # Color code based on log level
      if [[ "$line" == *"[ERROR]"* ]]; then
        echo -e "\033[31m$line\033[0m"  # Red
      elif [[ "$line" == *"[WARN]"* ]]; then
        echo -e "\033[33m$line\033[0m"  # Yellow
      elif [[ "$line" == *"[INFO]"* ]]; then
        echo -e "\033[32m$line\033[0m"  # Green
      else
        echo "$line"  # Default color
      fi
    fi
  done

  echo ""
  echo "---"
}

# Main execution
if [[ "$FOLLOW" == "true" ]]; then
  echo "🔄 Following logs... (Press Ctrl+C to stop)"
  while true; do
    fetch_logs
    sleep 10
  done
else
  fetch_logs
fi