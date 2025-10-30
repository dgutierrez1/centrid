# Bash Tool Empty Argument Fix

**Date**: 2025-10-28
**Issue**: Commands failing with "ERROR: Unknown option ''"
**Status**: ✅ FIXED

## Problem

When slash commands contained bash code blocks like:

```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```

Claude Code would translate these into Bash tool calls with an **empty string as the description parameter**:

```
Bash(.specify/scripts/bash/check-prerequisites.sh "" --json)
```

The `check-prerequisites.sh` script's argument parser treated this empty string `""` as an unknown option and failed with:

```
ERROR: Unknown option ''. Use --help for usage information.
```

## Root Cause

The issue occurred because:

1. **Bash code blocks** in slash commands were being automatically converted to Bash tool calls by Claude Code
2. When no explicit description was provided, Claude Code inserted an **empty string** as a placeholder
3. The bash script received this empty string as an actual command-line argument
4. The script's argument parser rejected it as invalid

## Solution

Replace bash code blocks with **prose instructions** that explicitly specify the description:

### Before (Broken)
```markdown
**Run prerequisites**:
```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```
```

### After (Fixed)
```markdown
**Run prerequisites from repo root**:

Run `.specify/scripts/bash/check-prerequisites.sh --json` with description "Check feature prerequisites and get paths"
```

## Updated Files

The following slash command files were updated:

### ✅ Fixed
- `.claude/commands/speckit.verify-ui.md`
- `.claude/commands/speckit.verify-tasks.md`
- `.claude/commands/speckit.verify-design.md`
- `.claude/commands/speckit.arch.md`
- `.claude/commands/speckit.test.md`
- `.claude/commands/speckit.workflow.md`

### ✅ Already Correct (Used Prose Format)
- `.claude/commands/speckit.tasks.md`
- `.claude/commands/speckit.implement.md`
- `.claude/commands/speckit.design.md`
- `.claude/commands/speckit.design-iterate.md`
- `.claude/commands/speckit.ux.md`
- `.claude/commands/speckit.analyze.md`
- `.claude/commands/speckit.checklist.md`
- `.claude/commands/speckit.clarify.md`

## Pattern for Future Commands

When creating new slash commands that call bash scripts, use this pattern:

```markdown
**[Action description]**:

Run `[script-path] [args]` with description "[short description for tool]"

[Optional: Additional instructions on how to parse output]
```

### Examples

**Good ✅**:
```markdown
Run `.specify/scripts/bash/check-prerequisites.sh --json` with description "Check feature prerequisites"
```

**Bad ❌**:
```markdown
```bash
.specify/scripts/bash/check-prerequisites.sh --json
```
```

## Testing

To verify the fix works:

1. Run any `/speckit` command that loads prerequisites
2. Confirm it no longer shows the "Unknown option ''" error
3. Verify the script executes successfully and returns JSON output

## Related Files

- **Script**: `.specify/scripts/bash/check-prerequisites.sh`
- **Documentation**: `.claude/commands/speckit.workflow.md`
- **All Commands**: `.claude/commands/speckit.*.md`
