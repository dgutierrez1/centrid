# /backend.pattern - Load backend-specific patterns

Load backend patterns for context-optimized development.

## Pattern Loading

```bash
PATTERNS=$(.specify/scripts/bash/load-patterns.sh --domain=backend --priority=core)

while IFS= read -r pattern; do
  echo "\n=== $(basename "$pattern" .md) ===\n"
  cat "$pattern"
done <<< "$PATTERNS"
```

This command loads core backend patterns:
- **backend-graphql-architecture** - Pothos with four-layer separation (Resolvers → Controllers → Services → Repositories)
- **backend-edge-functions** - Deploy-to-remote workflow for Edge Functions
- **backend-remote-first-development** - Remote Supabase as default development target
- **backend-remote-debugging-tools** - Database query and log tools

**When to use**: Working on backend features (services, repositories, Edge Functions, GraphQL resolvers).

**Context savings**: Loads only backend patterns (~10K tokens) instead of full CLAUDE.md (13K tokens).
