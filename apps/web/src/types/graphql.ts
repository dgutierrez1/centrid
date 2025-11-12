import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Event payload (JSON object) */
  data?: Maybe<Scalars['JSON']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  /** Agent request ID this event belongs to */
  requestId?: Maybe<Scalars['String']['output']>;
  /** Event type: text_chunk, tool_call, completion, error */
  type?: Maybe<Scalars['String']['output']>;
};

/** AI agent execution request */
export type AgentRequest = {
  __typename?: 'AgentRequest';
  /** Agent type (e.g., claude, gpt4) */
  agentType?: Maybe<Scalars['String']['output']>;
  /** Checkpoint state for tool approval resume (JSON) */
  checkpoint?: Maybe<Scalars['JSON']['output']>;
  /** Completion timestamp */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Request content/prompt */
  content?: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Request ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Progress (0.0 - 1.0) */
  progress?: Maybe<Scalars['Float']['output']>;
  /** Response message ID */
  responseMessageId?: Maybe<Scalars['String']['output']>;
  /** Execution results (JSON) */
  results?: Maybe<Scalars['JSON']['output']>;
  /** Status: pending, in_progress, completed, failed */
  status?: Maybe<Scalars['String']['output']>;
  /** Thread ID */
  threadId?: Maybe<Scalars['String']['output']>;
  /** Total tokens used */
  tokenCost?: Maybe<Scalars['Int']['output']>;
  /** Triggering message ID */
  triggeringMessageId?: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  userId?: Maybe<Scalars['String']['output']>;
};

/** Multi-turn conversation session for agent execution */
export type AgentSession = {
  __typename?: 'AgentSession';
  /** Session context state (JSON object) */
  contextState?: Maybe<Scalars['JSON']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  /** Chain of agent requests in this session (JSON array) */
  requestChain?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User ID this session belongs to */
  userId?: Maybe<Scalars['String']['output']>;
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
  id?: Maybe<Scalars['ID']['output']>;
  lastModified?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  relevanceScore?: Maybe<Scalars['Float']['output']>;
  /** Entity type: file, folder, thread */
  type?: Maybe<Scalars['String']['output']>;
};

/** Concept search result from knowledge graph */
export type ConceptSearchResult = {
  __typename?: 'ConceptSearchResult';
  /** Concept name */
  conceptName?: Maybe<Scalars['String']['output']>;
  /** Entity type: concept */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Concept description */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** Concept ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Relevance score (0-1) */
  relevance?: Maybe<Scalars['Float']['output']>;
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
  fileId?: Maybe<Scalars['ID']['output']>;
  /** Agent request ID for subscribing to progress events */
  requestId?: Maybe<Scalars['ID']['output']>;
  /** Status: pending, in_progress, completed, failed */
  status?: Maybe<Scalars['String']['output']>;
};

