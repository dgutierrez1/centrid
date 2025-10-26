import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChatMessage, ToolCall, Citation, ContentBlock } from '../../components/chat-message';
import { TypingIndicator } from '../../components/typing-indicator';
import { Button } from '../../components/button';
import { Textarea } from '../../components/textarea';
import { Icons } from '../../components/icon';
import { ScrollArea } from '../../components/scroll-area';
import { ContextReferenceBar } from './ContextReferenceBar';
import { ContextReferenceData } from './ContextReference';
import { ApprovalCard, FileChangePreview } from './ApprovalCard';
import { FileAutocomplete, FileItem } from '../../components/file-autocomplete';

export interface MessageData {
  id: string;
  role: 'user' | 'agent';
  /** Ordered content blocks (text, tool calls, citations) for interleaved rendering */
  contentBlocks?: ContentBlock[];
  /** @deprecated Use contentBlocks instead. Legacy support for backward compatibility */
  content?: string;
  /** @deprecated Use contentBlocks instead. Legacy support for backward compatibility */
  toolCalls?: ToolCall[];
  /** @deprecated Use contentBlocks instead. Legacy support for backward compatibility */
  citations?: Citation[];
  timestamp: Date;
}

export interface ChatViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of messages in the chat */
  messages: MessageData[];
  /** Current draft message text */
  draftMessage: string;
  /** Callback when draft message changes */
  onDraftMessageChange: (message: string) => void;
  /** Callback when send button clicked */
  onSendMessage: () => void;
  /** Whether agent is currently responding */
  isAgentResponding?: boolean;
  /** Whether request can be cancelled */
  canCancelRequest?: boolean;
  /** Callback when cancel/stop button clicked */
  onCancelRequest?: () => void;
  /** Context references */
  contextReferences: ContextReferenceData[];
  /** Callback when context reference is removed */
  onRemoveReference?: (referenceId: string) => void;
  /** Callback when context reference is clicked */
  onReferenceClick?: (reference: ContextReferenceData) => void;
  /** Callback when add reference button clicked */
  onAddReference?: () => void;
  /** Pending approval card data */
  approvalRequest?: {
    changes: FileChangePreview[];
    isOngoing: boolean;
    onApprove: () => void;
    onReject: () => void;
    isApproving?: boolean;
    isRejecting?: boolean;
  };
  /** File autocomplete props */
  fileAutocomplete?: {
    items: FileItem[];
    query: string;
    open: boolean;
    onQueryChange: (query: string) => void;
    onSelect: (item: FileItem) => void;
    onClose: () => void;
  };
}

// Helper function to convert legacy message format to contentBlocks
function messageToContentBlocks(message: MessageData): ContentBlock[] {
  // If message already has contentBlocks, use them
  if (message.contentBlocks && message.contentBlocks.length > 0) {
    return message.contentBlocks;
  }

  // Otherwise, convert legacy format to contentBlocks
  const blocks: ContentBlock[] = [];

  // Add text block if content exists
  if (message.content) {
    blocks.push({
      id: `${message.id}-text`,
      type: 'text',
      content: message.content,
    });
  }

  // Add tool calls block if they exist
  if (message.toolCalls && message.toolCalls.length > 0) {
    blocks.push({
      id: `${message.id}-tools`,
      type: 'tool_calls',
      toolCalls: message.toolCalls,
    });
  }

  // Add citations block if they exist
  if (message.citations && message.citations.length > 0) {
    blocks.push({
      id: `${message.id}-citations`,
      type: 'citations',
      citations: message.citations,
    });
  }

  return blocks;
}

export const ChatView = React.forwardRef<HTMLDivElement, ChatViewProps>(
  (
    {
      messages,
      draftMessage,
      onDraftMessageChange,
      onSendMessage,
      isAgentResponding,
      canCancelRequest,
      onCancelRequest,
      contextReferences,
      onRemoveReference,
      onReferenceClick,
      onAddReference,
      approvalRequest,
      fileAutocomplete,
      className,
      ...props
    },
    ref
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages, isAgentResponding]);

    // Handle send message
    const handleSend = () => {
      if (!draftMessage.trim() || isAgentResponding) return;
      onSendMessage();
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    };

    const canSend = draftMessage.trim().length > 0 && !isAgentResponding;

    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}
        {...props}
      >
        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Icons.messageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Ask questions about your files, request edits, or create new content
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    timestamp={message.timestamp}
                    contentBlocks={messageToContentBlocks(message)}
                  />
                ))}
                {isAgentResponding && <TypingIndicator />}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Approval Card (Inline Banner) */}
        {approvalRequest && (
          <div className="shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto w-full">
              <ApprovalCard {...approvalRequest} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto w-full relative">
            {/* File Autocomplete */}
            {fileAutocomplete && (
              <FileAutocomplete
                {...fileAutocomplete}
                className="absolute bottom-full left-0 right-0 mb-2"
              />
            )}

            {/* Context References - Above Input */}
            {contextReferences.length > 0 && (
              <div className="mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {contextReferences.map((reference) => (
                    <div
                      key={reference.id}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <span className="max-w-[100px] sm:max-w-[120px] truncate">
                        {reference.displayLabel}
                      </span>
                      {onRemoveReference && (
                        <button
                          onClick={() => onRemoveReference(reference.id)}
                          className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
                        >
                          <Icons.x className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {onAddReference && (
                    <button
                      onClick={onAddReference}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Icons.plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={draftMessage}
                onChange={(e) => onDraftMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or describe what you'd like to do..."
                className="min-h-[44px] max-h-[200px] resize-none"
                rows={1}
                disabled={isAgentResponding}
              />
              {canCancelRequest && isAgentResponding ? (
                <Button
                  onClick={onCancelRequest}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                >
                  <Icons.square className="h-4 w-4" />
                  <span className="sr-only">Stop</span>
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                >
                  <Icons.send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              )}
            </div>

            {/* Input Hint */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Use @ to reference files</span>
              <span className="hidden sm:inline">Cmd+Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
ChatView.displayName = 'ChatView';
