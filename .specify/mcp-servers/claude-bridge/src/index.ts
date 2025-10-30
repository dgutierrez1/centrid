import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const server = new Server({ name: 'claude-bridge', version: '1.0.0' }, { capabilities: { tools: {} } });

function getGuidelines() {
  for (const loc of [
    path.join(process.cwd(), 'CLAUDE.md'),
    path.join(process.env.HOME || '', '.claude', 'memory', 'CLAUDE.md'),
  ]) {
    if (fs.existsSync(loc)) return fs.readFileSync(loc, 'utf-8').trim();
  }
  return null;
}

function loadCommands() {
  const commands = new Map();
  for (const dir of [
    path.join(process.cwd(), '.claude', 'commands'),
    path.join(process.env.HOME || '', '.claude', 'commands'),
  ]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
      if (match) {
        const desc = match[1].match(/description:\s*(.+)/)?.[1] || file;
        commands.set(`/${file.replace('.md', '')}`, {
          desc,
          prompt: match[2].replace(/\$ARGUMENTS/g, '{{ARGS}}'),
        });
      }
    }
  }
  return commands;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { 
      name: 'get_guidelines', 
      description: 'Load project guidelines from CLAUDE.md. IMPORTANT: Call this first at the start of each session to load project context, coding standards, architecture rules, and workflow instructions. This should be your first action when starting a new conversation.', 
      inputSchema: { type: 'object', properties: {} } 
    },
    { 
      name: 'list_commands', 
      description: 'List all available slash commands (like /speckit.debug, /speckit.plan, etc.) from .claude/commands directory. Use this to discover available workflows and commands.', 
      inputSchema: { type: 'object', properties: {} } 
    },
    { 
      name: 'exec_command', 
      description: 'Execute a Claude Code slash command. IMPORTANT: If the user types a message starting with "/" (like "/speckit.debug" or "/xyz"), interpret this as a slash command request. Usage: cmd can be /speckit.debug or speckit.debug (slash optional), args is optional string from the rest of the user message. Examples: /speckit.plan, /speckit.debug API error, /speckit.test. Returns the full command prompt template ready for execution.', 
      inputSchema: { type: 'object', properties: { cmd: { type: 'string', description: 'Command name with or without leading slash (e.g., "/speckit.debug" or "speckit.debug")' }, args: { type: 'string', description: 'Optional arguments for the command' } }, required: ['cmd'] } 
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'get_guidelines') {
    const g = getGuidelines();
    return { content: [{ type: 'text', text: g || 'No CLAUDE.md found' }] };
  }
  if (req.params.name === 'list_commands') {
    const cmds = loadCommands();
    return { content: [{ type: 'text', text: Array.from(cmds.entries()).map(([k, v]) => `${k} - ${v.desc}`).join('\n') || 'No commands found' }] };
  }
  if (req.params.name === 'exec_command') {
    const cmds = loadCommands();
    const args = req.params.arguments as { cmd?: string; args?: string };
    if (!args?.cmd) {
      return { content: [{ type: 'text', text: 'Command name required' }] };
    }
    const cmdName = args.cmd.startsWith('/') ? args.cmd : `/${args.cmd}`;
    const cmd = cmds.get(cmdName);
    if (!cmd) {
      return { content: [{ type: 'text', text: `Command "${cmdName}" not found` }] };
    }
    let prompt = cmd.prompt.replace('{{ARGS}}', args.args || '');
    prompt = prompt.replace(/!`([^`]+)`/g, (_match: string, c: string) => {
      try {
        return `\n\`${c}\`:\n\`\`\`\n${execSync(c, { cwd: process.cwd(), encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 }).trim()}\n\`\`\`\n`;
      } catch (e: any) {
        return `\nError: \`${c}\`: ${e.message}\n`;
      }
    });
    return { content: [{ type: 'text', text: prompt }] };
  }
  return { content: [{ type: 'text', text: 'Unknown tool' }] };
});

async function main() {
  await server.connect(new StdioServerTransport());
  console.error('Claude Bridge MCP server running');
}
main().catch(console.error);