/** Context reference linking threads to files/folders */
export type ContextReference = {
  __typename?: 'ContextReference';
  addedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Entity path or ID */
  entityReference?: Maybe<Scalars['String']['output']>;
  /** Type: file, folder, thread */
  entityType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ownerUserId?: Maybe<Scalars['String']['output']>;
  /** Priority: 1 (high) to 3 (low) */
  priorityTier?: Maybe<Scalars['Int']['output']>;
  /** Source: user-added, agent-added, inherited */
  source?: Maybe<Scalars['String']['output']>;
  threadId?: Maybe<Scalars['String']['output']>;
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

export type CreateAgentSessionInput = {
  /** Initial context state (JSON object) */
  contextState?: InputMaybe<Scalars['JSON']['input']>;
  /** Initial request chain (JSON array) */
  requestChain: Scalars['JSON']['input'];
};

/** Input for creating a new file */
export type CreateFileInput = {
  /** File content */
  content: Scalars['String']['input'];
  /** Folder ID to organize file */
  folderId?: InputMaybe<Scalars['String']['input']>;
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Filename with extension (e.g., 'document.md') */
  name: Scalars['String']['input'];
  /** Thread ID to link file to (creates context reference) */
  threadId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new folder */
export type CreateFolderInput = {
  /** Optional client-provided UUID (for optimistic updates) */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Folder name */
  name: Scalars['String']['input'];
  /** Parent folder ID (null for root) */
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateMessageInput = {
  /** Message content (text or JSON string of ContentBlockDTO[]) */
  content: Scalars['String']['input'];
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
  parentThreadId?: InputMaybe<Scalars['ID']['input']>;
};

/** Workspace file with content and metadata */
export type File = {
  __typename?: 'File';
  /** File content */
  content?: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Creator: user or agent name */
  createdBy?: Maybe<Scalars['String']['output']>;
  /** File size in bytes */
  fileSize?: Maybe<Scalars['Int']['output']>;
  /** Parent folder ID */
  folderId?: Maybe<Scalars['String']['output']>;
  /** File ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Indexing status: pending, completed, failed */
  indexingStatus?: Maybe<Scalars['String']['output']>;
  /** Whether file was AI-generated */
  isAIGenerated?: Maybe<Scalars['Boolean']['output']>;
  /** Last edit timestamp */
  lastEditedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Last editor */
  lastEditedBy?: Maybe<Scalars['String']['output']>;
  /** MIME type */
  mimeType?: Maybe<Scalars['String']['output']>;
  /** Filename with extension */
  name?: Maybe<Scalars['String']['output']>;
  /** Owner user ID */
  ownerUserId?: Maybe<Scalars['String']['output']>;
  /** Full path computed from folder hierarchy + name */
  path?: Maybe<Scalars['String']['output']>;
  /** Shadow entity ID for search */
  shadowDomainId?: Maybe<Scalars['String']['output']>;
  /** Source: ai-generated, user-uploaded */
  source?: Maybe<Scalars['String']['output']>;
  /** Supabase Storage path for large files */
  storagePath?: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Version number for optimistic locking */
  version?: Maybe<Scalars['Int']['output']>;
};

/** File creation and edit history */
export type FileProvenance = {
  __typename?: 'FileProvenance';
  /** Thread/message where file was created */
  createdIn?: Maybe<ProvenanceContext>;
  /** Thread/message where file was last modified */
  lastModifiedIn?: Maybe<ProvenanceContext>;
};

/** File search result */
export type FileSearchResult = {
  __typename?: 'FileSearchResult';
  /** Entity type: file */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Content excerpt with context */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** File ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** File path */
  path?: Maybe<Scalars['String']['output']>;
  /** Relevance score (0-1) */
  relevance?: Maybe<Scalars['Float']['output']>;
};

/** Hierarchical folder for organizing files */
export type Folder = {
  __typename?: 'Folder';
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Folder ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Folder name */
  name?: Maybe<Scalars['String']['output']>;
  /** Parent folder ID (null for root folders) */
  parentFolderId?: Maybe<Scalars['String']['output']>;
  /** Computed path from hierarchy */
  path?: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  userId?: Maybe<Scalars['String']['output']>;
};

export type Message = {
  __typename?: 'Message';
  /** Message content blocks (ContentBlock[] stored as JSONB) */
  content?: Maybe<Scalars['JSON']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ownerUserId?: Maybe<Scalars['String']['output']>;
  /** Agent request ID (for user messages that trigger agent execution) */
  requestId?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  threadId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['DateTime']['output']>;
  /** Number of tokens used */
  tokensUsed?: Maybe<Scalars['Int']['output']>;
  /** Tool call IDs referenced in this message (JSON array) */
  toolCalls?: Maybe<Scalars['JSON']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Add a context reference to a thread */
  addContextReference?: Maybe<ContextReference>;
  /** Approve a pending tool call (triggers async execution) */
  approveToolCall?: Maybe<ToolCall>;
  /** Consolidate multiple branches into a single file. Returns requestId for subscribing to progress via realtime. */
  consolidateBranches?: Maybe<ConsolidationResult>;
  /** Create a new agent request (triggers async execution) */
  createAgentRequest?: Maybe<AgentRequest>;
  /** Create a new agent session */
  createAgentSession?: Maybe<AgentSession>;
  /** Create a new file */
  createFile?: Maybe<File>;
  /** Create a new folder */
  createFolder?: Maybe<Folder>;
  /** Create a new message in a thread */
  createMessage?: Maybe<Message>;
  /** Create a new shadow entity for semantic search */
  createShadowEntity?: Maybe<ShadowEntity>;
  createThread?: Maybe<Thread>;
  /** Delete current user account (irreversible) */
  deleteAccount?: Maybe<Scalars['Boolean']['output']>;
  /** Delete an agent session */
  deleteAgentSession?: Maybe<Scalars['Boolean']['output']>;
  /** Delete file */
  deleteFile?: Maybe<Scalars['Boolean']['output']>;
  /** Delete folder (must be empty) */
  deleteFolder?: Maybe<Scalars['Boolean']['output']>;
  /** Delete a message from a thread */
  deleteMessage?: Maybe<Scalars['Boolean']['output']>;
  /** Delete shadow entity (admin/cleanup only - normally persist for history) */
  deleteShadowEntity?: Maybe<Scalars['Boolean']['output']>;
  deleteThread?: Maybe<Scalars['Boolean']['output']>;
  /** Execute agent request and stream events to database (shares logic with REST endpoint) */
  executeAgentRequest?: Maybe<Scalars['Boolean']['output']>;
  /** Reject a pending tool call */
  rejectToolCall?: Maybe<ToolCall>;
  /** Remove a context reference from a thread */
  removeContextReference?: Maybe<Scalars['Boolean']['output']>;
  /** Update an existing agent session */
  updateAgentSession?: Maybe<AgentSession>;
  /** Update priority of a context reference */
  updateContextReferencePriority?: Maybe<ContextReference>;
  /** Update file content with optimistic locking */
  updateFile?: Maybe<File>;
  /** Partial file update (rename, move, or edit content) */
  updateFilePartial?: Maybe<File>;
  /** Update folder (rename or move) */
  updateFolder?: Maybe<Folder>;
  /** Update current user profile */
  updateProfile?: Maybe<User>;
  /** Update shadow entity (summary, embedding, metadata) */
  updateShadowEntity?: Maybe<ShadowEntity>;
  updateThread?: Maybe<Thread>;
  /** Upload a file via multipart form data */
  uploadFile?: Maybe<File>;
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


export type MutationCreateAgentSessionArgs = {
  input: CreateAgentSessionInput;
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


export type MutationDeleteAgentSessionArgs = {
  id: Scalars['ID']['input'];
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


export type MutationUpdateAgentSessionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgentSessionInput;
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

/** Thread and message context for file operation */
export type ProvenanceContext = {
  __typename?: 'ProvenanceContext';
  /** Message ID that triggered operation */
  messageId?: Maybe<Scalars['String']['output']>;
  /** Thread ID where operation occurred */
  threadId?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Get all execution events for an agent request (for replay on late connection) */
  agentExecutionEvents?: Maybe<Array<AgentExecutionEvent>>;
  /** Get execution events since a certain timestamp (for incremental polling) */
  agentExecutionEventsSince?: Maybe<Array<AgentExecutionEvent>>;
  /** Get agent request by ID */
  agentRequest?: Maybe<AgentRequest>;
  /** Get all agent requests for a thread */
  agentRequestsByThread?: Maybe<Array<AgentRequest>>;
  /** Get a single agent session by ID */
  agentSession?: Maybe<AgentSession>;
  /** Get all agent sessions for current user */
  agentSessions?: Maybe<Array<AgentSession>>;
  /** Autocomplete search for quick fuzzy matching of files, folders, and threads */
  autocomplete?: Maybe<Array<AutocompleteItem>>;
  /** Get file by ID */
  file?: Maybe<File>;
  /** Get file by path */
  fileByPath?: Maybe<File>;
  /** Get file creation and edit history for navigation */
  fileProvenance?: Maybe<FileProvenance>;
  /** Get all files for current user */
  files?: Maybe<Array<File>>;
  /** Get folder by ID */
  folder?: Maybe<Folder>;
  /** Get all folders for current user */
  folders?: Maybe<Array<Folder>>;
  /** Get current user profile */
  me?: Maybe<User>;
  /** Get messages for a thread */
  messages?: Maybe<Array<Message>>;
  /** Get pending tool calls for a thread */
  pendingToolCalls?: Maybe<Array<ToolCall>>;
  /** Get root folders (no parent) for current user */
  rootFolders?: Maybe<Array<Folder>>;
  /** Semantic search across files, threads, and concepts */
  search?: Maybe<Array<SearchResult>>;
  /** Get all shadow entities for the current user */
  shadowEntities?: Maybe<Array<ShadowEntity>>;
  /** Get shadow entities for a source entity (file, thread, kg_node) */
  shadowEntitiesByEntity?: Maybe<Array<ShadowEntity>>;
  /** Get shadow entities for a file */
  shadowEntitiesByFile?: Maybe<Array<ShadowEntity>>;
  /** Get shadow entity by ID */
  shadowEntity?: Maybe<ShadowEntity>;
  thread?: Maybe<Thread>;
  threads?: Maybe<Array<Thread>>;
  /** Get tool call by ID */
  toolCall?: Maybe<ToolCall>;
  /** Get all tool calls for an agent request */
  toolCallsByRequest?: Maybe<Array<ToolCall>>;
  /** Get usage events for current user (with optional date range filtering) */
  usageEvents?: Maybe<Array<UsageEvent>>;
  /** Get aggregated usage statistics for current user */
  usageStats?: Maybe<UsageStats>;
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


export type QueryAgentSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentSessionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
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


export type QueryFileProvenanceArgs = {
  id: Scalars['ID']['input'];
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Vector embedding for semantic search (768 dimensions) */
  embedding: Array<Scalars['Float']['output']>;
  /** Source entity ID (file, thread, kg_node) */
  entityId?: Maybe<Scalars['String']['output']>;
  /** Source entity type: file, thread, kg_node */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Shadow entity ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Last update timestamp (embedding, summary, metadata) */
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
  /** Owner user ID */
  ownerUserId?: Maybe<Scalars['String']['output']>;
  /** Entity-specific metadata (file structure, thread metadata, etc.) */
  structureMetadata?: Maybe<Scalars['JSON']['output']>;
  /** AI-generated summary of source entity */
  summary: Scalars['String']['output'];
};

export type Thread = {
  __typename?: 'Thread';
  branchTitle?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  /** Messages in this thread (batched with DataLoader) */
  messages?: Maybe<Array<Message>>;
  ownerUserId?: Maybe<Scalars['String']['output']>;
  parentThreadId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Thread search result */
export type ThreadSearchResult = {
  __typename?: 'ThreadSearchResult';
  /** Entity type: thread */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Content excerpt with context */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** Thread ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** Relevance score (0-1) */
  relevance?: Maybe<Scalars['Float']['output']>;
  /** Thread title */
  title?: Maybe<Scalars['String']['output']>;
};

/** Agent tool call requiring approval */
export type ToolCall = {
  __typename?: 'ToolCall';
  /** Status: pending, approved, rejected, timeout */
  approvalStatus?: Maybe<Scalars['String']['output']>;
  /** Tool call ID (Claude toolu_* ID) */
  id?: Maybe<Scalars['ID']['output']>;
  /** Triggering message ID */
  messageId?: Maybe<Scalars['String']['output']>;
  /** Owner user ID */
  ownerUserId?: Maybe<Scalars['String']['output']>;
  /** Rejection reason if rejected */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** Agent request ID */
  requestId?: Maybe<Scalars['String']['output']>;
  /** Number of revisions */
  revisionCount?: Maybe<Scalars['Int']['output']>;
  /** Revision history (JSON) */
  revisionHistory?: Maybe<Scalars['JSON']['output']>;
  /** Thread ID */
  threadId?: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  timestamp?: Maybe<Scalars['DateTime']['output']>;
  /** Tool input parameters (JSON) */
  toolInput?: Maybe<Scalars['JSON']['output']>;
  /** Tool name (e.g., write_file, create_branch) */
  toolName?: Maybe<Scalars['String']['output']>;
  /** Tool execution output (JSON) */
  toolOutput?: Maybe<Scalars['JSON']['output']>;
};

export type UpdateAgentSessionInput = {
  /** Updated context state (JSON object) */
  contextState?: InputMaybe<Scalars['JSON']['input']>;
  /** Updated request chain (JSON array) */
  requestChain?: InputMaybe<Scalars['JSON']['input']>;
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
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Event type (e.g., agent_request, file_upload) */
  eventType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  /** Event metadata (JSON object as string) */
  metadata?: Maybe<Scalars['String']['output']>;
  /** Number of tokens used (for AI operations) */
  tokensUsed?: Maybe<Scalars['Int']['output']>;
  /** User ID this event belongs to */
  userId?: Maybe<Scalars['String']['output']>;
};

/** Aggregated usage statistics */
export type UsageStats = {
  __typename?: 'UsageStats';
  /** Total cost in dollars */
  totalCost?: Maybe<Scalars['Float']['output']>;
  /** Total tokens used */
  totalTokens?: Maybe<Scalars['Int']['output']>;
};

/** User profile with account information */
export type User = {
  __typename?: 'User';
  /** Profile creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** User first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Profile ID */
  id?: Maybe<Scalars['ID']['output']>;
  /** User last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Subscription plan (free, pro, enterprise) */
  planType?: Maybe<Scalars['String']['output']>;
  /** Subscription status (active, cancelled, expired) */
  subscriptionStatus?: Maybe<Scalars['String']['output']>;
  /** Last update timestamp */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Current usage count */
  usageCount?: Maybe<Scalars['Int']['output']>;
  /** Auth user ID */
  userId?: Maybe<Scalars['String']['output']>;
};

export type AgentRequestFieldsFragment = { __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null };

export type AgentRequestWithEventsFragment = { __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null };

export type ContextReferenceFieldsFragment = { __typename?: 'ContextReference', id?: string | null, threadId?: string | null, ownerUserId?: string | null, entityType?: string | null, entityReference?: string | null, source?: string | null, priorityTier?: number | null, addedAt?: string | null };

export type FileFieldsFragment = { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null };

export type FolderFieldsFragment = { __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null };

export type MessageFieldsFragment = { __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null };

export type ThreadFieldsFragment = { __typename?: 'Thread', id?: string | null, branchTitle?: string | null, parentThreadId?: string | null, creator?: string | null, ownerUserId?: string | null, createdAt?: string | null, updatedAt?: string | null, messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null };

export type ToolCallFieldsFragment = { __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null };

export type UserFieldsFragment = { __typename?: 'User', id?: string | null, userId?: string | null, firstName?: string | null, lastName?: string | null, planType?: string | null, usageCount?: number | null, subscriptionStatus?: string | null, createdAt?: string | null, updatedAt?: string | null };

export type CreateAgentRequestMutationVariables = Exact<{
  threadId: Scalars['ID']['input'];
  triggeringMessageId: Scalars['ID']['input'];
  agentType: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;


export type CreateAgentRequestMutation = { __typename?: 'Mutation', createAgentRequest?: { __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null } | null };

export type CreateFileMutationVariables = Exact<{
  name: Scalars['String']['input'];
  content: Scalars['String']['input'];
  threadId?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateFileMutation = { __typename?: 'Mutation', createFile?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UploadFileMutationVariables = Exact<{
  file: Scalars['Upload']['input'];
  folderId?: InputMaybe<Scalars['ID']['input']>;
  threadId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type UploadFileMutation = { __typename?: 'Mutation', uploadFile?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  version?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpdateFileMutation = { __typename?: 'Mutation', updateFile?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateFilePartialMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  folderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateFilePartialMutation = { __typename?: 'Mutation', updateFilePartial?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteFileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFileMutation = { __typename?: 'Mutation', deleteFile?: boolean | null };

export type CreateFolderMutationVariables = Exact<{
  name: Scalars['String']['input'];
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateFolderMutation = { __typename?: 'Mutation', createFolder?: { __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateFolderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  parentFolderId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateFolderMutation = { __typename?: 'Mutation', updateFolder?: { __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteFolderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFolderMutation = { __typename?: 'Mutation', deleteFolder?: boolean | null };

export type CreateMessageMutationVariables = Exact<{
  input: CreateMessageInput;
}>;


export type CreateMessageMutation = { __typename?: 'Mutation', createMessage?: { __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null } | null };

export type DeleteMessageMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMessageMutation = { __typename?: 'Mutation', deleteMessage?: boolean | null };

export type CreateThreadMutationVariables = Exact<{
  input: CreateThreadInput;
}>;


export type CreateThreadMutation = { __typename?: 'Mutation', createThread?: { __typename?: 'Thread', id?: string | null, branchTitle?: string | null, parentThreadId?: string | null, creator?: string | null, ownerUserId?: string | null, createdAt?: string | null, updatedAt?: string | null, messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null } | null };

export type UpdateThreadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateThreadInput;
}>;


export type UpdateThreadMutation = { __typename?: 'Mutation', updateThread?: { __typename?: 'Thread', id?: string | null, branchTitle?: string | null, parentThreadId?: string | null, creator?: string | null, ownerUserId?: string | null, createdAt?: string | null, updatedAt?: string | null, messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null } | null };

export type DeleteThreadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteThreadMutation = { __typename?: 'Mutation', deleteThread?: boolean | null };

export type AddContextReferenceMutationVariables = Exact<{
  input: AddContextReferenceInput;
}>;


export type AddContextReferenceMutation = { __typename?: 'Mutation', addContextReference?: { __typename?: 'ContextReference', id?: string | null, threadId?: string | null, ownerUserId?: string | null, entityType?: string | null, entityReference?: string | null, source?: string | null, priorityTier?: number | null, addedAt?: string | null } | null };

export type RemoveContextReferenceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveContextReferenceMutation = { __typename?: 'Mutation', removeContextReference?: boolean | null };

export type UpdateContextReferencePriorityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  priorityTier: Scalars['Int']['input'];
}>;


export type UpdateContextReferencePriorityMutation = { __typename?: 'Mutation', updateContextReferencePriority?: { __typename?: 'ContextReference', id?: string | null, threadId?: string | null, ownerUserId?: string | null, entityType?: string | null, entityReference?: string | null, source?: string | null, priorityTier?: number | null, addedAt?: string | null } | null };

export type ConsolidateBranchesMutationVariables = Exact<{
  input: ConsolidateBranchesInput;
}>;


export type ConsolidateBranchesMutation = { __typename?: 'Mutation', consolidateBranches?: { __typename?: 'ConsolidationResult', requestId?: string | null, fileId?: string | null, status?: string | null } | null };

export type ApproveToolCallMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveToolCallMutation = { __typename?: 'Mutation', approveToolCall?: { __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null } | null };

export type RejectToolCallMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type RejectToolCallMutation = { __typename?: 'Mutation', rejectToolCall?: { __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null } | null };

export type UpdateProfileMutationVariables = Exact<{
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile?: { __typename?: 'User', id?: string | null, userId?: string | null, firstName?: string | null, lastName?: string | null, planType?: string | null, usageCount?: number | null, subscriptionStatus?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAccountMutation = { __typename?: 'Mutation', deleteAccount?: boolean | null };

export type GetAgentRequestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAgentRequestQuery = { __typename?: 'Query', agentRequest?: { __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null } | null };

export type GetAgentRequestWithEventsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAgentRequestWithEventsQuery = { __typename?: 'Query', agentRequest?: { __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null } | null };

export type ListAgentRequestsByThreadQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
}>;


export type ListAgentRequestsByThreadQuery = { __typename?: 'Query', agentRequestsByThread?: Array<{ __typename?: 'AgentRequest', id?: string | null, userId?: string | null, threadId?: string | null, triggeringMessageId?: string | null, responseMessageId?: string | null, agentType?: string | null, content?: string | null, status?: string | null, progress?: number | null, results?: unknown | null, checkpoint?: unknown | null, tokenCost?: number | null, createdAt?: string | null, updatedAt?: string | null, completedAt?: string | null }> | null };

export type GetAgentExecutionEventsQueryVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type GetAgentExecutionEventsQuery = { __typename?: 'Query', agentExecutionEvents?: Array<{ __typename?: 'AgentExecutionEvent', id?: string | null, requestId?: string | null, type?: string | null, data?: unknown | null, createdAt?: string | null }> | null };

export type GetAgentSessionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAgentSessionQuery = { __typename?: 'Query', agentSession?: { __typename?: 'AgentSession', id?: string | null, userId?: string | null, requestChain?: unknown | null, contextState?: unknown | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ListAgentSessionsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListAgentSessionsQuery = { __typename?: 'Query', agentSessions?: Array<{ __typename?: 'AgentSession', id?: string | null, userId?: string | null, requestChain?: unknown | null, contextState?: unknown | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type GetFileQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFileQuery = { __typename?: 'Query', file?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ListAllFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAllFilesQuery = { __typename?: 'Query', files?: Array<{ __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type GetFileByPathQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type GetFileByPathQuery = { __typename?: 'Query', fileByPath?: { __typename?: 'File', id?: string | null, ownerUserId?: string | null, path?: string | null, name?: string | null, content?: string | null, folderId?: string | null, shadowDomainId?: string | null, storagePath?: string | null, fileSize?: number | null, mimeType?: string | null, indexingStatus?: string | null, source?: string | null, isAIGenerated?: boolean | null, createdBy?: string | null, lastEditedBy?: string | null, lastEditedAt?: string | null, version?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type GetFileProvenanceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFileProvenanceQuery = { __typename?: 'Query', fileProvenance?: { __typename?: 'FileProvenance', createdIn?: { __typename?: 'ProvenanceContext', threadId?: string | null, messageId?: string | null } | null, lastModifiedIn?: { __typename?: 'ProvenanceContext', threadId?: string | null, messageId?: string | null } | null } | null };

export type GetFolderQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFolderQuery = { __typename?: 'Query', folder?: { __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type GetFolderWithChildrenQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetFolderWithChildrenQuery = { __typename?: 'Query', folder?: { __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ListFoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListFoldersQuery = { __typename?: 'Query', folders?: Array<{ __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ListRootFoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type ListRootFoldersQuery = { __typename?: 'Query', rootFolders?: Array<{ __typename?: 'Folder', id?: string | null, userId?: string | null, name?: string | null, parentFolderId?: string | null, path?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type GetMessagesQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMessagesQuery = { __typename?: 'Query', messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null };

export type SearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  fileTypes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  entityTypes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type SearchQuery = { __typename?: 'Query', search?: Array<
    | { __typename?: 'ConceptSearchResult', id?: string | null, conceptName?: string | null, excerpt?: string | null, relevance?: number | null, entityType?: string | null }
    | { __typename?: 'FileSearchResult', id?: string | null, path?: string | null, excerpt?: string | null, relevance?: number | null, entityType?: string | null }
    | { __typename?: 'ThreadSearchResult', id?: string | null, title?: string | null, excerpt?: string | null, relevance?: number | null, entityType?: string | null }
  > | null };

export type AutocompleteQueryVariables = Exact<{
  query: Scalars['String']['input'];
  entityType?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AutocompleteQuery = { __typename?: 'Query', autocomplete?: Array<{ __typename?: 'AutocompleteItem', id?: string | null, name?: string | null, path?: string | null, type?: string | null, branchName?: string | null, branchId?: string | null, relevanceScore?: number | null, lastModified?: string | null }> | null };

export type GetThreadQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetThreadQuery = { __typename?: 'Query', thread?: { __typename?: 'Thread', id?: string | null, branchTitle?: string | null, parentThreadId?: string | null, creator?: string | null, ownerUserId?: string | null, createdAt?: string | null, updatedAt?: string | null, messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null } | null };

export type ListAllThreadsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAllThreadsQuery = { __typename?: 'Query', threads?: Array<{ __typename?: 'Thread', id?: string | null, branchTitle?: string | null, parentThreadId?: string | null, creator?: string | null, ownerUserId?: string | null, createdAt?: string | null, updatedAt?: string | null, messages?: Array<{ __typename?: 'Message', id?: string | null, threadId?: string | null, ownerUserId?: string | null, role?: string | null, content?: unknown | null, timestamp?: string | null, requestId?: string | null, toolCalls?: unknown | null, tokensUsed?: number | null }> | null }> | null };

export type GetToolCallQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetToolCallQuery = { __typename?: 'Query', toolCall?: { __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null } | null };

export type ListPendingToolCallsQueryVariables = Exact<{
  threadId: Scalars['ID']['input'];
}>;


export type ListPendingToolCallsQuery = { __typename?: 'Query', pendingToolCalls?: Array<{ __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null }> | null };

export type ListToolCallsByRequestQueryVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type ListToolCallsByRequestQuery = { __typename?: 'Query', toolCallsByRequest?: Array<{ __typename?: 'ToolCall', id?: string | null, messageId?: string | null, threadId?: string | null, ownerUserId?: string | null, toolName?: string | null, toolInput?: unknown | null, approvalStatus?: string | null, toolOutput?: unknown | null, rejectionReason?: string | null, revisionCount?: number | null, revisionHistory?: unknown | null, timestamp?: string | null }> | null };

export type ListUsageEventsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListUsageEventsQuery = { __typename?: 'Query', usageEvents?: Array<{ __typename?: 'UsageEvent', id?: string | null, userId?: string | null, eventType?: string | null, tokensUsed?: number | null, cost?: number | null, metadata?: string | null, createdAt?: string | null }> | null };

export type GetUsageStatsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetUsageStatsQuery = { __typename?: 'Query', usageStats?: { __typename?: 'UsageStats', totalTokens?: number | null, totalCost?: number | null } | null };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id?: string | null, userId?: string | null, firstName?: string | null, lastName?: string | null, planType?: string | null, usageCount?: number | null, subscriptionStatus?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

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
  messageId
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
    mutation CreateFile($name: String!, $content: String!, $threadId: String, $folderId: String) {
  createFile(
    input: {name: $name, content: $content, threadId: $threadId, folderId: $folderId}
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
    mutation CreateFolder($name: String!, $parentFolderId: String) {
  createFolder(input: {name: $name, parentFolderId: $parentFolderId}) {
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
export const GetAgentSessionDocument = gql`
    query GetAgentSession($id: ID!) {
  agentSession(id: $id) {
    id
    userId
    requestChain
    contextState
    createdAt
    updatedAt
  }
}
    `;

export function useGetAgentSessionQuery(options: Omit<Urql.UseQueryArgs<GetAgentSessionQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAgentSessionQuery, GetAgentSessionQueryVariables>({ query: GetAgentSessionDocument, ...options });
};
export const ListAgentSessionsDocument = gql`
    query ListAgentSessions($userId: ID, $limit: Int, $offset: Int) {
  agentSessions(userId: $userId, limit: $limit, offset: $offset) {
    id
    userId
    requestChain
    contextState
    createdAt
    updatedAt
  }
}
    `;

export function useListAgentSessionsQuery(options?: Omit<Urql.UseQueryArgs<ListAgentSessionsQueryVariables>, 'query'>) {
  return Urql.useQuery<ListAgentSessionsQuery, ListAgentSessionsQueryVariables>({ query: ListAgentSessionsDocument, ...options });
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
export const GetFileProvenanceDocument = gql`
    query GetFileProvenance($id: ID!) {
  fileProvenance(id: $id) {
    createdIn {
      threadId
      messageId
    }
    lastModifiedIn {
      threadId
      messageId
    }
  }
}
    `;

export function useGetFileProvenanceQuery(options: Omit<Urql.UseQueryArgs<GetFileProvenanceQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFileProvenanceQuery, GetFileProvenanceQueryVariables>({ query: GetFileProvenanceDocument, ...options });
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