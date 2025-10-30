# Frontend Architecture Analysis - Document Index

## Overview

Complete analysis of the Centrid frontend architecture focusing on Supabase Edge Function invocation patterns and centralized API approach. Three documents totaling 1,121 lines of detailed analysis.

## Documents

### 1. FRONTEND_ARCHITECTURE_ANALYSIS.md (431 lines)
**Most comprehensive reference for technical details**

Contains:
- Executive summary of two competing patterns
- Current state: 5 files with direct supabase.functions.invoke()
- New architecture: 2 services + 8 hooks using HTTP fetch
- Complete edge function landscape (11 registered functions)
- Detailed service layer architecture breakdown
- All 12 hooks analyzed
- Frontend service layer patterns and issues
- File inventory requiring changes (40-50 files)
- Consolidated routing map
- 5 major abstraction opportunities
- 4-phase consolidation strategy
- Key observations and recommendations

**Best for**: Architects, senior engineers, comprehensive understanding

### 2. FRONTEND_ARCHITECTURE_SUMMARY.md (233 lines)
**Executive summary for decision makers**

Contains:
- Quick facts (93 files, 5 direct calls, 10 service-based)
- Three invocation patterns with code examples
- Five problem areas with code samples
- Abstraction opportunities by priority
- Scope breakdown (5 categories, 40-50 files)
- Recommended 5-phase approach with time estimates
- Benefits after consolidation
- File locations for key examples

**Best for**: Project managers, tech leads, quick understanding

### 3. FRONTEND_CODE_REFERENCE.md (457 lines)
**Detailed code reference and implementation patterns**

Contains:
- Complete file inventory with line counts
- Pages using direct function calls (3 files)
- Service layer files with implementation details
- All 12 hooks documented with patterns
- Key implementation patterns for each
- State management files
- Three HTTP request patterns (with code)
- Edge function endpoints mapped from config.toml
- Duplicated code locations with counts
- Next steps recommendations

**Best for**: Developers, implementers, hands-on reference

## Quick Facts

- **Total Files Analyzed**: 93 TypeScript/TSX files
- **Direct Function Calls**: 5 files
- **Service-Based Calls**: 10 files
- **Files Requiring Changes**: 40-50 files
- **Code Duplication**: 10+ instances across codebase
- **Estimated Refactoring Effort**: 10-15 hours

## Problem Summary

### Pattern Conflicts
1. **5 files** use `supabase.functions.invoke()` (legacy)
2. **10 files** use HTTP `fetch()` with service layer (modern)
3. **5+ files** use direct DB queries (bypasses API)

### Code Duplication
- `getAuthHeaders()` - duplicated 10+ times
- Error handling - 5 different patterns
- HTTP request construction - scattered across files
- Optimistic updates - implemented 3 times
- SSE streaming - implemented 2 times

### Missing Services
- No AuthService (auth operations scattered across pages)
- No ThreadService (thread operations in separate hooks)
- No ConsolidationService (uses legacy invoke pattern)

## Recommended Actions

### Phase 1: Extract Utilities (2-3 hours)
1. Create `lib/api/getAuthHeaders.ts`
2. Create `lib/api/client.ts`
3. Create `lib/api/errors.ts`

### Phase 2: Update Services (2-3 hours)
1. Refactor FilesystemService
2. Refactor AgentFileService
3. Use unified API client

### Phase 3: Create New Services (3-4 hours)
1. AuthService (auth operations)
2. ThreadService (thread operations)
3. ConsolidationService (consolidation)

### Phase 4: Simplify Hooks (3-4 hours)
1. Update 12 existing hooks to use services
2. Extract `useOptimisticUpdate` hook
3. Extract `useServerSentEvents` hook

### Phase 5: Update Pages (1-2 hours)
1. Migrate signup.tsx
2. Migrate profile.tsx
3. Migrate account/delete.tsx

## Key Files to Review

### Working Examples (Good Patterns)
- `apps/web/src/lib/services/filesystem.service.ts` - 425 lines of HTTP service
- `apps/web/src/lib/services/agent-file.service.ts` - HTTP service pattern
- `apps/web/src/lib/hooks/useFilesystemOperations.ts` - Good hook pattern

### Needs Migration
- `apps/web/src/pages/signup.tsx` - Direct invoke() call
- `apps/web/src/pages/profile.tsx` - Direct invoke() call
- `apps/web/src/pages/account/delete.tsx` - Direct invoke() call
- `apps/web/src/lib/hooks/useConsolidation.ts` - Direct invoke() + SSE

### Concerns
- `apps/web/src/lib/hooks/useSendMessage.ts` - Complex SSE streaming (150+ lines)
- `apps/web/src/lib/supabase.ts` - Generic callEdgeFunction wrapper (unused)
- `apps/web/src/lib/utils.ts` - Error handling helpers (inconsistent)

## Reading Guide

**For Time-Constrained Review** (15 minutes):
1. Read FRONTEND_ARCHITECTURE_SUMMARY.md (this gives you the big picture)
2. Review "Problem Summary" section above

**For Implementation Planning** (1 hour):
1. Read FRONTEND_ARCHITECTURE_SUMMARY.md
2. Scan "Quick Facts" and "Recommended Actions" sections
3. Review key files in FRONTEND_CODE_REFERENCE.md

**For Comprehensive Understanding** (2 hours):
1. Read all three documents in order
2. Focus on problem areas and abstraction opportunities
3. Study the service layer patterns in detail

**For Hands-On Implementation** (ongoing):
1. Use FRONTEND_CODE_REFERENCE.md as primary reference
2. Look up specific file locations and patterns
3. Cross-reference with FRONTEND_ARCHITECTURE_ANALYSIS.md for rationale

## Generated By

Analysis performed by Claude Code on October 29, 2025

Methodology:
- Glob pattern matching for file discovery
- Regex pattern searching for function invocations
- File content analysis with Read tool
- Code pattern identification
- Architecture synthesis

All analysis documents ready for team review and implementation planning.
