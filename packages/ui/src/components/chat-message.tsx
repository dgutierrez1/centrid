import * as React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { Icons } from './icon';

export interface ToolCall {
  id: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  targetFile?: string;
}

export interface Citation {
  id: string;
  url: string;
  title: string;
  snippet: string;
}

// Content block types for interleaved rendering
export interface BaseContentBlock {
  id: string;
  type: 'text' | 'tool_calls' | 'citations';
}

export interface TextBlock extends BaseContentBlock {
  type: 'text';
  content: string;
}

export interface ToolCallsBlock extends BaseContentBlock {
  type: 'tool_calls';
  toolCalls: ToolCall[];
}

export interface CitationsBlock extends BaseContentBlock {
  type: 'citations';
  citations: Citation[];
}

export type ContentBlock = TextBlock | ToolCallsBlock | CitationsBlock;

export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Message author role */
  role: 'user' | 'agent';
  /** Timestamp */
  timestamp: Date;
  /** Ordered content blocks (text, tool calls, citations) */
  contentBlocks?: ContentBlock[];
  /** Whether message is currently streaming */
  isStreaming?: boolean;
  /** Callback when user clicks copy button */
  onCopy?: () => void;
  /** Callback when user clicks a file reference */
  onFileClick?: (filePath: string) => void;
  /** Callback when user clicks a citation */
  onCitationClick?: (url: string) => void;
}

function getToolIcon(toolName: string) {
  switch (toolName) {
    case 'read_document':
      return <Icons.fileText className="h-4 w-4" />;
    case 'update_document':
    case 'create_document':
      return <Icons.fileEdit className="h-4 w-4" />;
    case 'search_documents':
      return <Icons.search className="h-4 w-4" />;
    case 'web_search':
      return <Icons.globe className="h-4 w-4" />;
    case 'list_directory':
      return <Icons.folder className="h-4 w-4" />;
    default:
      return <Icons.bot className="h-4 w-4" />;
  }
}

function getToolStatusIcon(status: ToolCall['status']) {
  switch (status) {
    case 'completed':
      return <Icons.check className="h-3 w-3 text-success-500" />;
    case 'failed':
      return <Icons.x className="h-3 w-3 text-error-500" />;
    case 'running':
      return <Icons.loader2 className="h-3 w-3 animate-spin text-primary-500" />;
    default:
      return null;
  }
}

const ToolCallItem = React.forwardRef<HTMLDivElement, { toolCall: ToolCall }>(
  ({ toolCall }, ref) => {
    const icon = getToolIcon(toolCall.toolName);
    const statusIcon = getToolStatusIcon(toolCall.status);

    return (
      <div
        ref={ref}
        className="flex items-start gap-2 rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-sm"
      >
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 dark:text-gray-100">
              {toolCall.description}
            </span>
            {statusIcon && <div className="shrink-0">{statusIcon}</div>}
          </div>
          {toolCall.targetFile && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
              {toolCall.targetFile}
            </div>
          )}
        </div>
      </div>
    );
  }
);
ToolCallItem.displayName = 'ToolCallItem';

const CitationItem = React.forwardRef<
  HTMLButtonElement,
  { citation: Citation; onClick: () => void }
