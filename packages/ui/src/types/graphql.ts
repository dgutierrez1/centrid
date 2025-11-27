export type Maybe<T> = T;
export type InputMaybe<T> = T;
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
  UUID: { input: any; output: any; }
  Upload: { input: File; output: File; }
};

export type AddContextReferenceInput = {
  /** Entity path or ID */
  entityReference: Scalars['String']['input'];
  /** Type: file, folder, thread */
  entityType: Scalars['String']['input'];
  /** Priority: 1 (high) to 3 (low) */
  priorityTier: InputMaybe<Scalars['Int']['input']>;
  /** Source: user-added, agent-added, inherited */
  source: Scalars['String']['input'];
  /** Thread ID to add reference to */
  threadId: Scalars['ID']['input'];
};

/** Real-time execution events for agent requests (text_chunk, tool_call, completion, error) */
export type AgentExecutionEvent = {
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Event payload (JSON object) */
  data: Maybe<Scalars['JSON']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  /** Agent request ID this event belongs to */
  requestId: Maybe<Scalars['String']['output']>;
  /** Event type: text_chunk, tool_call, completion, error */
  type: Maybe<Scalars['String']['output']>;
};

/** AI agent execution request */
export type AgentRequest = {
  /** Agent type (e.g., claude, gpt4) */
  agentType: Maybe<Scalars['String']['output']>;
  /** Checkpoint state for tool approval resume (JSON) */
  checkpoint: Maybe<Scalars['JSON']['output']>;
  /** Completion timestamp */
  completedAt: Maybe<Scalars['DateTime']['output']>;
  /** Request content/prompt */
  content: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Request ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Progress (0.0 - 1.0) */
  progress: Maybe<Scalars['Float']['output']>;
  /** Response message ID */
  responseMessageId: Maybe<Scalars['String']['output']>;
  /** Execution results (JSON) */
  results: Maybe<Scalars['JSON']['output']>;
  /** Status: pending, in_progress, completed, failed */
  status: Maybe<Scalars['String']['output']>;
  /** Thread ID */
  threadId: Maybe<Scalars['String']['output']>;
  /** Total tokens used */
  tokenCost: Maybe<Scalars['Int']['output']>;
  /** Triggering message ID */
  triggeringMessageId: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  userId: Maybe<Scalars['String']['output']>;
};

/** Input for approving a tool call */
export type ApproveToolCallInput = {
  /** Tool call ID */
  id: Scalars['ID']['input'];
};

/** Autocomplete input parameters for quick fuzzy search */
export type AutocompleteInput = {
  /** Filter by entity type: files, folders, threads. Default: all */
  entityType: InputMaybe<Scalars['String']['input']>;
  /** Max results (default: 10) */
  limit: InputMaybe<Scalars['Int']['input']>;
  /** Autocomplete query (fuzzy matching) */
  query: Scalars['String']['input'];
};

/** Autocomplete result for fuzzy matching */
export type AutocompleteItem = {
  branchId: Maybe<Scalars['String']['output']>;
  branchName: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  lastModified: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  path: Maybe<Scalars['String']['output']>;
  relevanceScore: Maybe<Scalars['Float']['output']>;
  /** Entity type: file, folder, thread */
  type: Maybe<Scalars['String']['output']>;
};

/** Concept search result from knowledge graph */
export type ConceptSearchResult = {
  /** Concept name */
  conceptName: Maybe<Scalars['String']['output']>;
  /** Entity type: concept */
  entityType: Maybe<Scalars['String']['output']>;
  /** Concept description */
  excerpt: Maybe<Scalars['String']['output']>;
  /** Concept ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Relevance score (0-1) */
  relevance: Maybe<Scalars['Float']['output']>;
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
  /** ID of the file that will be created (permanent ID) */
  fileId: Maybe<Scalars['ID']['output']>;
  /** Agent request ID for subscribing to progress events */
  requestId: Maybe<Scalars['ID']['output']>;
  /** Status: pending, in_progress, completed, failed */
  status: Maybe<Scalars['String']['output']>;
};

/** Message content block (text, tool use, tool result, or image) */
export type ContentBlock = ImageBlock | TextBlock | ToolResultBlock | ToolUseBlock;

