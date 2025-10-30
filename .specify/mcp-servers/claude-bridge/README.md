# Claude Bridge MCP Server

Bridge MCP server that brings Claude Code features to Cursor CLI interactive sessions.

## Features

- **Load CLAUDE.md**: Automatically finds and loads project guidelines
- **Slash Commands**: Executes commands from `.claude/commands/`
- **Works in Interactive Session**: All features available via MCP tools

## MCP Tools

- `get_guidelines` - Load CLAUDE.md from project root or ~/.claude/memory/
- `list_commands` - List all available slash commands
- `exec_command` - Execute a slash command with optional arguments

## Usage in Cursor CLI

```bash
cursor-agent

# In session:
You: Load guidelines
Agent: [Calls get_guidelines] ?

You: What commands are available?
Agent: [Calls list_commands] ?

You: Execute /review
Agent: [Calls exec_command] ?
```

## Slash Commands

Create commands in `.claude/commands/` or `~/.claude/commands/`:

```markdown
<!-- .claude/commands/review.md -->
---
description: Review code for quality and security
---

Review my code: !`git diff HEAD`
Focus: $ARGUMENTS
```

Then in session:
```
You: Execute /review with args security
Agent: [Executes command with security as args]
```

## Build

```bash
cd .specify/mcp-servers/claude-bridge
npm install
npm run build
```

## Configuration

Already configured in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "claude-bridge": {
      "command": "node",
      "args": ["/Users/daniel/Projects/misc/centrid/.specify/mcp-servers/claude-bridge/dist/index.js"]
    }
  }
}
```
