#!/bin/bash

# Script to add shadcn components to packages/ui
# Usage: ./scripts/add-component.sh <component-name>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/add-component.sh <component-name>"
  echo "Example: ./scripts/add-component.sh avatar"
  exit 1
fi

COMPONENT=$1
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
DESIGN_SYSTEM_DIR="$ROOT_DIR/apps/design-system"
UI_PKG_DIR="$ROOT_DIR/packages/ui"

echo "📦 Adding component: $COMPONENT"
echo ""

# Step 1: Add component to design-system app
echo "Step 1: Adding component to design-system app..."
cd "$DESIGN_SYSTEM_DIR"
npx shadcn@latest add "$COMPONENT" --yes

# Step 2: Move component files to packages/ui
echo ""
echo "Step 2: Moving component files to packages/ui..."

if [ -d "$DESIGN_SYSTEM_DIR/components/ui" ]; then
  for file in "$DESIGN_SYSTEM_DIR/components/ui"/*; do
    filename=$(basename "$file")

    # Skip if file already exists in packages/ui
    if [ -f "$UI_PKG_DIR/src/components/$filename" ]; then
      echo "⚠️  Skipping $filename (already exists in packages/ui)"
      continue
    fi

    echo "✓ Moving $filename to packages/ui"
    mv "$file" "$UI_PKG_DIR/src/components/"
  done

  # Clean up empty directories
  rm -rf "$DESIGN_SYSTEM_DIR/components/ui"
  if [ -d "$DESIGN_SYSTEM_DIR/components" ] && [ -z "$(ls -A "$DESIGN_SYSTEM_DIR/components" 2>/dev/null | grep -v ExampleLoginScreen)" ]; then
    # Only remove if empty or only contains ExampleLoginScreen
    true
  fi
fi

# Step 3: Fix imports in moved files
echo ""
echo "Step 3: Fixing imports..."
cd "$UI_PKG_DIR/src/components"

for file in *.tsx; do
  if [ -f "$file" ]; then
    # Replace @/ with relative paths
    sed -i '' 's|from "@/components/|from "./|g' "$file"
    sed -i '' 's|from "@/lib/|from "../lib/|g' "$file"
    sed -i '' 's|from "@/hooks/|from "../hooks/|g' "$file"
  fi
done

echo ""
echo "✅ Component '$COMPONENT' added successfully!"
echo ""
echo "Next steps:"
echo "1. Add exports to packages/ui/src/components/index.ts"
echo "2. Test the component in the design-system app"
echo "3. Run: npm run design:dev"
