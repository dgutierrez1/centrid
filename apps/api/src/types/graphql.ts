export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
  UUID: { input: string; output: string; }
  Upload: { input: File; output: File; }
};

export type AddContextReferenceInput = {
  /** Entity path or ID */
  entityReference: Scalars['String']['input'];
  /** Type: file, folder, thread */
  entityType: Scalars['String']['input'];
  /** Priority: 1 (high) to 3 (low) */
  priorityTier?: InputMaybe<Scalars['Int']['input']>;
  /** Source: user-added, agent-added, inherited */
  source: Scalars['String']['input'];
  /** Thread ID to add reference to */
  threadId: Scalars['ID']['input'];
};

/** Real-time execution events for agent requests (text_chunk, tool_call, completion, error) */
export type AgentExecutionEvent = {
  __typename?: 'AgentExecutionEvent';
  createdAt: Scalars['DateTime']['output'];
  /** Event payload (JSON object) */
  data: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  /** Agent request ID this event belongs to */
  requestId: Scalars['String']['output'];
  /** Event type: text_chunk, tool_call, completion, error */
  type: Scalars['String']['output'];
};

/** AI agent execution request */
export type AgentRequest = {
  __typename?: 'AgentRequest';
  /** Agent type (e.g., claude, gpt4) */
  agentType: Scalars['String']['output'];
  /** Checkpoint state for tool approval resume (JSON) */
  checkpoint?: Maybe<Scalars['JSON']['output']>;
  /** Completion timestamp */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Request content/prompt */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Request ID */
  id: Scalars['ID']['output'];
  /** Progress (0.0 - 1.0) */
  progress: Scalars['Float']['output'];
  /** Response message ID */
  responseMessageId?: Maybe<Scalars['String']['output']>;
  /** Execution results (JSON) */
  results?: Maybe<Scalars['JSON']['output']>;
  /** Status: pending, in_progress, completed, failed */
  status: Scalars['String']['output'];
  /** Thread ID */
  threadId: Scalars['String']['output'];
  /** Total tokens used */
  tokenCost?: Maybe<Scalars['Int']['output']>;
  /** Triggering message ID */
  triggeringMessageId: Scalars['String']['output'];
  /** Last update timestamp */
  updatedAt: Scalars['DateTime']['output'];
  /** Owner user ID */
  userId: Scalars['String']['output'];
};

/** Input for approving a tool call */
export type ApproveToolCallInput = {
  /** Tool call ID */
  id: Scalars['ID']['input'];
};

/** Autocomplete input parameters for quick fuzzy search */
export type AutocompleteInput = {
  /** Filter by entity type: files, folders, threads. Default: all */
  entityType?: InputMaybe<Scalars['String']['input']>;
  /** Max results (default: 10) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Autocomplete query (fuzzy matching) */
  query: Scalars['String']['input'];
};

/** Autocomplete result for fuzzy matching */
export type AutocompleteItem = {
  __typename?: 'AutocompleteItem';
  branchId?: Maybe<Scalars['String']['output']>;
  branchName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastModified?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  relevanceScore?: Maybe<Scalars['Float']['output']>;
  /** Entity type: file, folder, thread */
  type: Scalars['String']['output'];
};

/** Concept search result from knowledge graph */
export type ConceptSearchResult = {
  __typename?: 'ConceptSearchResult';
  /** Concept name */
  conceptName: Scalars['String']['output'];
  /** Entity type: concept */
  entityType: Scalars['String']['output'];
  /** Concept description */
  excerpt: Scalars['String']['output'];
  /** Concept ID */
  id: Scalars['ID']['output'];
  /** Relevance score (0-1) */
  relevance: Scalars['Float']['output'];
};

export type ConsolidateBranchesInput = {
  /** Array of child branch IDs to consolidate */
  childBranchIds: Array<Scalars['ID']['input']>;
  /** File name for the consolidated output */
  fileName: Scalars['String']['input'];
  /** Target folder path for the consolidated file */
  targetFolder: Scalars['String']['input'];
  /** Parent thread ID */
  threadId: Scalars['ID']['input'];
};

export type ConsolidationResult = {
  __typename?: 'ConsolidationResult';
  /** ID of the file that will be created (permanent ID) */
  fileId: Scalars['ID']['output'];
  /** Agent request ID for subscribing to progress events */
  requestId: Scalars['ID']['output'];
  /** Status: pending, in_progress, completed, failed */
  status: Scalars['String']['output'];
};

