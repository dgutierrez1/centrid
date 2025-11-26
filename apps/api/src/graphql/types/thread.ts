/**
 * Thread GraphQL Type
 * Maps Drizzle Thread entity to GraphQL with context references and DataLoader
 */

import { builder } from "../builder.ts";
import { threadRepository } from "../../repositories/thread.ts";
import { messageRepository } from "../../repositories/message.ts";
import { contextReferenceRepository } from "../../repositories/contextReference.ts";
import { MessageService } from "../../services/messageService.ts";
import { ThreadService } from "../../services/threadService.ts";
import { ConsolidationService } from "../../services/consolidationService.ts";
import type { Thread, Message, ContextReference } from "../../db/types.ts";
import DataLoader from "dataloader";

// ============================================================================
// DataLoader for batching message queries
// ============================================================================

// Create messages DataLoader (batches by thread ID)
const createMessagesByThreadLoader = () =>
  new DataLoader<string, Message[]>(
    async (threadIds) => {
      // Fetch all messages for requested thread IDs
      const allMessages: Message[] = [];
      for (const threadId of threadIds) {
        const messages = await messageRepository.findByThreadId(threadId);
        allMessages.push(...messages);
      }

      // Group results by thread ID
      return threadIds.map((threadId) =>
        allMessages.filter((message) => message.threadId === threadId)
      );
    },
    { cache: false } // Disable caching for real-time updates
  );

// ============================================================================
// Context Reference Type (embedded in Thread)
// ============================================================================

const ContextReferenceType = builder
  .objectRef<ContextReference>("ContextReference")
  .implement({
    description: "Context reference linking threads to files/folders",
    fields: (t) => ({
      id: t.exposeID("id"),
      threadId: t.exposeString("threadId"),
      ownerUserId: t.exposeString("ownerUserId"),
      entityType: t.exposeString("entityType", {
        description: "Type: file, folder, thread",
      }),
      entityReference: t.exposeString("entityReference", {
        description: "Entity path or ID",
      }),
      source: t.exposeString("source", {
        description: "Source: user-added, agent-added, inherited",
      }),
      priorityTier: t.exposeInt("priorityTier", {
        nullable: true,
        description: "Priority: 1 (high) to 3 (low)",
      }),
      addedAt: t.field({
        type: "DateTime",
        resolve: (ref) => ref.addedAt, // Already ISO string from database
      }),
    }),
  });

// ============================================================================
// Thread Type
// ============================================================================

const ThreadType = builder.objectRef<Thread>("Thread").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    ownerUserId: t.exposeString("ownerUserId"),
    parentThreadId: t.exposeString("parentThreadId", { nullable: true }),
    branchTitle: t.exposeString("branchTitle", { nullable: true }),
    creator: t.exposeString("creator"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (thread) => thread.createdAt, // Already ISO string from database
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (thread) => thread.updatedAt, // Already ISO string from database
    }),
    messages: t.field({
      type: [MessageType],
      description: "Messages in this thread (batched with DataLoader)",
      resolve: async (thread, args, context) => {
        // Create DataLoader if not exists (per-request caching)
        if (!context.messagesByThreadLoader) {
          context.messagesByThreadLoader = createMessagesByThreadLoader();
        }
        return context.messagesByThreadLoader.load(thread.id);
      },
    }),
  }),
});