>(({ citation, onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className="flex flex-col gap-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    <div className="flex items-start gap-2">
      <Icons.externalLink className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
          {citation.title}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {citation.snippet}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
          {new URL(citation.url).hostname}
        </div>
      </div>
    </div>
  </button>
));
CitationItem.displayName = 'CitationItem';

const TextBlockComponent = React.forwardRef<
  HTMLDivElement,
  { block: TextBlock; isUser: boolean; isStreaming?: boolean }
>(({ block, isUser, isStreaming }, ref) => (
  <div ref={ref}>
    {/* TODO: Render markdown with syntax highlighting */}
    <p className={cn('whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none', isUser && 'text-gray-900 dark:text-gray-100')}>
      {block.content}
    </p>
    {isStreaming && (
      <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
    )}
  </div>
));
TextBlockComponent.displayName = 'TextBlockComponent';

const ToolCallsBlockComponent = React.forwardRef<HTMLDivElement, { block: ToolCallsBlock }>(
  ({ block }, ref) => {
    const { toolCalls } = block;
    const shouldAutoCollapse = toolCalls.length > 3;
    const completedCount = toolCalls.filter((t) => t.status === 'completed').length;
    const runningCount = toolCalls.filter((t) => t.status === 'running').length;
    const isRunning = runningCount > 0;

    return (
      <details ref={ref} className="text-xs text-gray-600 dark:text-gray-400 group" open={!shouldAutoCollapse}>
        <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-1">
          <Icons.chevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
          <span className={cn(
            "font-medium relative",
            isRunning && "bg-gradient-to-r from-primary-700 via-primary-300 to-primary-700 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer"
          )}>
            {isRunning
              ? `Running ${runningCount} tool${runningCount > 1 ? 's' : ''}...`
              : `Used ${completedCount} tool${completedCount > 1 ? 's' : ''}`
            }
          </span>
        </summary>
        <div className="mt-1.5 ml-4 space-y-1.5 pb-1">
          {toolCalls.map((toolCall) => (
            <div key={toolCall.id} className="flex items-start gap-2 text-xs">
              <div className="mt-0.5 shrink-0">{getToolStatusIcon(toolCall.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 dark:text-gray-100">{toolCall.description}</div>
                {toolCall.targetFile && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-500 font-mono truncate mt-0.5">
                    {toolCall.targetFile}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    );
  }
);
ToolCallsBlockComponent.displayName = 'ToolCallsBlockComponent';

const CitationsBlockComponent = React.forwardRef<
  HTMLDivElement,
  { block: CitationsBlock; onCitationClick?: (url: string) => void }
>(({ block, onCitationClick }, ref) => (
  <div ref={ref} className="space-y-2 w-full">
    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
      <Icons.globe className="h-3 w-3" />
      <span>Web Sources</span>
    </div>
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
      {block.citations.map((citation) => (
        <CitationItem
          key={citation.id}
          citation={citation}
          onClick={() => onCitationClick?.(citation.url)}
        />
      ))}
    </div>
  </div>
));
CitationsBlockComponent.displayName = 'CitationsBlockComponent';

export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    {
      role,
      timestamp,
      contentBlocks = [],
      isStreaming,
      onCopy,
      onFileClick,
      onCitationClick,
      className,
      ...props
    },
    ref
  ) => {
    const isUser = role === 'user';

    return (
      <div
        ref={ref}
        className={cn(
          'group flex gap-3 py-4 px-4',
          isUser ? 'flex-row-reverse' : 'flex-row',
          className
        )}
        {...props}
      >
        {/* Avatar */}
        <div
          className={cn(
            'shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
            isUser
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          )}
        >
          {isUser ? 'U' : 'A'}
        </div>

        {/* Message Content - All blocks wrapped in single bubble */}
        <div className={cn('flex-1 min-w-0 space-y-3', isUser && 'flex flex-col items-end')}>
          {/* Content bubble containing all blocks */}
          <div
            className={cn(
              'rounded-lg p-3 space-y-2',
              isUser
                ? 'bg-primary-50/50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            {contentBlocks.map((block, index) => {
              const isLastBlock = index === contentBlocks.length - 1;

              switch (block.type) {
                case 'text':
                  return (
                    <TextBlockComponent
                      key={block.id}
                      block={block}
                      isUser={isUser}
                      isStreaming={isStreaming && isLastBlock}
                    />
                  );
                case 'tool_calls':
                  return <ToolCallsBlockComponent key={block.id} block={block} />;
                case 'citations':
                  return (
                    <CitationsBlockComponent
                      key={block.id}
                      block={block}
                      onCitationClick={onCitationClick}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Message Metadata */}
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <time dateTime={timestamp.toISOString()}>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
            {!isUser && onCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icons.copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ChatMessage.displayName = 'ChatMessage';
