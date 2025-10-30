---
description: Debug unexpected failures with phased diagnosis, fix, and documentation sync
---

## User Input

```text
$ARGUMENTS
```

---

## Workflow

### Phase 1: Diagnose & Isolate

**Get feature context**:
```bash
cd /Users/daniel/Projects/misc/centrid
FEATURE_DIR=$(git rev-parse --show-toplevel)/specs/004-ai-agent-system
```

**Triage the issue**:
- Parse user input for failure type: endpoint, UI, flow, or config
- Load relevant technical docs for context
- Identify the specific broken component

**Debugging workflow**:
```bash
# Endpoint failures: Check logs, test API directly, verify Edge Function
# UI issues: Inspect components, check props, verify data flow
# Flow problems: Trace data path, validate integration points
# Config issues: Check environment, verify connections
```

**Diagnosis output**:
```
🔍 Issue: [type] - [specific component]
🎯 Root cause: [concise explanation]
📋 Fix type: [endpoint|ui|flow|config]
📊 Impact: [which artifacts need updating]
```

**User confirmation**: Continue to fix implementation? [Y/n]

---

### Phase 2: Fix Implementation

**Plan the fix**:
- Identify exact code changes needed
- Check for potential side effects
- Prepare implementation approach

**Implement fix**:
- Apply minimal code changes
- Test the fix locally
- Verify no regression issues

**Fix verification**:
```
✅ Fix implemented: [what was changed]
✅ Issue resolved: [verification method]
✅ No regressions: [what was checked]
```

**User confirmation**: Continue to documentation sync? [Y/n]

---

### Phase 3: Documentation Sync

**Assess documentation impact**:
```markdown
| Fix Type | spec.md | arch.md | ux.md | plan.md | design.md | tasks.md |
|----------|---------|---------|-------|---------|-----------|----------|
| Endpoint | ❌ | ⚠️ | ❌ | ✅ | ❌ | ⚠️ |
| UI       | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| Flow     | ❌ | ✅ | ⚠️ | ✅ | ❌ | ⚠️ |
| Config   | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
```

**Update affected artifacts**:
- Load current artifact content
- Apply targeted updates reflecting the fix
- Maintain abstraction levels (no implementation details in spec.md)

**Validation**:
- Cross-reference updated docs
- Verify consistency across artifacts
- Confirm docs match implementation reality

**Documentation output**:
```
📝 Updated artifacts: [list of changed files]
✅ Cross-artifact consistency verified
🎯 Documentation synced with implementation
```

---

## Summary

**Phase 1**: Diagnosed [issue] → [root cause]
**Phase 2**: Implemented [fix type] → verified working
**Phase 3**: Updated [N] artifacts → consistency verified

**Status**: Ready for testing with `/speckit.test`

---

## Key Rules

- **Diagnose first**: Never implement without understanding root cause
- **Minimal fix**: Change only what's necessary to resolve issue
- **Documentation sync**: Always update docs to match implementation reality
- **Validation gates**: Require user confirmation between phases
- **Targeted updates**: Only update artifacts actually impacted by the fix