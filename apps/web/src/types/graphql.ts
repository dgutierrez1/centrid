import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
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

export type AgentRequestFieldsFragment = { __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null };

export type AgentRequestWithEventsFragment = { __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null };

export type ContextReferenceFieldsFragment = { __typename?: 'ContextReference', id: string, threadId: string, ownerUserId: string, entityType: string, entityReference: string, source: string, priorityTier: number, addedAt: string };

export type FileFieldsFragment = { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string };

export type FolderFieldsFragment = { __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string };

export type MessageFieldsFragment = { __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number };

export type ThreadFieldsFragment = { __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> };

export type ToolCallFieldsFragment = { __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string };

export type UserFieldsFragment = { __typename?: 'User', id: string, userId: string, firstName: string, lastName: string, planType: string, usageCount: number, subscriptionStatus: string, createdAt: string, updatedAt: string };

export type CreateAgentRequestMutationVariables = Exact<{
  threadId: Scalars['ID']['input'];
  triggeringMessageId: Scalars['ID']['input'];
  agentType: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;


export type CreateAgentRequestMutation = { __typename?: 'Mutation', createAgentRequest: { __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null } };

export type CreateFileMutationVariables = Exact<{
  id?: InputMaybe<Scalars['UUID']['input']>;
  name: Scalars['String']['input'];
  content: Scalars['String']['input'];
  threadId?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateFileMutation = { __typename?: 'Mutation', createFile: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } };

export type UploadFileMutationVariables = Exact<{
  file: Scalars['Upload']['input'];
  folderId?: InputMaybe<Scalars['ID']['input']>;
  threadId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type UploadFileMutation = { __typename?: 'Mutation', uploadFile: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } };

export type UpdateFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  version?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpdateFileMutation = { __typename?: 'Mutation', updateFile: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } };

export type UpdateFilePartialMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateFilePartialMutation = { __typename?: 'Mutation', updateFilePartial: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } };

export type DeleteFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFileMutation = { __typename?: 'Mutation', deleteFile: boolean };

export type CreateFolderMutationVariables = Exact<{
  id?: InputMaybe<Scalars['UUID']['input']>;
  name: Scalars['String']['input'];
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateFolderMutation = { __typename?: 'Mutation', createFolder: { __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string } };

export type UpdateFolderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateFolderMutation = { __typename?: 'Mutation', updateFolder: { __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string } };

export type DeleteFolderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFolderMutation = { __typename?: 'Mutation', deleteFolder: boolean };

export type CreateMessageMutationVariables = Exact<{
  input: CreateMessageInput;
}>;


export type CreateMessageMutation = { __typename?: 'Mutation', createMessage: { __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number } };

export type DeleteMessageMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMessageMutation = { __typename?: 'Mutation', deleteMessage: boolean };

export type CreateThreadMutationVariables = Exact<{
  input: CreateThreadInput;
}>;


export type CreateThreadMutation = { __typename?: 'Mutation', createThread: { __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> } };

export type CreateThreadWithMessageMutationVariables = Exact<{
  input: CreateThreadWithMessageInput;
}>;


export type CreateThreadWithMessageMutation = { __typename?: 'Mutation', createThreadWithMessage: { __typename?: 'ThreadWithMessage', thread: { __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> }, message: { __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number } } };

export type UpdateThreadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateThreadInput;
}>;


export type UpdateThreadMutation = { __typename?: 'Mutation', updateThread: { __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> } };

export type DeleteThreadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteThreadMutation = { __typename?: 'Mutation', deleteThread: boolean };

export type AddContextReferenceMutationVariables = Exact<{
  input: AddContextReferenceInput;
}>;


export type AddContextReferenceMutation = { __typename?: 'Mutation', addContextReference: { __typename?: 'ContextReference', id: string, threadId: string, ownerUserId: string, entityType: string, entityReference: string, source: string, priorityTier: number, addedAt: string } };

export type RemoveContextReferenceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveContextReferenceMutation = { __typename?: 'Mutation', removeContextReference: boolean };

export type UpdateContextReferencePriorityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  priorityTier: Scalars['Int']['input'];
}>;


export type UpdateContextReferencePriorityMutation = { __typename?: 'Mutation', updateContextReferencePriority: { __typename?: 'ContextReference', id: string, threadId: string, ownerUserId: string, entityType: string, entityReference: string, source: string, priorityTier: number, addedAt: string } };

export type ConsolidateBranchesMutationVariables = Exact<{
  input: ConsolidateBranchesInput;
}>;


export type ConsolidateBranchesMutation = { __typename?: 'Mutation', consolidateBranches: { __typename?: 'ConsolidationResult', requestId: string, fileId: string, status: string } };

export type ApproveToolCallMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveToolCallMutation = { __typename?: 'Mutation', approveToolCall: { __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string } };

export type RejectToolCallMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type RejectToolCallMutation = { __typename?: 'Mutation', rejectToolCall: { __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string } };

export type UpdateProfileMutationVariables = Exact<{
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', id: string, userId: string, firstName: string, lastName: string, planType: string, usageCount: number, subscriptionStatus: string, createdAt: string, updatedAt: string } };

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAccountMutation = { __typename?: 'Mutation', deleteAccount: boolean };

export type GetAgentRequestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAgentRequestQuery = { __typename?: 'Query', agentRequest?: { __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null } | null };

export type GetAgentRequestWithEventsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAgentRequestWithEventsQuery = { __typename?: 'Query', agentRequest?: { __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null } | null };

export type ListAgentRequestsByThreadQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
}>;


export type ListAgentRequestsByThreadQuery = { __typename?: 'Query', agentRequestsByThread: Array<{ __typename?: 'AgentRequest', id: string, userId: string, threadId: string, triggeringMessageId: string, responseMessageId?: string | null, agentType: string, content: string, status: string, progress: number, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt: string, updatedAt: string, completedAt?: string | null }> };

export type GetAgentExecutionEventsQueryVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type GetAgentExecutionEventsQuery = { __typename?: 'Query', agentExecutionEvents: Array<{ __typename?: 'AgentExecutionEvent', id: string, requestId: string, type: string, data: unknown, createdAt: string }> };

export type GetFileQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFileQuery = { __typename?: 'Query', file?: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } | null };

export type ListAllFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAllFilesQuery = { __typename?: 'Query', files: Array<{ __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string }> };

export type GetFileByPathQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type GetFileByPathQuery = { __typename?: 'Query', fileByPath?: { __typename?: 'File', id: string, ownerUserId: string, path: string, name: string, content: string, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus: string, source: string, isAIGenerated: boolean, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, createdInThreadId?: string | null, version: number, createdAt: string, updatedAt: string } | null };

export type GetFolderQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFolderQuery = { __typename?: 'Query', folder?: { __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string } | null };

export type GetFolderWithChildrenQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFolderWithChildrenQuery = { __typename?: 'Query', folder?: { __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string } | null };

export type ListFoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListFoldersQuery = { __typename?: 'Query', folders: Array<{ __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string }> };

export type ListRootFoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRootFoldersQuery = { __typename?: 'Query', rootFolders: Array<{ __typename?: 'Folder', id: string, userId: string, name: string, parentFolderId?: string | null, path: string, createdAt: string, updatedAt: string }> };

export type GetMessagesQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMessagesQuery = { __typename?: 'Query', messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> };

export type SearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  fileTypes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  entityTypes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search: Array<
    | { __typename?: 'ConceptSearchResult', id: string, conceptName: string, excerpt: string, relevance: number, entityType: string }
    | { __typename?: 'FileSearchResult', id: string, path: string, excerpt: string, relevance: number, entityType: string }
    | { __typename?: 'ThreadSearchResult', id: string, title: string, excerpt: string, relevance: number, entityType: string }
  > };

