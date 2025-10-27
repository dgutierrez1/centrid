# Playwright Contexts MCP Server

Custom MCP server that provides isolated browser contexts for parallel sub-agent execution.

## Features

- **Context Isolation**: Each `contextId` gets its own isolated browser context
- **Parallel Execution**: Multiple sub-agents can control different contexts simultaneously
- **Full Interactivity**: Claude Code can see → think → act in a loop
- **Local & Free**: Runs locally, no cloud costs

## Installation

```bash
cd .specify/mcp-servers/playwright-contexts
npm install
npm run build
```

## Configuration

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright-contexts": {
      "command": "node",
      "args": ["/Users/daniel/Projects/misc/centrid/.specify/mcp-servers/playwright-contexts/dist/index.js"]
    }
  }
}
```

## Usage

### Create Isolated Contexts

```javascript
// Sub-Agent 1: Mobile verification
browser_create_context({
  contextId: "mobile",
  viewport: { width: 375, height: 812 }
})

// Sub-Agent 2: Desktop verification (parallel)
browser_create_context({
  contextId: "desktop",
  viewport: { width: 1440, height: 900 }
})
```

### Interactive Control

```javascript
// Navigate
browser_navigate({ contextId: "mobile", url: "http://localhost:3001" })

// Get page state
browser_snapshot({ contextId: "mobile" })
// Returns accessibility tree → Claude Code analyzes

// Click element
browser_click({ contextId: "mobile", selector: "[data-testid='button']" })

// Take screenshot
browser_screenshot({ contextId: "mobile", path: "mobile.png" })

// Close context
browser_close_context({ contextId: "mobile" })
```

## Available Tools

| Tool | Description |
|------|-------------|
| `browser_create_context` | Create isolated browser context |
| `browser_navigate` | Navigate to URL in context |
| `browser_click` | Click element in context |
| `browser_type` | Type text in context |
| `browser_screenshot` | Take screenshot in context |
| `browser_snapshot` | Get accessibility tree from context |
| `browser_evaluate` | Execute JavaScript in context |
| `browser_wait_for` | Wait for selector in context |
| `browser_close_context` | Close context and cleanup |

## How It Enables Interactivity

Each tool call is a **synchronous request/response**:

1. Sub-agent calls `browser_snapshot({ contextId: "mobile" })`
2. MCP returns current page state
3. Sub-agent analyzes state
4. Sub-agent decides next action
5. Sub-agent calls `browser_click({ contextId: "mobile", selector: "..." })`
6. Repeat loop

This allows Claude Code to **explore and adapt** instead of following a pre-programmed script.

## Example: Parallel Design Verification

```javascript
// Sub-Agent 1 (Mobile)
await browser_create_context({ contextId: "mobile", viewport: { width: 375, height: 812 }})
await browser_navigate({ contextId: "mobile", url: "http://localhost:3001/ai-agent-system" })
const mobileSnapshot = await browser_snapshot({ contextId: "mobile" })
// Analyze snapshot, check elements...
await browser_screenshot({ contextId: "mobile", path: "mobile.png" })
await browser_close_context({ contextId: "mobile" })

// Sub-Agent 2 (Desktop - runs in parallel)
await browser_create_context({ contextId: "desktop", viewport: { width: 1440, height: 900 }})
await browser_navigate({ contextId: "desktop", url: "http://localhost:3001/ai-agent-system" })
const desktopSnapshot = await browser_snapshot({ contextId: "desktop" })
// Analyze snapshot, check elements...
await browser_screenshot({ contextId: "desktop", path: "desktop.png" })
await browser_close_context({ contextId: "desktop" })
```

Both sub-agents run **simultaneously** with **complete isolation**.

## Benefits vs. Standard Playwright MCP

| Feature | Standard Playwright MCP | This Custom MCP |
|---------|------------------------|-----------------|
| Parallel contexts | ❌ No | ✅ Yes |
| Sub-agent isolation | ❌ Shared | ✅ Isolated |
| Interactive control | ✅ Yes | ✅ Yes |
| Local execution | ✅ Yes | ✅ Yes |
| Free | ✅ Yes | ✅ Yes |

## Troubleshooting

**"Context not found"**: Create context with `browser_create_context` before using other tools.

**Browser not closing**: Call `browser_close_context` for each context when done.

**Port conflicts**: Only one instance of this MCP server can run at a time (but supports unlimited contexts).
