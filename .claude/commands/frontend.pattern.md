# /frontend.pattern - Load frontend-specific patterns

Load frontend patterns for context-optimized development.

## Pattern Loading

```bash
PATTERNS=$(.specify/scripts/bash/load-patterns.sh --domain=frontend --priority=core)

while IFS= read -r pattern; do
  echo "\n=== $(basename "$pattern" .md) ===\n"
  cat "$pattern"
done <<< "$PATTERNS"
```

This command loads core frontend patterns:
- **frontend-graphql-client** - urql client with custom hooks for type-safe queries
- **frontend-state-management** - Valtio proxy-based state with optimistic updates
- **frontend-token-store** - Synchronous token cache for API calls
- **frontend-monorepo-structure** - Turborepo workspace with import boundaries

**When to use**: Working on frontend features (UI, components, state management, GraphQL queries).

**Context savings**: Loads only frontend patterns (~8K tokens) instead of full CLAUDE.md (13K tokens).