export type AutocompleteQueryVariables = Exact<{
  query: Scalars['String']['input'];
  entityType?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AutocompleteQuery = { __typename?: 'Query', autocomplete: Array<{ __typename?: 'AutocompleteItem', id: string, name: string, path: string, type: string, branchName?: string | null, branchId?: string | null, relevanceScore?: number | null, lastModified?: string | null }> };

export type GetThreadQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetThreadQuery = { __typename?: 'Query', thread?: { __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> } | null };

export type ListAllThreadsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAllThreadsQuery = { __typename?: 'Query', threads: Array<{ __typename?: 'Thread', id: string, branchTitle?: string | null, parentThreadId?: string | null, creator: string, ownerUserId: string, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'Message', id: string, threadId: string, ownerUserId: string, role: string, content: unknown, timestamp: string, requestId?: string | null, toolCalls: unknown, tokensUsed: number }> }> };

export type GetToolCallQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetToolCallQuery = { __typename?: 'Query', toolCall?: { __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string } | null };

export type ListPendingToolCallsQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
}>;


export type ListPendingToolCallsQuery = { __typename?: 'Query', pendingToolCalls: Array<{ __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string }> };

export type ListToolCallsByRequestQueryVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type ListToolCallsByRequestQuery = { __typename?: 'Query', toolCallsByRequest: Array<{ __typename?: 'ToolCall', id: string, triggeringMessageId: string, responseMessageId: string, threadId: string, ownerUserId: string, toolName: string, toolInput: unknown, approvalStatus: string, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount: number, revisionHistory: unknown, timestamp: string }> };

export type ListUsageEventsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListUsageEventsQuery = { __typename?: 'Query', usageEvents: Array<{ __typename?: 'UsageEvent', id: string, userId: string, eventType: string, tokensUsed?: number | null, cost?: number | null, metadata?: string | null, createdAt: string }> };

export type GetUsageStatsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetUsageStatsQuery = { __typename?: 'Query', usageStats: { __typename?: 'UsageStats', totalTokens: number, totalCost: number } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, userId: string, firstName: string, lastName: string, planType: string, usageCount: number, subscriptionStatus: string, createdAt: string, updatedAt: string } };

export const AgentRequestFieldsFragmentDoc = gql`
    fragment AgentRequestFields on AgentRequest {
  id
  userId
  threadId
  triggeringMessageId
  responseMessageId
  agentType
  content
  status
  progress
  results
  checkpoint
  tokenCost
  createdAt
  updatedAt
  completedAt
}
    `;
export const AgentRequestWithEventsFragmentDoc = gql`
    fragment AgentRequestWithEvents on AgentRequest {
  ...AgentRequestFields
}
    ${AgentRequestFieldsFragmentDoc}`;
export const ContextReferenceFieldsFragmentDoc = gql`
    fragment ContextReferenceFields on ContextReference {
  id
  threadId
  ownerUserId
  entityType
  entityReference
  source
  priorityTier
  addedAt
}
    `;
export const FileFieldsFragmentDoc = gql`
    fragment FileFields on File {
  id
  ownerUserId
  path
  name
  content
  folderId
  shadowDomainId
  storagePath
  fileSize
  mimeType
  indexingStatus
  source
  isAIGenerated
  createdBy
  lastEditedBy
  lastEditedAt
  createdInThreadId
  version
  createdAt
  updatedAt
}
    `;
export const FolderFieldsFragmentDoc = gql`
    fragment FolderFields on Folder {
  id
  userId
  name
  parentFolderId
  path
  createdAt
  updatedAt
}
    `;
export const MessageFieldsFragmentDoc = gql`
    fragment MessageFields on Message {
  id
  threadId
  ownerUserId
  role
  content
  timestamp
  requestId
  toolCalls
  tokensUsed
}
    `;
export const ThreadFieldsFragmentDoc = gql`
    fragment ThreadFields on Thread {
  id
  branchTitle
  parentThreadId
  creator
  ownerUserId
  createdAt
  updatedAt
  messages {
    ...MessageFields
  }
}
    ${MessageFieldsFragmentDoc}`;
