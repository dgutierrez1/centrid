#!/usr/bin/env node

/**
 * Custom Playwright MCP Server with Context Isolation
 *
 * Enables parallel, isolated browser contexts for sub-agents.
 * Each context is identified by contextId and operates independently.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { z } from 'zod';

// State management
let browser: Browser | null = null;
const contexts = new Map<string, BrowserContext>();
const pages = new Map<string, Page>();

// Initialize server
const server = new Server(
  {
    name: 'playwright-contexts',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas
const CreateContextSchema = z.object({
  contextId: z.string().describe('Unique identifier for this browser context'),
  viewport: z.object({
    width: z.number().default(1440),
    height: z.number().default(900),
  }).optional(),
});

const NavigateSchema = z.object({
  contextId: z.string(),
  url: z.string(),
});

const ClickSchema = z.object({
  contextId: z.string(),
  selector: z.string(),
});

const TypeSchema = z.object({
  contextId: z.string(),
  selector: z.string(),
  text: z.string(),
});

const ScreenshotSchema = z.object({
  contextId: z.string(),
  path: z.string(),
  fullPage: z.boolean().optional(),
});

const SnapshotSchema = z.object({
  contextId: z.string(),
});

const EvaluateSchema = z.object({
  contextId: z.string(),
  script: z.string(),
});

const WaitForSchema = z.object({
  contextId: z.string(),
  selector: z.string(),
  state: z.enum(['attached', 'detached', 'visible', 'hidden']).optional(),
  timeout: z.number().optional(),
});

const CloseContextSchema = z.object({
  contextId: z.string(),
});

// Helper: Get page for context
async function getPage(contextId: string): Promise<Page> {
  if (!pages.has(contextId)) {
    const context = contexts.get(contextId);
    if (!context) {
      throw new Error(`Context '${contextId}' not found. Create it first with browser_create_context.`);
    }
    const page = await context.newPage();
    pages.set(contextId, page);
  }
  return pages.get(contextId)!;
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'browser_create_context',
        description: 'Create an isolated browser context with specific viewport. Each context operates independently.',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string', description: 'Unique identifier for this context (e.g., "mobile", "desktop")' },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'number', default: 1440 },
                height: { type: 'number', default: 900 },
              },
            },
          },
          required: ['contextId'],
        },
      },
      {
        name: 'browser_navigate',
        description: 'Navigate to a URL in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            url: { type: 'string' },
          },
          required: ['contextId', 'url'],
        },
      },
      {
        name: 'browser_click',
        description: 'Click an element in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            selector: { type: 'string', description: 'CSS selector or text locator' },
          },
          required: ['contextId', 'selector'],
        },
      },
      {
        name: 'browser_type',
        description: 'Type text into an element in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            selector: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['contextId', 'selector', 'text'],
        },
      },
      {
        name: 'browser_screenshot',
        description: 'Take a screenshot in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            path: { type: 'string', description: 'File path to save screenshot' },
            fullPage: { type: 'boolean', default: false },
          },
          required: ['contextId', 'path'],
        },
      },
      {
        name: 'browser_snapshot',
        description: 'Get accessibility tree snapshot of current page in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
          },
          required: ['contextId'],
        },
      },
      {
        name: 'browser_evaluate',
        description: 'Execute JavaScript in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            script: { type: 'string', description: 'JavaScript code to execute' },
          },
          required: ['contextId', 'script'],
        },
      },
      {
        name: 'browser_wait_for',
        description: 'Wait for selector to reach a state in a specific context',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
            selector: { type: 'string' },
            state: { type: 'string', enum: ['attached', 'detached', 'visible', 'hidden'] },
            timeout: { type: 'number', description: 'Timeout in milliseconds' },
          },
          required: ['contextId', 'selector'],
        },
      },
      {
        name: 'browser_close_context',
        description: 'Close a specific browser context and clean up resources',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: { type: 'string' },
          },
          required: ['contextId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'browser_create_context': {
        const { contextId, viewport } = CreateContextSchema.parse(args);

        // Launch browser if not already running
        if (!browser) {
          browser = await chromium.launch({ headless: true });
        }

        // Create isolated context
        const context = await browser.newContext({
          viewport: viewport || { width: 1440, height: 900 },
        });

        contexts.set(contextId, context);

        return {
          content: [
            {
              type: 'text',
              text: `Browser context '${contextId}' created with viewport ${viewport?.width || 1440}×${viewport?.height || 900}`,
            },
          ],
        };
      }

      case 'browser_navigate': {
        const { contextId, url } = NavigateSchema.parse(args);
        const page = await getPage(contextId);
        await page.goto(url);

        return {
          content: [
            {
              type: 'text',
              text: `Navigated to ${url} in context '${contextId}'`,
            },
          ],
        };
      }

      case 'browser_click': {
        const { contextId, selector } = ClickSchema.parse(args);
        const page = await getPage(contextId);
        await page.click(selector);

        return {
          content: [
            {
              type: 'text',
              text: `Clicked '${selector}' in context '${contextId}'`,
            },
          ],
        };
      }

      case 'browser_type': {
        const { contextId, selector, text } = TypeSchema.parse(args);
        const page = await getPage(contextId);
        await page.fill(selector, text);

        return {
          content: [
            {
              type: 'text',
              text: `Typed text into '${selector}' in context '${contextId}'`,
            },
          ],
        };
      }

      case 'browser_screenshot': {
        const { contextId, path, fullPage } = ScreenshotSchema.parse(args);
        const page = await getPage(contextId);
        await page.screenshot({ path, fullPage: fullPage || false });

        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to ${path} from context '${contextId}'`,
            },
          ],
        };
      }

      case 'browser_snapshot': {
        const { contextId } = SnapshotSchema.parse(args);
        const page = await getPage(contextId);
        const snapshot = await page.accessibility.snapshot();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(snapshot, null, 2),
            },
          ],
        };
      }

      case 'browser_evaluate': {
        const { contextId, script } = EvaluateSchema.parse(args);
        const page = await getPage(contextId);
        const result = await page.evaluate(script);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'browser_wait_for': {
        const { contextId, selector, state, timeout } = WaitForSchema.parse(args);
        const page = await getPage(contextId);
        await page.waitForSelector(selector, {
          state: state as any || 'visible',
          timeout: timeout || 30000,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Selector '${selector}' reached state '${state || 'visible'}' in context '${contextId}'`,
            },
          ],
        };
      }

      case 'browser_close_context': {
        const { contextId } = CloseContextSchema.parse(args);
        const context = contexts.get(contextId);

        if (context) {
          await context.close();
          contexts.delete(contextId);
          pages.delete(contextId);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Context '${contextId}' closed`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Cleanup on exit
async function cleanup() {
  for (const context of contexts.values()) {
    await context.close();
  }
  if (browser) {
    await browser.close();
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Playwright Contexts MCP server running on stdio');
}

main().catch(console.error);
