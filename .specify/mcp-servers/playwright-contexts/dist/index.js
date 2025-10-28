#!/usr/bin/env node
/**
 * Custom Playwright MCP Server with Context Isolation
 *
 * Enables parallel, isolated browser contexts for sub-agents.
 * Each context is identified by contextId and operates independently.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';
import { z } from 'zod';
// State management
let browser = null;
const contexts = new Map();
const pages = new Map();
const consoleMessages = new Map();
const networkRequests = new Map();
// Initialize server
const server = new Server({
    name: 'playwright-contexts',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
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
const HoverSchema = z.object({
    contextId: z.string(),
    selector: z.string(),
});
const SelectOptionSchema = z.object({
    contextId: z.string(),
    selector: z.string(),
    values: z.array(z.string()),
});
const PressKeySchema = z.object({
    contextId: z.string(),
    key: z.string(),
});
const FillFormSchema = z.object({
    contextId: z.string(),
    fields: z.array(z.object({
        selector: z.string(),
        value: z.string(),
    })),
});
const FileUploadSchema = z.object({
    contextId: z.string(),
    selector: z.string(),
    paths: z.array(z.string()),
});
const DragSchema = z.object({
    contextId: z.string(),
    sourceSelector: z.string(),
    targetSelector: z.string(),
});
const NavigateBackSchema = z.object({
    contextId: z.string(),
});
const ResizeSchema = z.object({
    contextId: z.string(),
    width: z.number(),
    height: z.number(),
});
const ConsoleMessagesSchema = z.object({
    contextId: z.string(),
    onlyErrors: z.boolean().optional(),
});
const NetworkRequestsSchema = z.object({
    contextId: z.string(),
});
const HandleDialogSchema = z.object({
    contextId: z.string(),
    accept: z.boolean(),
    promptText: z.string().optional(),
});
const TabsSchema = z.object({
    contextId: z.string(),
    action: z.enum(['list', 'new', 'close', 'select']),
    index: z.number().optional(),
});
// Helper: Get page for context
async function getPage(contextId) {
    if (!pages.has(contextId)) {
        const context = contexts.get(contextId);
        if (!context) {
            throw new Error(`Context '${contextId}' not found. Create it first with browser_create_context.`);
        }
        const page = await context.newPage();
        // Initialize tracking arrays
        if (!consoleMessages.has(contextId)) {
            consoleMessages.set(contextId, []);
        }
        if (!networkRequests.has(contextId)) {
            networkRequests.set(contextId, []);
        }
        // Attach console listener
        page.on('console', (msg) => {
            const messages = consoleMessages.get(contextId);
            messages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now(),
            });
        });
        // Attach network listener
        page.on('response', (response) => {
            const requests = networkRequests.get(contextId);
            requests.push({
                url: response.url(),
                method: response.request().method(),
                status: response.status(),
                timestamp: Date.now(),
            });
        });
        // Attach dialog handler (auto-dismiss by default)
        page.on('dialog', async (dialog) => {
            await dialog.dismiss();
        });
        pages.set(contextId, page);
    }
    return pages.get(contextId);
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
            {
                name: 'browser_hover',
                description: 'Hover over an element in a specific context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        selector: { type: 'string', description: 'CSS selector' },
                    },
                    required: ['contextId', 'selector'],
                },
            },
            {
                name: 'browser_select_option',
                description: 'Select an option in a dropdown',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        selector: { type: 'string', description: 'CSS selector for the select element' },
                        values: { type: 'array', items: { type: 'string' }, description: 'Array of values to select' },
                    },
                    required: ['contextId', 'selector', 'values'],
                },
            },
            {
                name: 'browser_press_key',
                description: 'Press a key on the keyboard',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        key: { type: 'string', description: 'Key name (e.g., "Enter", "ArrowDown", "a")' },
                    },
                    required: ['contextId', 'key'],
                },
            },
            {
                name: 'browser_fill_form',
                description: 'Fill multiple form fields',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        fields: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    selector: { type: 'string' },
                                    value: { type: 'string' },
                                },
                                required: ['selector', 'value'],
                            },
                        },
                    },
                    required: ['contextId', 'fields'],
                },
            },
            {
                name: 'browser_file_upload',
                description: 'Upload one or multiple files',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        selector: { type: 'string', description: 'CSS selector for file input' },
                        paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to files' },
                    },
                    required: ['contextId', 'selector', 'paths'],
                },
            },
            {
                name: 'browser_drag',
                description: 'Perform drag and drop between two elements',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        sourceSelector: { type: 'string', description: 'CSS selector for source element' },
                        targetSelector: { type: 'string', description: 'CSS selector for target element' },
                    },
                    required: ['contextId', 'sourceSelector', 'targetSelector'],
                },
            },
            {
                name: 'browser_navigate_back',
                description: 'Navigate back to the previous page',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                    },
                    required: ['contextId'],
                },
            },
            {
                name: 'browser_resize',
                description: 'Resize the browser viewport',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        width: { type: 'number', description: 'Viewport width' },
                        height: { type: 'number', description: 'Viewport height' },
                    },
                    required: ['contextId', 'width', 'height'],
                },
            },
            {
                name: 'browser_console_messages',
                description: 'Returns all console messages captured in this context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        onlyErrors: { type: 'boolean', description: 'Only return error messages' },
                    },
                    required: ['contextId'],
                },
            },
            {
                name: 'browser_network_requests',
                description: 'Returns all network requests captured in this context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                    },
                    required: ['contextId'],
                },
            },
            {
                name: 'browser_handle_dialog',
                description: 'Handle a dialog (alert, confirm, prompt)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        accept: { type: 'boolean', description: 'Whether to accept the dialog' },
                        promptText: { type: 'string', description: 'Text for prompt dialog' },
                    },
                    required: ['contextId', 'accept'],
                },
            },
            {
                name: 'browser_tabs',
                description: 'List, create, close, or select a browser tab/page in context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        contextId: { type: 'string' },
                        action: { type: 'string', enum: ['list', 'new', 'close', 'select'], description: 'Operation to perform' },
                        index: { type: 'number', description: 'Tab index for close/select actions' },
                    },
                    required: ['contextId', 'action'],
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
                    browser = await chromium.launch({ headless: false });
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
                    state: state || 'visible',
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
                    consoleMessages.delete(contextId);
                    networkRequests.delete(contextId);
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
            case 'browser_hover': {
                const { contextId, selector } = HoverSchema.parse(args);
                const page = await getPage(contextId);
                await page.hover(selector);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Hovered over '${selector}' in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_select_option': {
                const { contextId, selector, values } = SelectOptionSchema.parse(args);
                const page = await getPage(contextId);
                await page.selectOption(selector, values);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Selected options ${JSON.stringify(values)} in '${selector}' in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_press_key': {
                const { contextId, key } = PressKeySchema.parse(args);
                const page = await getPage(contextId);
                await page.keyboard.press(key);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Pressed key '${key}' in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_fill_form': {
                const { contextId, fields } = FillFormSchema.parse(args);
                const page = await getPage(contextId);
                for (const field of fields) {
                    await page.fill(field.selector, field.value);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Filled ${fields.length} form fields in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_file_upload': {
                const { contextId, selector, paths } = FileUploadSchema.parse(args);
                const page = await getPage(contextId);
                await page.setInputFiles(selector, paths);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Uploaded ${paths.length} file(s) to '${selector}' in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_drag': {
                const { contextId, sourceSelector, targetSelector } = DragSchema.parse(args);
                const page = await getPage(contextId);
                await page.dragAndDrop(sourceSelector, targetSelector);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Dragged '${sourceSelector}' to '${targetSelector}' in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_navigate_back': {
                const { contextId } = NavigateBackSchema.parse(args);
                const page = await getPage(contextId);
                await page.goBack();
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Navigated back in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_resize': {
                const { contextId, width, height } = ResizeSchema.parse(args);
                const page = await getPage(contextId);
                await page.setViewportSize({ width, height });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Resized viewport to ${width}×${height} in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_console_messages': {
                const { contextId, onlyErrors } = ConsoleMessagesSchema.parse(args);
                const messages = consoleMessages.get(contextId) || [];
                const filtered = onlyErrors ? messages.filter(m => m.type === 'error') : messages;
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(filtered, null, 2),
                        },
                    ],
                };
            }
            case 'browser_network_requests': {
                const { contextId } = NetworkRequestsSchema.parse(args);
                const requests = networkRequests.get(contextId) || [];
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(requests, null, 2),
                        },
                    ],
                };
            }
            case 'browser_handle_dialog': {
                const { contextId, accept, promptText } = HandleDialogSchema.parse(args);
                const page = await getPage(contextId);
                // Remove default dismiss handler and add custom handler
                page.removeAllListeners('dialog');
                page.once('dialog', async (dialog) => {
                    if (accept) {
                        await dialog.accept(promptText);
                    }
                    else {
                        await dialog.dismiss();
                    }
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Dialog handler set to ${accept ? 'accept' : 'dismiss'} in context '${contextId}'`,
                        },
                    ],
                };
            }
            case 'browser_tabs': {
                const { contextId, action, index } = TabsSchema.parse(args);
                const context = contexts.get(contextId);
                if (!context) {
                    throw new Error(`Context '${contextId}' not found`);
                }
                const allPages = context.pages();
                switch (action) {
                    case 'list': {
                        const pageList = await Promise.all(allPages.map(async (p, i) => ({
                            index: i,
                            url: p.url(),
                            title: await p.title(),
                        })));
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(pageList, null, 2),
                                },
                            ],
                        };
                    }
                    case 'new': {
                        const newPage = await context.newPage();
                        const newIndex = allPages.length;
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Created new tab at index ${newIndex} in context '${contextId}'`,
                                },
                            ],
                        };
                    }
                    case 'close': {
                        if (index === undefined || index < 0 || index >= allPages.length) {
                            throw new Error(`Invalid tab index: ${index}`);
                        }
                        await allPages[index].close();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Closed tab at index ${index} in context '${contextId}'`,
                                },
                            ],
                        };
                    }
                    case 'select': {
                        if (index === undefined || index < 0 || index >= allPages.length) {
                            throw new Error(`Invalid tab index: ${index}`);
                        }
                        const selectedPage = allPages[index];
                        pages.set(contextId, selectedPage);
                        await selectedPage.bringToFront();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Selected tab at index ${index} in context '${contextId}'`,
                                },
                            ],
                        };
                    }
                    default:
                        throw new Error(`Unknown tabs action: ${action}`);
                }
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
