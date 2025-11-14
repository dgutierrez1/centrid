/**
 * Auto-Generated Entity Types from Drizzle Schema
 *
 * These types are automatically inferred from the database schema.
 * DO NOT manually edit entity types - they should match the database schema exactly.
 *
 * Usage:
 * - Import in DTOs: `import { FileEntity } from '../../db/types'`
 * - Import in repositories: `import { InsertFile } from '../../db/types'`
 *
 * When schema changes:
 * 1. Update apps/api/src/db/schema.ts
 * 2. Run `npm run db:push`
 * 3. These types auto-update (no manual sync needed)
 * 4. TypeScript will catch any DTO/repository mismatches
 */

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema.ts';

// ============================================================================
// SELECT TYPES (Read from Database)
// ============================================================================

/**
 * User Profile Entity
 * Extended user data beyond auth.users
 */
export type UserProfileEntity = InferSelectModel<typeof schema.userProfiles>;

/**
 * Folder Entity
 * Hierarchical folder structure for documents and files
 */
export type FolderEntity = InferSelectModel<typeof schema.folders>;

/**
 * Document Entity
 * File metadata with full-text search
 */
export type DocumentEntity = InferSelectModel<typeof schema.documents>;

/**
 * Document Chunk Entity
 * Text segments for RAG context retrieval
 */
export type DocumentChunkEntity = InferSelectModel<typeof schema.documentChunks>;

/**
 * Agent Request Entity
 * AI agent execution tracking
 */
export type AgentRequestEntity = InferSelectModel<typeof schema.agentRequests>;

/**
 * Agent Session Entity
 * Multi-turn conversation management
 */
export type AgentSessionEntity = InferSelectModel<typeof schema.agentSessions>;

/**
 * Usage Event Entity
 * Usage tracking for billing
 */
export type UsageEventEntity = InferSelectModel<typeof schema.usageEvents>;

/**
 * Thread Entity
 * Conversation threads with branching support
 */
export type ThreadEntity = InferSelectModel<typeof schema.threads>;

/**
 * Message Entity
 * Individual messages within threads
 */
export type MessageEntity = InferSelectModel<typeof schema.messages>;

/**
 * Agent Tool Call Entity
 * Tool calls made by AI agents
 */
export type AgentToolCallEntity = InferSelectModel<typeof schema.agentToolCalls>;

/**
 * Context Reference Entity
 * References to files/documents/threads used as context
 */
export type ContextReferenceEntity = InferSelectModel<typeof schema.contextReferences>;

/**
 * File Entity
 * AI-generated workspace files
 */
export type FileEntity = InferSelectModel<typeof schema.files>;

/**
 * Shadow Entity
 * Semantic search layer entities
 */
export type ShadowEntityEntity = InferSelectModel<typeof schema.shadowEntities>;

/**
 * Agent Execution Event Entity
 * Granular agent execution events for streaming
 */
export type AgentExecutionEventEntity = InferSelectModel<typeof schema.agentExecutionEvents>;

// ============================================================================
// INSERT TYPES (Write to Database)
// ============================================================================

/**
 * Insert User Profile
 * Data for creating new user profiles
 */
export type InsertUserProfile = InferInsertModel<typeof schema.userProfiles>;

/**
 * Insert Folder
 * Data for creating new folders
 */
export type InsertFolder = InferInsertModel<typeof schema.folders>;

/**
 * Insert Document
 * Data for creating new documents
 */
export type InsertDocument = InferInsertModel<typeof schema.documents>;

/**
 * Insert Document Chunk
 * Data for creating new document chunks
 */
export type InsertDocumentChunk = InferInsertModel<typeof schema.documentChunks>;

/**
 * Insert Agent Request
 * Data for creating new agent requests
 */
export type InsertAgentRequest = InferInsertModel<typeof schema.agentRequests>;

/**
 * Insert Agent Session
 * Data for creating new agent sessions
 */
export type InsertAgentSession = InferInsertModel<typeof schema.agentSessions>;

/**
 * Insert Usage Event
 * Data for creating new usage events
 */
export type InsertUsageEvent = InferInsertModel<typeof schema.usageEvents>;

/**
 * Insert Thread
 * Data for creating new threads
 */
export type InsertThread = InferInsertModel<typeof schema.threads>;

/**
 * Insert Message
 * Data for creating new messages
 */
export type InsertMessage = InferInsertModel<typeof schema.messages>;

/**
 * Insert Agent Tool Call
 * Data for creating new tool calls
 */
export type InsertAgentToolCall = InferInsertModel<typeof schema.agentToolCalls>;

/**
 * Insert Context Reference
 * Data for creating new context references
 */
export type InsertContextReference = InferInsertModel<typeof schema.contextReferences>;

/**
 * Insert File
 * Data for creating new files
 */
export type InsertFile = InferInsertModel<typeof schema.files>;

/**
 * Insert Shadow Entity
 * Data for creating new shadow entities
 */
export type InsertShadowEntity = InferInsertModel<typeof schema.shadowEntities>;

/**
 * Insert Agent Execution Event
 * Data for creating new agent execution events
 */
export type InsertAgentExecutionEvent = InferInsertModel<typeof schema.agentExecutionEvents>;

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// These aliases provide backward compatibility for code that uses shorter names

export type UserProfile = UserProfileEntity;
export type Folder = FolderEntity;
export type Document = DocumentEntity;
export type DocumentChunk = DocumentChunkEntity;
export type AgentRequest = AgentRequestEntity;
export type AgentSession = AgentSessionEntity;
export type UsageEvent = UsageEventEntity;
export type Thread = ThreadEntity;
export type Message = MessageEntity;
export type AgentToolCall = AgentToolCallEntity;
export type ContextReference = ContextReferenceEntity;
export type File = FileEntity;
export type ShadowEntity = ShadowEntityEntity;
export type AgentExecutionEvent = AgentExecutionEventEntity;
