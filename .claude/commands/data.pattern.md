# /data.pattern - Load data layer patterns

Load data patterns for context-optimized development.

## Pattern Loading

```bash
PATTERNS=$(.specify/scripts/bash/load-patterns.sh --domain=data --priority=core)

while IFS= read -r pattern; do
  echo "\n=== $(basename "$pattern" .md) ===\n"
  cat "$pattern"
done <<< "$PATTERNS"
```

This command loads core data patterns:
- **data-graphql-schema-design** - 1:1 database-to-GraphQL type mapping
- **data-type-generation** - Drizzle types for backend, GraphQL Codegen for frontend
- **data-rls-policies** - PostgreSQL Row-Level Security for user isolation
- **data-validation-workflow** - Three-layer validation (Zod → GraphQL → DB constraints)
- **data-database-schema** - Drizzle ORM with MVP-first approach

**When to use**: Working on database schema, types, validation, or GraphQL schema design.

**Context savings**: Loads only data patterns (~12K tokens) instead of full CLAUDE.md (13K tokens).