/** Message content block (text, tool use, tool result, or image) */
export type ContentBlock = ImageBlock | TextBlock | ToolResultBlock | ToolUseBlock;

/** Context reference linking threads to files/folders */
export type ContextReference = {
  __typename?: 'ContextReference';
  addedAt: Scalars['DateTime']['output'];
  /** Entity path or ID */
  entityReference: Scalars['String']['output'];
  /** Type: file, folder, thread */
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ownerUserId: Scalars['String']['output'];
  /** Priority: 1 (high) to 3 (low) */
  priorityTier: Scalars['Int']['output'];
  /** Source: user-added, agent-added, inherited */
  source: Scalars['String']['output'];
  threadId: Scalars['String']['output'];
};

/** Input for creating an agent request */
export type CreateAgentRequestInput = {
  /** Agent type (claude, gpt4, etc) */
  agentType: Scalars['String']['input'];
  /** Request content/prompt */
  content: Scalars['String']['input'];
  /** Thread ID */
  threadId: Scalars['ID']['input'];
  /** Message ID that triggered this request */
  triggeringMessageId: Scalars['ID']['input'];
};

/** Input for creating a new file */
export type CreateFileInput = {
  /** File content */
  content: Scalars['String']['input'];
  /** Folder ID to organize file */
  folderId?: InputMaybe<Scalars['String']['input']>;
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Filename with extension (e.g., 'document.md') */
  name: Scalars['String']['input'];
  /** Thread ID to link file to (creates context reference) */
  threadId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new folder */
export type CreateFolderInput = {
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Folder name */
  name: Scalars['String']['input'];
  /** Parent folder ID (null for root) */
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMessageInput = {
  /** Message content (text or JSON string of ContentBlockDTO[]) */
  content: Scalars['String']['input'];
  /** Idempotency key for deduplication (prevents duplicate messages) */
  idempotencyKey?: InputMaybe<Scalars['UUID']['input']>;
  /** Optional client-provided requestId for agent request (enables optimistic updates) */
  requestId?: InputMaybe<Scalars['UUID']['input']>;
  /** Message role: user, assistant, system */
  role: Scalars['String']['input'];
  /** Thread ID to add message to */
  threadId: Scalars['ID']['input'];
  /** Number of tokens used */
  tokensUsed?: InputMaybe<Scalars['Int']['input']>;
  /** Tool call IDs referenced in this message */
  toolCalls?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Input for creating a shadow entity */
export type CreateShadowEntityInput = {
  /** Source entity ID */
  entityId: Scalars['String']['input'];
  /** Source entity type: file, thread, kg_node */
  entityType: Scalars['String']['input'];
  /** AI-generated summary */
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type CreateThreadInput = {
  branchTitle: Scalars['String']['input'];
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['UUID']['input']>;
  parentThreadId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateThreadWithMessageInput = {
  branchTitle: Scalars['String']['input'];
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Initial message content */
  messageContent: Scalars['String']['input'];
  /** Idempotency key for the initial message (prevents duplicates) */
  messageIdempotencyKey?: InputMaybe<Scalars['UUID']['input']>;
  parentThreadId?: InputMaybe<Scalars['ID']['input']>;
  /** Optional client-provided requestId for agent request (enables optimistic updates) */
  requestId?: InputMaybe<Scalars['UUID']['input']>;
};

/** Workspace file with content and metadata */
export type File = {
  __typename?: 'File';
  /** File content */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Creator: user or agent name */
  createdBy?: Maybe<Scalars['String']['output']>;
  /** Thread ID where file was created (for provenance navigation) */
  createdInThreadId?: Maybe<Scalars['String']['output']>;
  /** File size in bytes */
  fileSize?: Maybe<Scalars['Int']['output']>;
  /** Parent folder ID */
  folderId?: Maybe<Scalars['String']['output']>;
  /** File ID */
  id: Scalars['ID']['output'];
  /** Indexing status: pending, completed, failed */
  indexingStatus: Scalars['String']['output'];
  /** Whether file was AI-generated */
  isAIGenerated: Scalars['Boolean']['output'];
  /** Last edit timestamp */
  lastEditedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Last editor */
  lastEditedBy?: Maybe<Scalars['String']['output']>;
  /** MIME type */
  mimeType?: Maybe<Scalars['String']['output']>;
  /** Filename with extension */
  name: Scalars['String']['output'];
  /** Owner user ID */
  ownerUserId: Scalars['String']['output'];
  /** Full path computed from folder hierarchy + name */
  path: Scalars['String']['output'];
  /** Shadow entity ID for search */
  shadowDomainId?: Maybe<Scalars['String']['output']>;
  /** Source: ai-generated, user-uploaded */
  source: Scalars['String']['output'];
  /** Supabase Storage path for large files */
  storagePath?: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt: Scalars['DateTime']['output'];
  /** Version number for optimistic locking */
  version: Scalars['Int']['output'];
};

/** File search result */
export type FileSearchResult = {
  __typename?: 'FileSearchResult';
  /** Entity type: file */
  entityType: Scalars['String']['output'];
  /** Content excerpt with context */
  excerpt: Scalars['String']['output'];
  /** File ID */
  id: Scalars['ID']['output'];
  /** File path */
  path: Scalars['String']['output'];
  /** Relevance score (0-1) */
  relevance: Scalars['Float']['output'];
};

/** Hierarchical folder for organizing files */
export type Folder = {
  __typename?: 'Folder';
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Folder ID */
  id: Scalars['ID']['output'];
  /** Folder name */
  name: Scalars['String']['output'];
  /** Parent folder ID (null for root folders) */
  parentFolderId?: Maybe<Scalars['String']['output']>;
  /** Computed path from hierarchy */
  path: Scalars['String']['output'];
  /** Last update timestamp */
  updatedAt: Scalars['DateTime']['output'];
  /** Owner user ID */
  userId: Scalars['String']['output'];
};

/** Image content block */
export type ImageBlock = {
  __typename?: 'ImageBlock';
  /** Image source data */
  source: ImageSource;
  /** Block type discriminator */
  type: Scalars['String']['output'];
};

/** Image source data */
export type ImageSource = {
  __typename?: 'ImageSource';
  /** Base64-encoded image data */
  data: Scalars['String']['output'];
  /** MIME type (e.g., image/png) */
  media_type: Scalars['String']['output'];
  /** Image encoding type */
  type: Scalars['String']['output'];
};

export type Message = {
  __typename?: 'Message';
  /** Message content blocks (ContentBlock[] stored as JSONB) */
  content: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  /** Idempotency key for deduplication (prevents duplicate messages) */
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  ownerUserId: Scalars['String']['output'];
  /** Agent request ID (for user messages that trigger agent execution) */
  requestId?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  threadId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  /** Number of tokens used */
  tokensUsed: Scalars['Int']['output'];
  /** Tool call IDs referenced in this message (JSON array) */
  toolCalls: Scalars['JSON']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Add a context reference to a thread */
  addContextReference: ContextReference;
  /** Approve a pending tool call (triggers async execution) */
  approveToolCall: ToolCall;
  /** Consolidate multiple branches into a single file. Returns requestId for subscribing to progress via realtime. */
  consolidateBranches: ConsolidationResult;
  /** Create a new agent request (triggers async execution) */
  createAgentRequest: AgentRequest;
  /** Create a new file */
  createFile: File;
  /** Create a new folder */
  createFolder: Folder;
  /** Create a new message in a thread */
  createMessage: Message;
  /** Create a new shadow entity for semantic search */
  createShadowEntity: ShadowEntity;
  createThread: Thread;
  /** Create thread with initial message and trigger execution (atomic operation) */
  createThreadWithMessage: ThreadWithMessage;
  /** Delete current user account (irreversible) */
  deleteAccount: Scalars['Boolean']['output'];
  /** Delete file */
  deleteFile: Scalars['Boolean']['output'];
  /** Delete folder (must be empty) */
  deleteFolder: Scalars['Boolean']['output'];
  /** Delete a message from a thread */
  deleteMessage: Scalars['Boolean']['output'];
  /** Delete shadow entity (admin/cleanup only - normally persist for history) */
  deleteShadowEntity: Scalars['Boolean']['output'];
  deleteThread: Scalars['Boolean']['output'];
  /** Execute agent request and stream events to database (shares logic with REST endpoint) */
  executeAgentRequest: Scalars['Boolean']['output'];
  /** Reject a pending tool call */
  rejectToolCall: ToolCall;
  /** Remove a context reference from a thread */
  removeContextReference: Scalars['Boolean']['output'];
  /** Update priority of a context reference */
  updateContextReferencePriority: ContextReference;
  /** Update file content with optimistic locking */
  updateFile: File;
  /** Partial file update (rename, move, or edit content) */
  updateFilePartial: File;
  /** Update folder (rename or move) */
  updateFolder: Folder;
  /** Update current user profile */
  updateProfile: User;
  /** Update shadow entity (summary, embedding, metadata) */
  updateShadowEntity?: Maybe<ShadowEntity>;
  updateThread: Thread;
  /** Upload a file via multipart form data */
  uploadFile: File;
};


export type MutationAddContextReferenceArgs = {
  input: AddContextReferenceInput;
};


export type MutationApproveToolCallArgs = {
  input: ApproveToolCallInput;
};


export type MutationConsolidateBranchesArgs = {
  input: ConsolidateBranchesInput;
};


export type MutationCreateAgentRequestArgs = {
  input: CreateAgentRequestInput;
};


export type MutationCreateFileArgs = {
  input: CreateFileInput;
};


export type MutationCreateFolderArgs = {
  input: CreateFolderInput;
};


export type MutationCreateMessageArgs = {
  input: CreateMessageInput;
};


export type MutationCreateShadowEntityArgs = {
  input: CreateShadowEntityInput;
};


export type MutationCreateThreadArgs = {
  input: CreateThreadInput;
};


export type MutationCreateThreadWithMessageArgs = {
  input: CreateThreadWithMessageInput;
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFolderArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMessageArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteShadowEntityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteThreadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExecuteAgentRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationRejectToolCallArgs = {
  input: RejectToolCallInput;
};


export type MutationRemoveContextReferenceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateContextReferencePriorityArgs = {
  id: Scalars['ID']['input'];
  priorityTier: Scalars['Int']['input'];
};


export type MutationUpdateFileArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFileInput;
};


export type MutationUpdateFilePartialArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFilePartialInput;
};


export type MutationUpdateFolderArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFolderInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateShadowEntityArgs = {
  id: Scalars['ID']['input'];
  input: UpdateShadowEntityInput;
};


export type MutationUpdateThreadArgs = {
  id: Scalars['ID']['input'];
  input: UpdateThreadInput;
};


export type MutationUploadFileArgs = {
  file: Scalars['Upload']['input'];
  folderId?: InputMaybe<Scalars['ID']['input']>;
  threadId?: InputMaybe<Scalars['ID']['input']>;
};

export type Query = {
  __typename?: 'Query';
  /** Type-only query to expose ContentBlock types for codegen (not meant to be called) */
  _contentBlockTypes?: Maybe<Array<ContentBlock>>;
  /** Get all execution events for an agent request (for replay on late connection) */
  agentExecutionEvents: Array<AgentExecutionEvent>;
  /** Get execution events since a certain timestamp (for incremental polling) */
  agentExecutionEventsSince: Array<AgentExecutionEvent>;
  /** Get agent request by ID */
  agentRequest?: Maybe<AgentRequest>;
  /** Get all agent requests for a thread */
  agentRequestsByThread: Array<AgentRequest>;
  /** Autocomplete search for quick fuzzy matching of files, folders, and threads */
  autocomplete: Array<AutocompleteItem>;
  /** Get file by ID */
  file?: Maybe<File>;
  /** Get file by path */
  fileByPath?: Maybe<File>;
  /** Get all files for current user */
  files: Array<File>;
  /** Get folder by ID */
  folder?: Maybe<Folder>;
  /** Get all folders for current user */
  folders: Array<Folder>;
  /** Get current user profile */
  me: User;
  /** Get messages for a thread */
  messages: Array<Message>;
  /** Get pending tool calls for a thread */
  pendingToolCalls: Array<ToolCall>;
  /** Get root folders (no parent) for current user */
  rootFolders: Array<Folder>;
  /** Semantic search across files, threads, and concepts */
  search: Array<SearchResult>;
  /** Get all shadow entities for the current user */
  shadowEntities: Array<ShadowEntity>;
  /** Get shadow entities for a source entity (file, thread, kg_node) */
  shadowEntitiesByEntity: Array<ShadowEntity>;
  /** Get shadow entities for a file */
  shadowEntitiesByFile: Array<ShadowEntity>;
  /** Get shadow entity by ID */
  shadowEntity?: Maybe<ShadowEntity>;
  thread?: Maybe<Thread>;
  threads: Array<Thread>;
  /** Get tool call by ID */
  toolCall?: Maybe<ToolCall>;
  /** Get all tool calls for an agent request */
  toolCallsByRequest: Array<ToolCall>;
  /** Get usage events for current user (with optional date range filtering) */
  usageEvents: Array<UsageEvent>;
  /** Get aggregated usage statistics for current user */
  usageStats: UsageStats;
};


export type QueryAgentExecutionEventsArgs = {
  requestId: Scalars['ID']['input'];
};


export type QueryAgentExecutionEventsSinceArgs = {
  requestId: Scalars['ID']['input'];
  timestamp: Scalars['DateTime']['input'];
};


export type QueryAgentRequestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentRequestsByThreadArgs = {
  threadId: Scalars['ID']['input'];
};


export type QueryAutocompleteArgs = {
  input: AutocompleteInput;
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFileByPathArgs = {
  path: Scalars['String']['input'];
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMessagesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  threadId: Scalars['ID']['input'];
};


export type QueryPendingToolCallsArgs = {
  threadId: Scalars['ID']['input'];
};


export type QuerySearchArgs = {
  input: SearchInput;
};


export type QueryShadowEntitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryShadowEntitiesByEntityArgs = {
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
};


export type QueryShadowEntitiesByFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type QueryShadowEntityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryThreadArgs = {
  id: Scalars['ID']['input'];
};


export type QueryToolCallArgs = {
  id: Scalars['ID']['input'];
};


export type QueryToolCallsByRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type QueryUsageEventsArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsageStatsArgs = {
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for rejecting a tool call */
export type RejectToolCallInput = {
  /** Tool call ID */
  id: Scalars['ID']['input'];
  /** Rejection reason */
  reason?: InputMaybe<Scalars['String']['input']>;
};

/** Search input parameters */
export type SearchInput = {
  /** Filter by entity types (file, thread, concept). Default: ["file"] */
  entityTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by file extensions (e.g., ["ts", "md"]) */
  fileTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Max results (default: 10) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Search query */
  query: Scalars['String']['input'];
};

/** Union of all search result types */
export type SearchResult = ConceptSearchResult | FileSearchResult | ThreadSearchResult;

/** Shadow entity for semantic search (embeddings, summaries, metadata) */
export type ShadowEntity = {
  __typename?: 'ShadowEntity';
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Vector embedding for semantic search (768 dimensions) - set by background job */
  embedding?: Maybe<Array<Scalars['Float']['output']>>;
  /** Source entity ID (file, thread, kg_node) */
  entityId: Scalars['String']['output'];
  /** Source entity type: file, thread, kg_node */
  entityType: Scalars['String']['output'];
  /** Shadow entity ID */
  id: Scalars['ID']['output'];
  /** Last update timestamp (embedding, summary, metadata) */
  lastUpdated: Scalars['DateTime']['output'];
  /** Owner user ID */
  ownerUserId: Scalars['String']['output'];
  /** Entity-specific metadata (file structure, thread metadata, etc.) */
  structureMetadata?: Maybe<Scalars['JSON']['output']>;
  /** AI-generated summary of source entity - set by background job */
  summary?: Maybe<Scalars['String']['output']>;
};

/** Plain text content block */
export type TextBlock = {
  __typename?: 'TextBlock';
  /** Text content */
  text: Scalars['String']['output'];
  /** Block type discriminator */
  type: Scalars['String']['output'];
};

export type Thread = {
  __typename?: 'Thread';
  branchTitle?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creator: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Messages in this thread (batched with DataLoader) */
  messages: Array<Message>;
  ownerUserId: Scalars['String']['output'];
  parentThreadId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Thread search result */
export type ThreadSearchResult = {
  __typename?: 'ThreadSearchResult';
  /** Entity type: thread */
  entityType: Scalars['String']['output'];
  /** Content excerpt with context */
  excerpt: Scalars['String']['output'];
  /** Thread ID */
  id: Scalars['ID']['output'];
  /** Relevance score (0-1) */
  relevance: Scalars['Float']['output'];
  /** Thread title */
  title: Scalars['String']['output'];
};

/** Thread with initial message (atomic creation response) */
export type ThreadWithMessage = {
  __typename?: 'ThreadWithMessage';
  message: Message;
  thread: Thread;
};

/** Agent tool call requiring approval */
export type ToolCall = {
  __typename?: 'ToolCall';
  /** Status: pending, approved, rejected, timeout */
  approvalStatus: Scalars['String']['output'];
  /** Tool call ID (Claude toolu_* ID) */
  id: Scalars['ID']['output'];
  /** Owner user ID */
  ownerUserId: Scalars['String']['output'];
  /** Rejection reason if rejected */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** Agent request ID */
  requestId?: Maybe<Scalars['String']['output']>;
  /** Assistant message where tool_use block appears */
  responseMessageId: Scalars['String']['output'];
  /** Number of revisions */
  revisionCount: Scalars['Int']['output'];
  /** Revision history (JSON) */
  revisionHistory: Scalars['JSON']['output'];
  /** Thread ID */
  threadId: Scalars['String']['output'];
  /** Creation timestamp */
  timestamp: Scalars['DateTime']['output'];
  /** Tool input parameters (JSON) */
  toolInput: Scalars['JSON']['output'];
  /** Tool name (e.g., write_file, create_branch) */
  toolName: Scalars['String']['output'];
  /** Tool execution output (JSON) */
  toolOutput?: Maybe<Scalars['JSON']['output']>;
  /** User message that triggered this request */
  triggeringMessageId: Scalars['String']['output'];
};

/** Tool execution result block */
export type ToolResultBlock = {
  __typename?: 'ToolResultBlock';
  /** Tool result content */
  content: Scalars['String']['output'];
  /** Whether this result represents an error */
  is_error?: Maybe<Scalars['Boolean']['output']>;
  /** ID of the tool use this result corresponds to */
  tool_use_id: Scalars['String']['output'];
  /** Block type discriminator */
  type: Scalars['String']['output'];
};

/** Tool invocation request block */
export type ToolUseBlock = {
  __typename?: 'ToolUseBlock';
  /** Tool execution error message */
  error?: Maybe<Scalars['String']['output']>;
  /** Unique tool call ID */
  id: Scalars['ID']['output'];
  /** Tool input parameters */
  input: Scalars['JSON']['output'];
  /** Tool name */
  name: Scalars['String']['output'];
  /** Tool execution result */
  result?: Maybe<Scalars['String']['output']>;
  /** Tool execution status */
  status?: Maybe<Scalars['String']['output']>;
  /** Block type discriminator */
  type: Scalars['String']['output'];
};

/** Input for updating file content */
export type UpdateFileInput = {
  /** New file content */
  content: Scalars['String']['input'];
  /** Current version for optimistic locking */
  version?: InputMaybe<Scalars['Int']['input']>;
};

/** Input for partial file update (rename, move, or edit) */
export type UpdateFilePartialInput = {
  /** New content */
  content?: InputMaybe<Scalars['String']['input']>;
  /** New folder ID (move) */
  folderId?: InputMaybe<Scalars['String']['input']>;
  /** New filename (rename) */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating folder */
export type UpdateFolderInput = {
  /** New folder name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New parent folder ID (null for root) */
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating shadow entity (summary, embedding, metadata) */
export type UpdateShadowEntityInput = {
  /** Updated embedding (768 dimensions) */
  embedding?: InputMaybe<Array<Scalars['Float']['input']>>;
  /** Updated summary */
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateThreadInput = {
  /** Array of branch IDs to hide from context */
  blacklistedBranches?: InputMaybe<Array<Scalars['String']['input']>>;
  branchTitle?: InputMaybe<Scalars['String']['input']>;
  parentThreadId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for updating user profile */
export type UpdateUserInput = {
  /** New first name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** New last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
};

/** Usage event for billing and analytics tracking */
export type UsageEvent = {
  __typename?: 'UsageEvent';
  /** Cost in dollars */
  cost?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Event type (e.g., agent_request, file_upload) */
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Event metadata (JSON object as string) */
  metadata?: Maybe<Scalars['String']['output']>;
  /** Number of tokens used (for AI operations) */
  tokensUsed?: Maybe<Scalars['Int']['output']>;
  /** User ID this event belongs to */
  userId: Scalars['String']['output'];
};

/** Aggregated usage statistics */
export type UsageStats = {
  __typename?: 'UsageStats';
  /** Total cost in dollars */
  totalCost: Scalars['Float']['output'];
  /** Total tokens used */
  totalTokens: Scalars['Int']['output'];
};

/** User profile with account information */
export type User = {
  __typename?: 'User';
  /** Profile creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** User first name */
  firstName: Scalars['String']['output'];
  /** Profile ID */
  id: Scalars['ID']['output'];
  /** User last name */
  lastName: Scalars['String']['output'];
  /** Subscription plan (free, pro, enterprise) */
  planType: Scalars['String']['output'];
  /** Subscription status (active, cancelled, expired) */
  subscriptionStatus: Scalars['String']['output'];
  /** Last update timestamp */
  updatedAt: Scalars['DateTime']['output'];
  /** Current usage count */
  usageCount: Scalars['Int']['output'];
  /** Auth user ID */
  userId: Scalars['String']['output'];
};