// Message GraphQL object type (referenced by Thread.messages)
const MessageType = builder.objectRef<Message>("Message").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    threadId: t.exposeString("threadId"),
    ownerUserId: t.exposeString("ownerUserId"),
    role: t.exposeString("role"),
    content: t.field({
      type: "JSON",
      description: "Message content blocks (ContentBlock[] stored as JSONB)",
      resolve: (message) => message.content, // Pass-through JSONB from database
    }),
    toolCalls: t.field({
      type: "JSON",
      nullable: true,
      description: "Tool call IDs referenced in this message (JSON array)",
      resolve: (message) => message.toolCalls,
    }),
    tokensUsed: t.exposeInt("tokensUsed", {
      nullable: true,
      description: "Number of tokens used",
    }),
    timestamp: t.field({
      type: "DateTime",
      resolve: (message) => message.timestamp, // Already ISO string from database
    }),
    requestId: t.exposeString("requestId", {
      nullable: true,
      description:
        "Agent request ID (for user messages that trigger agent execution)",
    }),
    idempotencyKey: t.exposeString("idempotencyKey", {
      nullable: true,
      description: "Idempotency key for deduplication (prevents duplicate messages)",
    }),
  }),
});

// Return type for createThreadWithMessage mutation
const ThreadWithMessageType = builder
  .objectRef<{ thread: Thread; message: Message }>("ThreadWithMessage")
  .implement({
    description: "Thread with initial message (atomic creation response)",
    fields: (t) => ({
      thread: t.field({
        type: ThreadType,
        resolve: (parent) => parent.thread,
      }),
      message: t.field({
        type: MessageType,
        resolve: (parent) => parent.message,
      }),
    }),
  });

// Input types for mutations
const CreateThreadInput = builder.inputType("CreateThreadInput", {
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      required: false,
      description: "Optional client-provided UUID (for optimistic updates)",
    }),
    branchTitle: t.string({ required: true }),
    parentThreadId: t.id({ required: false }),
  }),
});

const CreateThreadWithMessageInput = builder.inputType("CreateThreadWithMessageInput", {
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      required: false,
      description: "Optional client-provided UUID (for optimistic updates)",
    }),
    branchTitle: t.string({ required: true }),
    parentThreadId: t.id({ required: false }),
    messageContent: t.string({
      required: true,
      description: "Initial message content",
    }),
    messageIdempotencyKey: t.field({
      type: "UUID",
      required: false,
      description: "Idempotency key for the initial message (prevents duplicates)",
    }),
    requestId: t.field({
      type: "UUID",
      required: false,
      description: "Optional client-provided requestId for agent request (enables optimistic updates)",
    }),
  }),
});

const UpdateThreadInput = builder.inputType("UpdateThreadInput", {
  fields: (t) => ({
    branchTitle: t.string({ required: false }),
    parentThreadId: t.id({ required: false }),
    blacklistedBranches: t.stringList({
      required: false,
      description: "Array of branch IDs to hide from context",
    }),
  }),
});

const AddContextReferenceInput = builder.inputType("AddContextReferenceInput", {
  fields: (t) => ({
    threadId: t.id({
      required: true,
      description: "Thread ID to add reference to",
    }),
    entityType: t.string({
      required: true,
      description: "Type: file, folder, thread",
    }),
    entityReference: t.string({
      required: true,
      description: "Entity path or ID",
    }),
    source: t.string({
      required: true,
      description: "Source: user-added, agent-added, inherited",
    }),
    priorityTier: t.int({
      required: false,
      description: "Priority: 1 (high) to 3 (low)",
    }),
  }),
});

const CreateMessageInput = builder.inputType("CreateMessageInput", {
  fields: (t) => ({
    threadId: t.id({
      required: true,
      description: "Thread ID to add message to",
    }),
    role: t.string({
      required: true,
      description: "Message role: user, assistant, system",
    }),
    content: t.string({
      required: true,
      description: "Message content (text or JSON string of ContentBlockDTO[])",
    }),
    toolCalls: t.stringList({
      required: false,
      description: "Tool call IDs referenced in this message",
    }),
    tokensUsed: t.int({
      required: false,
      description: "Number of tokens used",
    }),
    idempotencyKey: t.field({
      type: "UUID",
      required: false,
      description: "Idempotency key for deduplication (prevents duplicate messages)",
    }),
    requestId: t.field({
      type: "UUID",
      required: false,
      description: "Optional client-provided requestId for agent request (enables optimistic updates)",
    }),
  }),
});

