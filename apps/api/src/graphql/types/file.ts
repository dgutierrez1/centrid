/**
 * File GraphQL Type
 * File operations with Upload scalar for multipart uploads
 */

import { builder } from "../builder.ts";
import { FileService } from "../../services/fileService.ts";
import { fileRepository } from "../../repositories/file.ts";
import type { File } from "../../db/types.ts";

// ============================================================================
// File Type
// ============================================================================

const FileType = builder.objectRef<File>("File").implement({
  description: "Workspace file with content and metadata",
  fields: (t) => ({
    id: t.exposeID("id", { description: "File ID" }),
    ownerUserId: t.exposeString("ownerUserId", {
      description: "Owner user ID",
    }),
    name: t.exposeString("name", { description: "Filename with extension" }),
    path: t.exposeString("path", { description: "Full path computed from folder hierarchy + name" }),
    content: t.exposeString("content", { description: "File content" }),
    folderId: t.exposeString("folderId", {
      nullable: true,
      description: "Parent folder ID",
    }),
    shadowDomainId: t.exposeString("shadowDomainId", {
      nullable: true,
      description: "Shadow entity ID for search",
    }),
    storagePath: t.exposeString("storagePath", {
      nullable: true,
      description: "Supabase Storage path for large files",
    }),
    fileSize: t.exposeInt("fileSize", {
      nullable: true,
      description: "File size in bytes",
    }),
    mimeType: t.exposeString("mimeType", {
      nullable: true,
      description: "MIME type",
    }),
    indexingStatus: t.exposeString("indexingStatus", {
      nullable: true,
      description: "Indexing status: pending, completed, failed",
    }),
    source: t.exposeString("source", {
      description: "Source: ai-generated, user-uploaded",
    }),
    isAIGenerated: t.exposeBoolean("isAIGenerated", {
      description: "Whether file was AI-generated",
    }),
    createdBy: t.exposeString("createdBy", {
      nullable: true,
      description: "Creator: user or agent name",
    }),
    lastEditedBy: t.exposeString("lastEditedBy", {
      nullable: true,
      description: "Last editor",
    }),
    lastEditedAt: t.field({
      type: "DateTime",
      nullable: true,
      description: "Last edit timestamp",
      resolve: (file) => file.lastEditedAt, // Already ISO string from database or null
    }),
    version: t.exposeInt("version", {
      nullable: true,
      description: "Version number for optimistic locking",
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "Creation timestamp",
      resolve: (file) => file.createdAt, // Already ISO string from database
    }),
    updatedAt: t.field({
      type: "DateTime",
      description: "Last update timestamp",
      resolve: (file) => file.updatedAt, // Already ISO string from database
    }),
  }),
});

// ============================================================================
// File Provenance Type
// ============================================================================

/**
 * Provenance context for file creation or modification
 */
const ProvenanceContextType = builder.objectType("ProvenanceContext", {
  description: "Thread and message context for file operation",
  fields: (t) => ({
    threadId: t.string({ description: "Thread ID where operation occurred" }),
    messageId: t.string({
      nullable: true,
      description: "Message ID that triggered operation",
    }),
  }),
});

/**
 * File provenance information
 * Tracks creation and editing history for navigating back to source
 */