/** Context reference linking threads to files/folders */
export type ContextReference = {
  addedAt: Maybe<Scalars['DateTime']['output']>;
  /** Entity path or ID */
  entityReference: Maybe<Scalars['String']['output']>;
  /** Type: file, folder, thread */
  entityType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  ownerUserId: Maybe<Scalars['String']['output']>;
  /** Priority: 1 (high) to 3 (low) */
  priorityTier: Maybe<Scalars['Int']['output']>;
  /** Source: user-added, agent-added, inherited */
  source: Maybe<Scalars['String']['output']>;
  threadId: Maybe<Scalars['String']['output']>;
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
  folderId: InputMaybe<Scalars['String']['input']>;
  /** Optional client-provided UUID (for optimistic updates) */
  id: InputMaybe<Scalars['UUID']['input']>;
  /** Filename with extension (e.g., 'document.md') */
  name: Scalars['String']['input'];
  /** Thread ID to link file to (creates context reference) */
  threadId: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new folder */
export type CreateFolderInput = {
  /** Optional client-provided UUID (for optimistic updates) */
  id: InputMaybe<Scalars['UUID']['input']>;
  /** Folder name */
  name: Scalars['String']['input'];
  /** Parent folder ID (null for root) */
  parentFolderId: InputMaybe<Scalars['String']['input']>;
};

export type CreateMessageInput = {
  /** Message content (text or JSON string of ContentBlockDTO[]) */
  content: Scalars['String']['input'];
  /** Idempotency key for deduplication (prevents duplicate messages) */
  idempotencyKey: InputMaybe<Scalars['UUID']['input']>;
  /** Optional client-provided requestId for agent request (enables optimistic updates) */
  requestId: InputMaybe<Scalars['UUID']['input']>;
  /** Message role: user, assistant, system */
  role: Scalars['String']['input'];
  /** Thread ID to add message to */
  threadId: Scalars['ID']['input'];
  /** Number of tokens used */
  tokensUsed: InputMaybe<Scalars['Int']['input']>;
  /** Tool call IDs referenced in this message */
  toolCalls: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Input for creating a shadow entity */
export type CreateShadowEntityInput = {
  /** Source entity ID */
  entityId: Scalars['String']['input'];
  /** Source entity type: file, thread, kg_node */
  entityType: Scalars['String']['input'];
  /** AI-generated summary */
  summary: InputMaybe<Scalars['String']['input']>;
};

export type CreateThreadInput = {
  branchTitle: Scalars['String']['input'];
  /** Optional client-provided UUID (for optimistic updates) */
  id: InputMaybe<Scalars['UUID']['input']>;
  parentThreadId: InputMaybe<Scalars['ID']['input']>;
};

export type CreateThreadWithMessageInput = {
  branchTitle: Scalars['String']['input'];
  /** Optional client-provided UUID (for optimistic updates) */
  id: InputMaybe<Scalars['UUID']['input']>;
  /** Initial message content */
  messageContent: Scalars['String']['input'];
  /** Idempotency key for the initial message (prevents duplicates) */
  messageIdempotencyKey: InputMaybe<Scalars['UUID']['input']>;
  parentThreadId: InputMaybe<Scalars['ID']['input']>;
  /** Optional client-provided requestId for agent request (enables optimistic updates) */
  requestId: InputMaybe<Scalars['UUID']['input']>;
};

/** Workspace file with content and metadata */
export type File = {
  /** File content */
  content: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Creator: user or agent name */
  createdBy: Maybe<Scalars['String']['output']>;
  /** Thread ID where file was created (for provenance navigation) */
  createdInThreadId: Maybe<Scalars['String']['output']>;
  /** File size in bytes */
  fileSize: Maybe<Scalars['Int']['output']>;
  /** Parent folder ID */
  folderId: Maybe<Scalars['String']['output']>;
  /** File ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Indexing status: pending, completed, failed */
  indexingStatus: Maybe<Scalars['String']['output']>;
  /** Whether file was AI-generated */
  isAIGenerated: Maybe<Scalars['Boolean']['output']>;
  /** Last edit timestamp */
  lastEditedAt: Maybe<Scalars['DateTime']['output']>;
  /** Last editor */
  lastEditedBy: Maybe<Scalars['String']['output']>;
  /** MIME type */
  mimeType: Maybe<Scalars['String']['output']>;
  /** Filename with extension */
  name: Maybe<Scalars['String']['output']>;
  /** Owner user ID */
  ownerUserId: Maybe<Scalars['String']['output']>;
  /** Full path computed from folder hierarchy + name */
  path: Maybe<Scalars['String']['output']>;
  /** Shadow entity ID for search */
  shadowDomainId: Maybe<Scalars['String']['output']>;
  /** Source: ai-generated, user-uploaded */
  source: Maybe<Scalars['String']['output']>;
  /** Supabase Storage path for large files */
  storagePath: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** Version number for optimistic locking */
  version: Maybe<Scalars['Int']['output']>;
};

/** File search result */
export type FileSearchResult = {
  /** Entity type: file */
  entityType: Maybe<Scalars['String']['output']>;
  /** Content excerpt with context */
  excerpt: Maybe<Scalars['String']['output']>;
  /** File ID */
  id: Maybe<Scalars['ID']['output']>;
  /** File path */
  path: Maybe<Scalars['String']['output']>;
  /** Relevance score (0-1) */
  relevance: Maybe<Scalars['Float']['output']>;
};

/** Hierarchical folder for organizing files */
export type Folder = {
  /** Creation timestamp */
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Folder ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Folder name */
  name: Maybe<Scalars['String']['output']>;
  /** Parent folder ID (null for root folders) */
  parentFolderId: Maybe<Scalars['String']['output']>;
  /** Computed path from hierarchy */
  path: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  userId: Maybe<Scalars['String']['output']>;
};

/** Image content block */
export type ImageBlock = {
  /** Image source data */
  source: Maybe<ImageSource>;
  /** Block type discriminator */
  type: Maybe<Scalars['String']['output']>;
};

/** Image source data */
export type ImageSource = {
  /** Base64-encoded image data */
  data: Maybe<Scalars['String']['output']>;
  /** MIME type (e.g., image/png) */
  media_type: Maybe<Scalars['String']['output']>;
  /** Image encoding type */
  type: Maybe<Scalars['String']['output']>;
};

export type Message = {
  /** Message content blocks (ContentBlock[] stored as JSONB) */
  content: Maybe<Scalars['JSON']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  /** Idempotency key for deduplication (prevents duplicate messages) */
  idempotencyKey: Maybe<Scalars['String']['output']>;
  ownerUserId: Maybe<Scalars['String']['output']>;
  /** Agent request ID (for user messages that trigger agent execution) */
  requestId: Maybe<Scalars['String']['output']>;
  role: Maybe<Scalars['String']['output']>;
  threadId: Maybe<Scalars['String']['output']>;
  timestamp: Maybe<Scalars['DateTime']['output']>;
  /** Number of tokens used */
  tokensUsed: Maybe<Scalars['Int']['output']>;
  /** Tool call IDs referenced in this message (JSON array) */
  toolCalls: Maybe<Scalars['JSON']['output']>;
};

export type Mutation = {
  /** Add a context reference to a thread */
  addContextReference: Maybe<ContextReference>;
  /** Approve a pending tool call (triggers async execution) */
  approveToolCall: Maybe<ToolCall>;
  /** Consolidate multiple branches into a single file. Returns requestId for subscribing to progress via realtime. */
  consolidateBranches: Maybe<ConsolidationResult>;
  /** Create a new agent request (triggers async execution) */
  createAgentRequest: Maybe<AgentRequest>;
  /** Create a new file */
  createFile: Maybe<File>;
  /** Create a new folder */
  createFolder: Maybe<Folder>;
  /** Create a new message in a thread */
  createMessage: Maybe<Message>;
  /** Create a new shadow entity for semantic search */
  createShadowEntity: Maybe<ShadowEntity>;
  createThread: Maybe<Thread>;
  /** Create thread with initial message and trigger execution (atomic operation) */
  createThreadWithMessage: Maybe<ThreadWithMessage>;
  /** Delete current user account (irreversible) */
  deleteAccount: Maybe<Scalars['Boolean']['output']>;
  /** Delete file */
  deleteFile: Maybe<Scalars['Boolean']['output']>;
  /** Delete folder (must be empty) */
  deleteFolder: Maybe<Scalars['Boolean']['output']>;
  /** Delete a message from a thread */
  deleteMessage: Maybe<Scalars['Boolean']['output']>;
  /** Delete shadow entity (admin/cleanup only - normally persist for history) */
  deleteShadowEntity: Maybe<Scalars['Boolean']['output']>;
  deleteThread: Maybe<Scalars['Boolean']['output']>;
  /** Execute agent request and stream events to database (shares logic with REST endpoint) */
  executeAgentRequest: Maybe<Scalars['Boolean']['output']>;
  /** Reject a pending tool call */
  rejectToolCall: Maybe<ToolCall>;
  /** Remove a context reference from a thread */
  removeContextReference: Maybe<Scalars['Boolean']['output']>;
  /** Update priority of a context reference */
  updateContextReferencePriority: Maybe<ContextReference>;
  /** Update file content with optimistic locking */
  updateFile: Maybe<File>;
  /** Partial file update (rename, move, or edit content) */
  updateFilePartial: Maybe<File>;
  /** Update folder (rename or move) */
  updateFolder: Maybe<Folder>;
  /** Update current user profile */
  updateProfile: Maybe<User>;
  /** Update shadow entity (summary, embedding, metadata) */
  updateShadowEntity: Maybe<ShadowEntity>;
  updateThread: Maybe<Thread>;
  /** Upload a file via multipart form data */
  uploadFile: Maybe<File>;
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
  folderId: InputMaybe<Scalars['ID']['input']>;
  threadId: InputMaybe<Scalars['ID']['input']>;
};

export type Query = {
  /** Type-only query to expose ContentBlock types for codegen (not meant to be called) */
  _contentBlockTypes: Maybe<Array<ContentBlock>>;
  /** Get all execution events for an agent request (for replay on late connection) */
  agentExecutionEvents: Maybe<Array<AgentExecutionEvent>>;
  /** Get execution events since a certain timestamp (for incremental polling) */
  agentExecutionEventsSince: Maybe<Array<AgentExecutionEvent>>;
  /** Get agent request by ID */
  agentRequest: Maybe<AgentRequest>;
  /** Get all agent requests for a thread */
  agentRequestsByThread: Maybe<Array<AgentRequest>>;
  /** Autocomplete search for quick fuzzy matching of files, folders, and threads */
  autocomplete: Maybe<Array<AutocompleteItem>>;
  /** Get file by ID */
  file: Maybe<File>;
  /** Get file by path */
  fileByPath: Maybe<File>;
  /** Get all files for current user */
  files: Maybe<Array<File>>;
  /** Get folder by ID */
  folder: Maybe<Folder>;
  /** Get all folders for current user */
  folders: Maybe<Array<Folder>>;
  /** Get current user profile */
  me: Maybe<User>;
  /** Get messages for a thread */
  messages: Maybe<Array<Message>>;
  /** Get pending tool calls for a thread */
  pendingToolCalls: Maybe<Array<ToolCall>>;
  /** Get root folders (no parent) for current user */
  rootFolders: Maybe<Array<Folder>>;
  /** Semantic search across files, threads, and concepts */
  search: Maybe<Array<SearchResult>>;
  /** Get all shadow entities for the current user */
  shadowEntities: Maybe<Array<ShadowEntity>>;
  /** Get shadow entities for a source entity (file, thread, kg_node) */
  shadowEntitiesByEntity: Maybe<Array<ShadowEntity>>;
  /** Get shadow entities for a file */
  shadowEntitiesByFile: Maybe<Array<ShadowEntity>>;
  /** Get shadow entity by ID */
  shadowEntity: Maybe<ShadowEntity>;
  thread: Maybe<Thread>;
  threads: Maybe<Array<Thread>>;
  /** Get tool call by ID */
  toolCall: Maybe<ToolCall>;
  /** Get all tool calls for an agent request */
  toolCallsByRequest: Maybe<Array<ToolCall>>;
  /** Get usage events for current user (with optional date range filtering) */
  usageEvents: Maybe<Array<UsageEvent>>;
  /** Get aggregated usage statistics for current user */
  usageStats: Maybe<UsageStats>;
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
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
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
  endDate: InputMaybe<Scalars['DateTime']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  startDate: InputMaybe<Scalars['DateTime']['input']>;
  userId: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsageStatsArgs = {
  startDate: InputMaybe<Scalars['DateTime']['input']>;
  userId: InputMaybe<Scalars['ID']['input']>;
};

/** Input for rejecting a tool call */
export type RejectToolCallInput = {
  /** Tool call ID */
  id: Scalars['ID']['input'];
  /** Rejection reason */
  reason: InputMaybe<Scalars['String']['input']>;
};

/** Search input parameters */
export type SearchInput = {
  /** Filter by entity types (file, thread, concept). Default: ["file"] */
  entityTypes: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by file extensions (e.g., ["ts", "md"]) */
  fileTypes: InputMaybe<Array<Scalars['String']['input']>>;
  /** Max results (default: 10) */
  limit: InputMaybe<Scalars['Int']['input']>;
  /** Search query */
  query: Scalars['String']['input'];
};

/** Union of all search result types */
export type SearchResult = ConceptSearchResult | FileSearchResult | ThreadSearchResult;

/** Shadow entity for semantic search (embeddings, summaries, metadata) */
export type ShadowEntity = {
  /** Creation timestamp */
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Vector embedding for semantic search (768 dimensions) */
  embedding: Array<Scalars['Float']['output']>;
  /** Source entity ID (file, thread, kg_node) */
  entityId: Maybe<Scalars['String']['output']>;
  /** Source entity type: file, thread, kg_node */
  entityType: Maybe<Scalars['String']['output']>;
  /** Shadow entity ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Last update timestamp (embedding, summary, metadata) */
  lastUpdated: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  ownerUserId: Maybe<Scalars['String']['output']>;
  /** Entity-specific metadata (file structure, thread metadata, etc.) */
  structureMetadata: Maybe<Scalars['JSON']['output']>;
  /** AI-generated summary of source entity */
  summary: Scalars['String']['output'];
};

/** Plain text content block */
export type TextBlock = {
  /** Text content */
  text: Maybe<Scalars['String']['output']>;
  /** Block type discriminator */
  type: Maybe<Scalars['String']['output']>;
};

export type Thread = {
  branchTitle: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  creator: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  /** Messages in this thread (batched with DataLoader) */
  messages: Maybe<Array<Message>>;
  ownerUserId: Maybe<Scalars['String']['output']>;
  parentThreadId: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

/** Thread search result */
export type ThreadSearchResult = {
  /** Entity type: thread */
  entityType: Maybe<Scalars['String']['output']>;
  /** Content excerpt with context */
  excerpt: Maybe<Scalars['String']['output']>;
  /** Thread ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Relevance score (0-1) */
  relevance: Maybe<Scalars['Float']['output']>;
  /** Thread title */
  title: Maybe<Scalars['String']['output']>;
};

/** Thread with initial message (atomic creation response) */
export type ThreadWithMessage = {
  message: Maybe<Message>;
  thread: Maybe<Thread>;
};

/** Agent tool call requiring approval */
export type ToolCall = {
  /** Status: pending, approved, rejected, timeout */
  approvalStatus: Maybe<Scalars['String']['output']>;
  /** Tool call ID (Claude toolu_* ID) */
  id: Maybe<Scalars['ID']['output']>;
  /** Triggering message ID */
  messageId: Maybe<Scalars['String']['output']>;
  /** Owner user ID */
  ownerUserId: Maybe<Scalars['String']['output']>;
  /** Rejection reason if rejected */
  rejectionReason: Maybe<Scalars['String']['output']>;
  /** Agent request ID */
  requestId: Maybe<Scalars['String']['output']>;
  /** Number of revisions */
  revisionCount: Maybe<Scalars['Int']['output']>;
  /** Revision history (JSON) */
  revisionHistory: Maybe<Scalars['JSON']['output']>;
  /** Thread ID */
  threadId: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  timestamp: Maybe<Scalars['DateTime']['output']>;
  /** Tool input parameters (JSON) */
  toolInput: Maybe<Scalars['JSON']['output']>;
  /** Tool name (e.g., write_file, create_branch) */
  toolName: Maybe<Scalars['String']['output']>;
  /** Tool execution output (JSON) */
  toolOutput: Maybe<Scalars['JSON']['output']>;
};

/** Tool execution result block */
export type ToolResultBlock = {
  /** Tool result content */
  content: Maybe<Scalars['String']['output']>;
  /** Whether this result represents an error */
  is_error: Maybe<Scalars['Boolean']['output']>;
  /** ID of the tool use this result corresponds to */
  tool_use_id: Maybe<Scalars['String']['output']>;
  /** Block type discriminator */
  type: Maybe<Scalars['String']['output']>;
};

/** Tool invocation request block */
export type ToolUseBlock = {
  /** Tool execution error message */
  error: Maybe<Scalars['String']['output']>;
  /** Unique tool call ID */
  id: Maybe<Scalars['ID']['output']>;
  /** Tool input parameters */
  input: Maybe<Scalars['JSON']['output']>;
  /** Tool name */
  name: Maybe<Scalars['String']['output']>;
  /** Tool execution result */
  result: Maybe<Scalars['String']['output']>;
  /** Tool execution status */
  status: Maybe<Scalars['String']['output']>;
  /** Block type discriminator */
  type: Maybe<Scalars['String']['output']>;
};

/** Input for updating file content */
export type UpdateFileInput = {
  /** New file content */
  content: Scalars['String']['input'];
  /** Current version for optimistic locking */
  version: InputMaybe<Scalars['Int']['input']>;
};

/** Input for partial file update (rename, move, or edit) */
export type UpdateFilePartialInput = {
  /** New content */
  content: InputMaybe<Scalars['String']['input']>;
  /** New folder ID (move) */
  folderId: InputMaybe<Scalars['String']['input']>;
  /** New filename (rename) */
  name: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating folder */
export type UpdateFolderInput = {
  /** New folder name */
  name: InputMaybe<Scalars['String']['input']>;
  /** New parent folder ID (null for root) */
  parentFolderId: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating shadow entity (summary, embedding, metadata) */
export type UpdateShadowEntityInput = {
  /** Updated embedding (768 dimensions) */
  embedding: InputMaybe<Array<Scalars['Float']['input']>>;
  /** Updated summary */
  summary: InputMaybe<Scalars['String']['input']>;
};

export type UpdateThreadInput = {
  /** Array of branch IDs to hide from context */
  blacklistedBranches: InputMaybe<Array<Scalars['String']['input']>>;
  branchTitle: InputMaybe<Scalars['String']['input']>;
  parentThreadId: InputMaybe<Scalars['ID']['input']>;
};

/** Input for updating user profile */
export type UpdateUserInput = {
  /** New first name */
  firstName: InputMaybe<Scalars['String']['input']>;
  /** New last name */
  lastName: InputMaybe<Scalars['String']['input']>;
};

/** Usage event for billing and analytics tracking */
export type UsageEvent = {
  /** Cost in dollars */
  cost: Maybe<Scalars['Float']['output']>;
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** Event type (e.g., agent_request, file_upload) */
  eventType: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['ID']['output']>;
  /** Event metadata (JSON object as string) */
  metadata: Maybe<Scalars['String']['output']>;
  /** Number of tokens used (for AI operations) */
  tokensUsed: Maybe<Scalars['Int']['output']>;
  /** User ID this event belongs to */
  userId: Maybe<Scalars['String']['output']>;
};

/** Aggregated usage statistics */
export type UsageStats = {
  /** Total cost in dollars */
  totalCost: Maybe<Scalars['Float']['output']>;
  /** Total tokens used */
  totalTokens: Maybe<Scalars['Int']['output']>;
};

/** User profile with account information */
export type User = {
  /** Profile creation timestamp */
  createdAt: Maybe<Scalars['DateTime']['output']>;
  /** User first name */
  firstName: Maybe<Scalars['String']['output']>;
  /** Profile ID */
  id: Maybe<Scalars['ID']['output']>;
  /** User last name */
  lastName: Maybe<Scalars['String']['output']>;
  /** Subscription plan (free, pro, enterprise) */
  planType: Maybe<Scalars['String']['output']>;
  /** Subscription status (active, cancelled, expired) */
  subscriptionStatus: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** Current usage count */
  usageCount: Maybe<Scalars['Int']['output']>;
  /** Auth user ID */
  userId: Maybe<Scalars['String']['output']>;
};