// Queries
builder.queryField("thread", (t) =>
  t.field({
    type: ThreadType,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await threadRepository.findById(args.id);
    },
  })
);

builder.queryField("threads", (t) =>
  t.field({
    type: [ThreadType],
    args: {}, // NO OPTIONAL ARGS - just get all threads for current user
    resolve: async (parent, args, context) => {
      return await threadRepository.findAllThreads(context.userId);
    },
  })
);

builder.queryField("messages", (t) =>
  t.field({
    type: [MessageType],
    description: "Get messages for a thread",
    args: {
      threadId: t.arg.id({
        required: true,
        description: "Thread ID to fetch messages for",
      }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (parent, args, context) => {
      // Verify thread ownership
      const thread = await threadRepository.findById(args.threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      return await messageRepository.findByThreadId(
        args.threadId,
        args.limit,
        args.offset
      );
    },
  })
);

// Mutations
builder.mutationField("createThread", (t) =>
  t.field({
    type: ThreadType,
    args: {
      input: t.arg({ type: CreateThreadInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await threadRepository.create({
        id: args.input.id || undefined,
        ownerUserId: context.userId,
        parentThreadId: args.input.parentThreadId || null,
        branchTitle: args.input.branchTitle,
        creator: "user" as const,
      });
    },
  })
);

builder.mutationField("createThreadWithMessage", (t) =>
  t.field({
    type: ThreadWithMessageType,
    description: "Create thread with initial message and trigger execution (atomic operation)",
    args: {
      input: t.arg({ type: CreateThreadWithMessageInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      // Call ThreadService with atomic creation (thin resolver pattern)
      // Service layer handles: thread creation + message creation + agent_request + async execution
      return await ThreadService.createThreadWithMessage({
        userId: context.userId,
        title: args.input.branchTitle,
        messageContent: args.input.messageContent,
        parentThreadId: args.input.parentThreadId || undefined,
        messageIdempotencyKey: args.input.messageIdempotencyKey,
        requestId: args.input.requestId, // Pass through client-provided UUID
      });
    },
  })
);

builder.mutationField("updateThread", (t) =>
  t.field({
    type: ThreadType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateThreadInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const thread = await threadRepository.findById(args.id);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }
      return await threadRepository.update(args.id, args.input);
    },
  })
);

builder.mutationField("deleteThread", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      const thread = await threadRepository.findById(args.id);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }
      await threadRepository.delete(args.id);
      return true;
    },
  })
);

// Context Reference Mutations
builder.mutationField("addContextReference", (t) =>
  t.field({
    type: ContextReferenceType,
    description: "Add a context reference to a thread",
    args: {
      input: t.arg({ type: AddContextReferenceInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      // Verify thread ownership
      const thread = await threadRepository.findById(args.input.threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      // Create context reference
      return await contextReferenceRepository.create({
        threadId: args.input.threadId,
        ownerUserId: context.userId,
        entityType: args.input.entityType as "file" | "folder" | "thread",
        entityReference: args.input.entityReference,
        source: args.input.source as "user-added" | "agent-added" | "inherited",
        priorityTier: args.input.priorityTier || null,
      });
    },
  })
);

builder.mutationField("removeContextReference", (t) =>
  t.field({
    type: "Boolean",
    description: "Remove a context reference from a thread",
    args: {
      id: t.arg.id({ required: true, description: "Context reference ID" }),
    },
    resolve: async (parent, args, context) => {
      // Verify ownership via context reference
      const ref = await contextReferenceRepository.findById(args.id);
      if (!ref) {
        throw new Error("Context reference not found");
      }
      if (ref.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      await contextReferenceRepository.delete(args.id);
      return true;
    },
  })
);

builder.mutationField("updateContextReferencePriority", (t) =>
  t.field({
    type: ContextReferenceType,
    description: "Update priority of a context reference",
    args: {
      id: t.arg.id({ required: true, description: "Context reference ID" }),
      priorityTier: t.arg.int({
        required: true,
        description: "Priority: 1 (high) to 3 (low)",
      }),
    },
    resolve: async (parent, args, context) => {
      // Verify ownership
      const ref = await contextReferenceRepository.findById(args.id);
      if (!ref) {
        throw new Error("Context reference not found");
      }
      if (ref.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      // Validate priority tier
      if (args.priorityTier < 1 || args.priorityTier > 3) {
        throw new Error("Priority tier must be between 1 and 3");
      }

      return await contextReferenceRepository.updatePriority(
        args.id,
        args.priorityTier as 1 | 2 | 3
      );
    },
  })
);

// Message Mutations
builder.mutationField("createMessage", (t) =>
  t.field({
    type: MessageType,
    description: "Create a new message in a thread",
    args: {
      input: t.arg({ type: CreateMessageInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      // Verify thread ownership
      const thread = await threadRepository.findById(args.input.threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      // Call MessageService with execution triggering (thin resolver pattern)
      // Service layer handles: message creation + agent_request + async execution
      const message = await MessageService.createMessageWithExecution({
        threadId: args.input.threadId,
        userId: context.userId,
        role: args.input.role as "user" | "assistant" | "system",
        content: args.input.content,
        contextReferences: [],
        idempotencyKey: args.input.idempotencyKey,
        requestId: args.input.requestId, // Pass through client-provided UUID
      });

      return message;
    },
  })
);

builder.mutationField("deleteMessage", (t) =>
  t.field({
    type: "Boolean",
    description: "Delete a message from a thread",
    args: {
      id: t.arg.id({ required: true, description: "Message ID" }),
    },
    resolve: async (parent, args, context) => {
      // Verify ownership via message
      const message = await messageRepository.findById(args.id);
      if (!message) {
        throw new Error("Message not found");
      }
      if (message.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      await messageRepository.delete(args.id);
      return true;
    },
  })
);

// ============================================================================
// Consolidation Types and Mutations
// ============================================================================

const ConsolidateBranchesInput = builder.inputType("ConsolidateBranchesInput", {
  fields: (t) => ({
    threadId: t.id({
      required: true,
      description: "Parent thread ID",
    }),
    childBranchIds: t.idList({
      required: true,
      description: "Array of child branch IDs to consolidate",
    }),
    targetFolder: t.string({
      required: true,
      description: "Target folder path for the consolidated file",
    }),
    fileName: t.string({
      required: true,
      description: "File name for the consolidated output",
    }),
  }),
});

const ConsolidationResultType = builder
  .objectRef<{
    requestId: string;
    fileId: string;
    status: string;
  }>("ConsolidationResult")
  .implement({
    fields: (t) => ({
      requestId: t.exposeID("requestId", {
        description: "Agent request ID for subscribing to progress events",
      }),
      fileId: t.exposeID("fileId", {
        description: "ID of the file that will be created (permanent ID)",
      }),
      status: t.exposeString("status", {
        description: "Status: pending, in_progress, completed, failed",
      }),
    }),
  });

builder.mutationField("consolidateBranches", (t) =>
  t.field({
    type: ConsolidationResultType,
    description:
      "Consolidate multiple branches into a single file. Returns requestId for subscribing to progress via realtime.",
    args: {
      input: t.arg({ type: ConsolidateBranchesInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      // Verify thread ownership
      const thread = await threadRepository.findById(args.input.threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }
      if (thread.ownerUserId !== context.userId) {
        throw new Error("Unauthorized");
      }

      // Start consolidation (async execution)
      const result = await ConsolidationService.startConsolidation(
        {
          threadId: args.input.threadId,
          childBranchIds: args.input.childBranchIds,
          targetFolder: args.input.targetFolder,
          fileName: args.input.fileName,
        },
        context.userId
      );

      return result;
    },
  })
);