const FileProvenanceType = builder.objectType("FileProvenance", {
  description: "File creation and edit history",
  fields: (t) => ({
    createdIn: t.field({
      type: ProvenanceContextType,
      nullable: true,
      description: "Thread/message where file was created",
    }),
    lastModifiedIn: t.field({
      type: ProvenanceContextType,
      nullable: true,
      description: "Thread/message where file was last modified",
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateFileInput = builder.inputType("CreateFileInput", {
  description: "Input for creating a new file",
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      required: false,
      description: "Optional client-provided UUID (for optimistic updates)",
    }),
    name: t.string({
      required: true,
      description: "Filename with extension (e.g., 'document.md')",
    }),
    content: t.string({ required: true, description: "File content" }),
    threadId: t.string({
      required: false,
      description: "Thread ID to link file to (creates context reference)",
    }),
    folderId: t.string({
      required: false,
      description: "Folder ID to organize file",
    }),
  }),
});

const UpdateFileInput = builder.inputType("UpdateFileInput", {
  description: "Input for updating file content",
  fields: (t) => ({
    content: t.string({ required: true, description: "New file content" }),
    version: t.int({
      required: false,
      description: "Current version for optimistic locking",
    }),
  }),
});

const UpdateFilePartialInput = builder.inputType("UpdateFilePartialInput", {
  description: "Input for partial file update (rename, move, or edit)",
  fields: (t) => ({
    name: t.string({
      required: false,
      description: "New filename (rename)",
    }),
    content: t.string({
      required: false,
      description: "New content",
    }),
    folderId: t.string({
      required: false,
      description: "New folder ID (move)",
    }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField("file", (t) =>
  t.field({
    type: FileType,
    nullable: true,
    description: "Get file by ID",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      try {
        return await FileService.getFile(args.id, context.userId);
      } catch (error) {
        return null;
      }
    },
  })
);

builder.queryField("files", (t) =>
  t.field({
    type: [FileType],
    description: "Get all files for current user",
    args: {}, // NO OPTIONAL ARGS - just get all files for current user
    resolve: async (parent, args, context) => {
      return await fileRepository.findByUserId(context.userId);
    },
  })
);

builder.queryField("fileByPath", (t) =>
  t.field({
    type: FileType,
    nullable: true,
    description: "Get file by path",
    args: {
      path: t.arg.string({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await fileRepository.findByPath(args.path, context.userId);
    },
  })
);

builder.queryField("fileProvenance", (t) =>
  t.field({
    type: FileProvenanceType,
    nullable: true,
    description: "Get file creation and edit history for navigation",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      try {
        return await FileService.getFileProvenance(args.id, context.userId);
      } catch (error) {
        console.error("Failed to get file provenance:", error);
        return null;
      }
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField("createFile", (t) =>
  t.field({
    type: FileType,
    description: "Create a new file",
    args: {
      input: t.arg({ type: CreateFileInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await FileService.createFile({
        id: args.input.id || undefined, // Client-provided UUID for optimistic updates
        userId: context.userId,
        name: args.input.name,
        content: args.input.content,
        threadId: args.input.threadId || undefined,
        folderId: args.input.folderId || undefined,
      });
    },
  })
);

builder.mutationField("updateFile", (t) =>
  t.field({
    type: FileType,
    description: "Update file content with optimistic locking",
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateFileInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await FileService.updateFile(args.id, context.userId, {
        content: args.input.content,
        version: args.input.version || undefined,
      });
    },
  })
);

builder.mutationField("updateFilePartial", (t) =>
  t.field({
    type: FileType,
    description: "Partial file update (rename, move, or edit content)",
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateFilePartialInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await FileService.updateFilePartial(args.id, context.userId, {
        name: args.input.name || undefined,
        content: args.input.content || undefined,
        folderId: args.input.folderId || undefined,
      });
    },
  })
);

builder.mutationField("deleteFile", (t) =>
  t.field({
    type: "Boolean",
    description: "Delete file",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      await FileService.deleteFile(args.id, context.userId);
      return true;
    },
  })
);

// ============================================================================
// Upload Scalar (Multipart file uploads)
// ============================================================================

/**
 * uploadFile mutation - Upload a file via multipart form data
 *
 * Accepts File objects from the frontend and stores them as text content.
 * Currently supports text-based files (.txt, .md) only.
 */
builder.mutationField("uploadFile", (t) =>
  t.field({
    type: FileType,
    description: "Upload a file via multipart form data",
    args: {
      file: t.arg({
        type: "Upload",
        required: true,
        description: "File to upload",
      }),
      folderId: t.arg.id({
        required: false,
        description: "Optional folder ID",
      }),
      threadId: t.arg.id({
        required: false,
        description: "Optional thread ID for context",
      }),
    },
    resolve: async (parent, args, context) => {
      // Await the file upload promise (GraphQL Yoga resolves this from multipart request)
      const upload = await args.file;

      // Create a readable stream and read the file content
      const stream = upload.createReadStream();
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Convert to string (assumes text-based files)
      const content = Buffer.concat(chunks).toString("utf-8");

      // Use filename from upload as the name
      const name = upload.filename;

      // Create file using FileService
      return await FileService.createFile({
        userId: context.userId,
        name,
        content,
        folderId: args.folderId || undefined,
        threadId: args.threadId || undefined,
      });
    },
  })
);