export const ToolCallFieldsFragmentDoc = gql`
    fragment ToolCallFields on ToolCall {
  id
  triggeringMessageId
  responseMessageId
  threadId
  ownerUserId
  toolName
  toolInput
  approvalStatus
  toolOutput
  rejectionReason
  revisionCount
  revisionHistory
  timestamp
}
    `;
export const UserFieldsFragmentDoc = gql`
    fragment UserFields on User {
  id
  userId
  firstName
  lastName
  planType
  usageCount
  subscriptionStatus
  createdAt
  updatedAt
}
    `;
export const CreateAgentRequestDocument = gql`
    mutation CreateAgentRequest($threadId: ID!, $triggeringMessageId: ID!, $agentType: String!, $content: String!) {
  createAgentRequest(
    input: {threadId: $threadId, triggeringMessageId: $triggeringMessageId, agentType: $agentType, content: $content}
  ) {
    ...AgentRequestFields
  }
}
    ${AgentRequestFieldsFragmentDoc}`;

export function useCreateAgentRequestMutation() {
  return Urql.useMutation<CreateAgentRequestMutation, CreateAgentRequestMutationVariables>(CreateAgentRequestDocument);
};
export const CreateFileDocument = gql`
    mutation CreateFile($id: UUID, $name: String!, $content: String!, $threadId: String, $folderId: String) {
  createFile(
    input: {id: $id, name: $name, content: $content, threadId: $threadId, folderId: $folderId}
  ) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useCreateFileMutation() {
  return Urql.useMutation<CreateFileMutation, CreateFileMutationVariables>(CreateFileDocument);
};
export const UploadFileDocument = gql`
    mutation UploadFile($file: Upload!, $folderId: ID, $threadId: ID) {
  uploadFile(file: $file, folderId: $folderId, threadId: $threadId) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useUploadFileMutation() {
  return Urql.useMutation<UploadFileMutation, UploadFileMutationVariables>(UploadFileDocument);
};
export const UpdateFileDocument = gql`
    mutation UpdateFile($id: ID!, $content: String!, $version: Int) {
  updateFile(id: $id, input: {content: $content, version: $version}) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useUpdateFileMutation() {
  return Urql.useMutation<UpdateFileMutation, UpdateFileMutationVariables>(UpdateFileDocument);
};
export const UpdateFilePartialDocument = gql`
    mutation UpdateFilePartial($id: ID!, $name: String, $content: String, $folderId: String) {
  updateFilePartial(
    id: $id
    input: {name: $name, content: $content, folderId: $folderId}
  ) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useUpdateFilePartialMutation() {
  return Urql.useMutation<UpdateFilePartialMutation, UpdateFilePartialMutationVariables>(UpdateFilePartialDocument);
};
export const DeleteFileDocument = gql`
    mutation DeleteFile($id: ID!) {
  deleteFile(id: $id)
}
    `;

export function useDeleteFileMutation() {
  return Urql.useMutation<DeleteFileMutation, DeleteFileMutationVariables>(DeleteFileDocument);
};
export const CreateFolderDocument = gql`
    mutation CreateFolder($id: UUID, $name: String!, $parentFolderId: String) {
  createFolder(input: {id: $id, name: $name, parentFolderId: $parentFolderId}) {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useCreateFolderMutation() {
  return Urql.useMutation<CreateFolderMutation, CreateFolderMutationVariables>(CreateFolderDocument);
};
export const UpdateFolderDocument = gql`
    mutation UpdateFolder($id: ID!, $name: String, $parentFolderId: String) {
  updateFolder(id: $id, input: {name: $name, parentFolderId: $parentFolderId}) {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useUpdateFolderMutation() {
  return Urql.useMutation<UpdateFolderMutation, UpdateFolderMutationVariables>(UpdateFolderDocument);
};
export const DeleteFolderDocument = gql`
    mutation DeleteFolder($id: ID!) {
  deleteFolder(id: $id)
}
    `;

export function useDeleteFolderMutation() {
  return Urql.useMutation<DeleteFolderMutation, DeleteFolderMutationVariables>(DeleteFolderDocument);
};
export const CreateMessageDocument = gql`
    mutation CreateMessage($input: CreateMessageInput!) {
  createMessage(input: $input) {
    ...MessageFields
  }
}
    ${MessageFieldsFragmentDoc}`;

export function useCreateMessageMutation() {
  return Urql.useMutation<CreateMessageMutation, CreateMessageMutationVariables>(CreateMessageDocument);
};
export const DeleteMessageDocument = gql`
    mutation DeleteMessage($id: ID!) {
  deleteMessage(id: $id)
}
    `;

export function useDeleteMessageMutation() {
  return Urql.useMutation<DeleteMessageMutation, DeleteMessageMutationVariables>(DeleteMessageDocument);
};
export const CreateThreadDocument = gql`
    mutation CreateThread($input: CreateThreadInput!) {
  createThread(input: $input) {
    ...ThreadFields
  }
}
    ${ThreadFieldsFragmentDoc}`;

export function useCreateThreadMutation() {
  return Urql.useMutation<CreateThreadMutation, CreateThreadMutationVariables>(CreateThreadDocument);
};
export const CreateThreadWithMessageDocument = gql`
    mutation CreateThreadWithMessage($input: CreateThreadWithMessageInput!) {
  createThreadWithMessage(input: $input) {
    thread {
      ...ThreadFields
    }
    message {
      ...MessageFields
    }
  }
}
    ${ThreadFieldsFragmentDoc}
${MessageFieldsFragmentDoc}`;

export function useCreateThreadWithMessageMutation() {
  return Urql.useMutation<CreateThreadWithMessageMutation, CreateThreadWithMessageMutationVariables>(CreateThreadWithMessageDocument);
};
export const UpdateThreadDocument = gql`
    mutation UpdateThread($id: ID!, $input: UpdateThreadInput!) {
  updateThread(id: $id, input: $input) {
    ...ThreadFields
  }
}
    ${ThreadFieldsFragmentDoc}`;

export function useUpdateThreadMutation() {
  return Urql.useMutation<UpdateThreadMutation, UpdateThreadMutationVariables>(UpdateThreadDocument);
};
export const DeleteThreadDocument = gql`
    mutation DeleteThread($id: ID!) {
  deleteThread(id: $id)
}
    `;

export function useDeleteThreadMutation() {
  return Urql.useMutation<DeleteThreadMutation, DeleteThreadMutationVariables>(DeleteThreadDocument);
};
export const AddContextReferenceDocument = gql`
    mutation AddContextReference($input: AddContextReferenceInput!) {
  addContextReference(input: $input) {
    ...ContextReferenceFields
  }
}
    ${ContextReferenceFieldsFragmentDoc}`;

export function useAddContextReferenceMutation() {
  return Urql.useMutation<AddContextReferenceMutation, AddContextReferenceMutationVariables>(AddContextReferenceDocument);
};
export const RemoveContextReferenceDocument = gql`
    mutation RemoveContextReference($id: ID!) {
  removeContextReference(id: $id)
}
    `;

export function useRemoveContextReferenceMutation() {
  return Urql.useMutation<RemoveContextReferenceMutation, RemoveContextReferenceMutationVariables>(RemoveContextReferenceDocument);
};
export const UpdateContextReferencePriorityDocument = gql`
    mutation UpdateContextReferencePriority($id: ID!, $priorityTier: Int!) {
  updateContextReferencePriority(id: $id, priorityTier: $priorityTier) {
    ...ContextReferenceFields
  }
}
    ${ContextReferenceFieldsFragmentDoc}`;

export function useUpdateContextReferencePriorityMutation() {
  return Urql.useMutation<UpdateContextReferencePriorityMutation, UpdateContextReferencePriorityMutationVariables>(UpdateContextReferencePriorityDocument);
};
export const ConsolidateBranchesDocument = gql`
    mutation ConsolidateBranches($input: ConsolidateBranchesInput!) {
  consolidateBranches(input: $input) {
    requestId
    fileId
    status
  }
}
    `;

export function useConsolidateBranchesMutation() {
  return Urql.useMutation<ConsolidateBranchesMutation, ConsolidateBranchesMutationVariables>(ConsolidateBranchesDocument);
};
export const ApproveToolCallDocument = gql`
    mutation ApproveToolCall($id: ID!) {
  approveToolCall(input: {id: $id}) {
    ...ToolCallFields
  }
}
    ${ToolCallFieldsFragmentDoc}`;

export function useApproveToolCallMutation() {
  return Urql.useMutation<ApproveToolCallMutation, ApproveToolCallMutationVariables>(ApproveToolCallDocument);
};
export const RejectToolCallDocument = gql`
    mutation RejectToolCall($id: ID!, $reason: String) {
  rejectToolCall(input: {id: $id, reason: $reason}) {
    ...ToolCallFields
  }
}
    ${ToolCallFieldsFragmentDoc}`;

export function useRejectToolCallMutation() {
  return Urql.useMutation<RejectToolCallMutation, RejectToolCallMutationVariables>(RejectToolCallDocument);
};
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($firstName: String, $lastName: String) {
  updateProfile(input: {firstName: $firstName, lastName: $lastName}) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export function useUpdateProfileMutation() {
  return Urql.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument);
};
export const DeleteAccountDocument = gql`
    mutation DeleteAccount {
  deleteAccount
}
    `;

export function useDeleteAccountMutation() {
  return Urql.useMutation<DeleteAccountMutation, DeleteAccountMutationVariables>(DeleteAccountDocument);
};
export const GetAgentRequestDocument = gql`
    query GetAgentRequest($id: ID!) {
  agentRequest(id: $id) {
    ...AgentRequestFields
  }
}
    ${AgentRequestFieldsFragmentDoc}`;

export function useGetAgentRequestQuery(options: Omit<Urql.UseQueryArgs<GetAgentRequestQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAgentRequestQuery, GetAgentRequestQueryVariables>({ query: GetAgentRequestDocument, ...options });
};
export const GetAgentRequestWithEventsDocument = gql`
    query GetAgentRequestWithEvents($id: ID!) {
  agentRequest(id: $id) {
    ...AgentRequestWithEvents
  }
}
    ${AgentRequestWithEventsFragmentDoc}`;

export function useGetAgentRequestWithEventsQuery(options: Omit<Urql.UseQueryArgs<GetAgentRequestWithEventsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAgentRequestWithEventsQuery, GetAgentRequestWithEventsQueryVariables>({ query: GetAgentRequestWithEventsDocument, ...options });
};
export const ListAgentRequestsByThreadDocument = gql`
    query ListAgentRequestsByThread($threadId: ID!) {
  agentRequestsByThread(threadId: $threadId) {
    ...AgentRequestFields
  }
}
    ${AgentRequestFieldsFragmentDoc}`;

export function useListAgentRequestsByThreadQuery(options: Omit<Urql.UseQueryArgs<ListAgentRequestsByThreadQueryVariables>, 'query'>) {
  return Urql.useQuery<ListAgentRequestsByThreadQuery, ListAgentRequestsByThreadQueryVariables>({ query: ListAgentRequestsByThreadDocument, ...options });
};
export const GetAgentExecutionEventsDocument = gql`
    query GetAgentExecutionEvents($requestId: ID!) {
  agentExecutionEvents(requestId: $requestId) {
    id
    requestId
    type
    data
    createdAt
  }
}
    `;

export function useGetAgentExecutionEventsQuery(options: Omit<Urql.UseQueryArgs<GetAgentExecutionEventsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAgentExecutionEventsQuery, GetAgentExecutionEventsQueryVariables>({ query: GetAgentExecutionEventsDocument, ...options });
};
export const GetFileDocument = gql`
    query GetFile($id: ID!) {
  file(id: $id) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useGetFileQuery(options: Omit<Urql.UseQueryArgs<GetFileQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFileQuery, GetFileQueryVariables>({ query: GetFileDocument, ...options });
};
export const ListAllFilesDocument = gql`
    query ListAllFiles {
  files {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useListAllFilesQuery(options?: Omit<Urql.UseQueryArgs<ListAllFilesQueryVariables>, 'query'>) {
  return Urql.useQuery<ListAllFilesQuery, ListAllFilesQueryVariables>({ query: ListAllFilesDocument, ...options });
};
export const GetFileByPathDocument = gql`
    query GetFileByPath($path: String!) {
  fileByPath(path: $path) {
    ...FileFields
  }
}
    ${FileFieldsFragmentDoc}`;

export function useGetFileByPathQuery(options: Omit<Urql.UseQueryArgs<GetFileByPathQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFileByPathQuery, GetFileByPathQueryVariables>({ query: GetFileByPathDocument, ...options });
};
export const GetFolderDocument = gql`
    query GetFolder($id: ID!) {
  folder(id: $id) {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useGetFolderQuery(options: Omit<Urql.UseQueryArgs<GetFolderQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFolderQuery, GetFolderQueryVariables>({ query: GetFolderDocument, ...options });
};
export const GetFolderWithChildrenDocument = gql`
    query GetFolderWithChildren($id: ID!) {
  folder(id: $id) {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useGetFolderWithChildrenQuery(options: Omit<Urql.UseQueryArgs<GetFolderWithChildrenQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFolderWithChildrenQuery, GetFolderWithChildrenQueryVariables>({ query: GetFolderWithChildrenDocument, ...options });
};
export const ListFoldersDocument = gql`
    query ListFolders {
  folders {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useListFoldersQuery(options?: Omit<Urql.UseQueryArgs<ListFoldersQueryVariables>, 'query'>) {
  return Urql.useQuery<ListFoldersQuery, ListFoldersQueryVariables>({ query: ListFoldersDocument, ...options });
};
export const ListRootFoldersDocument = gql`
    query ListRootFolders {
  rootFolders {
    ...FolderFields
  }
}
    ${FolderFieldsFragmentDoc}`;

export function useListRootFoldersQuery(options?: Omit<Urql.UseQueryArgs<ListRootFoldersQueryVariables>, 'query'>) {
  return Urql.useQuery<ListRootFoldersQuery, ListRootFoldersQueryVariables>({ query: ListRootFoldersDocument, ...options });
};
export const GetMessagesDocument = gql`
    query GetMessages($threadId: ID!, $limit: Int, $offset: Int) {
  messages(threadId: $threadId, limit: $limit, offset: $offset) {
    ...MessageFields
  }
}
    ${MessageFieldsFragmentDoc}`;

export function useGetMessagesQuery(options: Omit<Urql.UseQueryArgs<GetMessagesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMessagesQuery, GetMessagesQueryVariables>({ query: GetMessagesDocument, ...options });
};
export const SearchDocument = gql`
    query Search($query: String!, $limit: Int, $fileTypes: [String!], $entityTypes: [String!]) {
  search(
    input: {query: $query, limit: $limit, fileTypes: $fileTypes, entityTypes: $entityTypes}
  ) {
    ... on FileSearchResult {
      id
      path
      excerpt
      relevance
      entityType
    }
    ... on ThreadSearchResult {
      id
      title
      excerpt
      relevance
      entityType
    }
    ... on ConceptSearchResult {
      id
      conceptName
      excerpt
      relevance
      entityType
    }
  }
}
    `;

export function useSearchQuery(options: Omit<Urql.UseQueryArgs<SearchQueryVariables>, 'query'>) {
  return Urql.useQuery<SearchQuery, SearchQueryVariables>({ query: SearchDocument, ...options });
};
export const AutocompleteDocument = gql`
    query Autocomplete($query: String!, $entityType: String, $limit: Int) {
  autocomplete(input: {query: $query, entityType: $entityType, limit: $limit}) {
    id
    name
    path
    type
    branchName
    branchId
    relevanceScore
    lastModified
  }
}
    `;

export function useAutocompleteQuery(options: Omit<Urql.UseQueryArgs<AutocompleteQueryVariables>, 'query'>) {
  return Urql.useQuery<AutocompleteQuery, AutocompleteQueryVariables>({ query: AutocompleteDocument, ...options });
};
export const GetThreadDocument = gql`
    query GetThread($id: ID!) {
  thread(id: $id) {
    ...ThreadFields
  }
}
    ${ThreadFieldsFragmentDoc}`;

export function useGetThreadQuery(options: Omit<Urql.UseQueryArgs<GetThreadQueryVariables>, 'query'>) {
  return Urql.useQuery<GetThreadQuery, GetThreadQueryVariables>({ query: GetThreadDocument, ...options });
};
export const ListAllThreadsDocument = gql`
    query ListAllThreads {
  threads {
    ...ThreadFields
  }
}
    ${ThreadFieldsFragmentDoc}`;

export function useListAllThreadsQuery(options?: Omit<Urql.UseQueryArgs<ListAllThreadsQueryVariables>, 'query'>) {
  return Urql.useQuery<ListAllThreadsQuery, ListAllThreadsQueryVariables>({ query: ListAllThreadsDocument, ...options });
};
export const GetToolCallDocument = gql`
    query GetToolCall($id: ID!) {
  toolCall(id: $id) {
    ...ToolCallFields
  }
}
    ${ToolCallFieldsFragmentDoc}`;

export function useGetToolCallQuery(options: Omit<Urql.UseQueryArgs<GetToolCallQueryVariables>, 'query'>) {
  return Urql.useQuery<GetToolCallQuery, GetToolCallQueryVariables>({ query: GetToolCallDocument, ...options });
};
export const ListPendingToolCallsDocument = gql`
    query ListPendingToolCalls($threadId: ID!) {
  pendingToolCalls(threadId: $threadId) {
    ...ToolCallFields
  }
}
    ${ToolCallFieldsFragmentDoc}`;

export function useListPendingToolCallsQuery(options: Omit<Urql.UseQueryArgs<ListPendingToolCallsQueryVariables>, 'query'>) {
  return Urql.useQuery<ListPendingToolCallsQuery, ListPendingToolCallsQueryVariables>({ query: ListPendingToolCallsDocument, ...options });
};
export const ListToolCallsByRequestDocument = gql`
    query ListToolCallsByRequest($requestId: ID!) {
  toolCallsByRequest(requestId: $requestId) {
    ...ToolCallFields
  }
}
    ${ToolCallFieldsFragmentDoc}`;

export function useListToolCallsByRequestQuery(options: Omit<Urql.UseQueryArgs<ListToolCallsByRequestQueryVariables>, 'query'>) {
  return Urql.useQuery<ListToolCallsByRequestQuery, ListToolCallsByRequestQueryVariables>({ query: ListToolCallsByRequestDocument, ...options });
};
export const ListUsageEventsDocument = gql`
    query ListUsageEvents($userId: ID, $startDate: DateTime, $endDate: DateTime, $limit: Int, $offset: Int) {
  usageEvents(
    userId: $userId
    startDate: $startDate
    endDate: $endDate
    limit: $limit
    offset: $offset
  ) {
    id
    userId
    eventType
    tokensUsed
    cost
    metadata
    createdAt
  }
}
    `;

export function useListUsageEventsQuery(options?: Omit<Urql.UseQueryArgs<ListUsageEventsQueryVariables>, 'query'>) {
  return Urql.useQuery<ListUsageEventsQuery, ListUsageEventsQueryVariables>({ query: ListUsageEventsDocument, ...options });
};
export const GetUsageStatsDocument = gql`
    query GetUsageStats($userId: ID, $startDate: DateTime) {
  usageStats(userId: $userId, startDate: $startDate) {
    totalTokens
    totalCost
  }
}
    `;

export function useGetUsageStatsQuery(options?: Omit<Urql.UseQueryArgs<GetUsageStatsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUsageStatsQuery, GetUsageStatsQueryVariables>({ query: GetUsageStatsDocument, ...options });
};
export const GetMeDocument = gql`
    query GetMe {
  me {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export function useGetMeQuery(options?: Omit<Urql.UseQueryArgs<GetMeQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMeQuery, GetMeQueryVariables>({ query: GetMeDocument, ...options });
};