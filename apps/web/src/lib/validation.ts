// Centrid AI Filesystem - Zod Validation Schemas
// Version: 3.1 - Supabase Plus MVP Architecture

import { z } from "zod";

// User and Authentication Schemas
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional()
    .nullable(),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  usage_count: z.number().min(0).default(0),
  subscription_status: z
    .enum(["active", "inactive", "canceled", "past_due"])
    .default("inactive"),
  subscription_id: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
});

// Document Schemas
export const documentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long"),
  file_type: z.enum(["markdown", "text", "pdf"]),
  file_size: z
    .number()
    .min(1)
    .max(10 * 1024 * 1024), // 10MB max
  storage_path: z.string().min(1),
  processing_status: z
    .enum(["pending", "processing", "completed", "failed"])
    .default("pending"),
  content_text: z.string().optional().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const uploadDocumentSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        ["text/plain", "text/markdown", "application/pdf"].includes(file.type),
      "File type must be text, markdown, or PDF"
    ),
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .optional(),
});

export const documentChunkSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  chunk_index: z.number().min(0),
  section_title: z.string().max(500).optional().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
});

// AI Agent Schemas
export const agentRequestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid().optional().nullable(),
  agent_type: z.enum(["create", "edit", "research"]),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content too long"),
  status: z
    .enum(["pending", "processing", "completed", "failed", "cancelled"])
    .default("pending"),
  progress: z.number().min(0).max(1).default(0),
  results: z.record(z.any()).default({}),
  context_documents: z.array(z.string().uuid()).default([]),
  model_used: z.string().optional().nullable(),
  tokens_used: z.number().min(0).default(0),
  cost_usd: z.number().min(0).default(0),
  error_message: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createAgentRequestSchema = z.object({
  agent_type: z.enum(["create", "edit", "research"]),
  content: z
    .string()
    .min(1, "Request content is required")
    .max(10000, "Content too long"),
  context_documents: z.array(z.string().uuid()).default([]),
  session_id: z.string().uuid().optional(),
  preferences: z
    .object({
      model: z
        .enum(["gpt-4o", "gpt-4o-mini", "claude-haiku-4-5-20251001"])
        .optional(),
      temperature: z.number().min(0).max(1).optional(),
      max_tokens: z.number().min(100).max(4000).optional(),
    })
    .optional(),
});

export const agentSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_name: z.string().max(200).optional().nullable(),
  request_chain: z.array(z.string().uuid()).default([]),
  context_state: z.record(z.any()).default({}),
  last_activity_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const createAgentSessionSchema = z.object({
  session_name: z
    .string()
    .min(1, "Session name is required")
    .max(200, "Name too long")
    .optional(),
});

// Search Schemas
export const searchRequestSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(1000, "Query too long"),
  search_type: z.enum(["documents", "chunks", "both"]).default("both"),
  file_types: z.array(z.enum(["markdown", "text", "pdf"])).default([]),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Sync Schemas
export const syncOperationSchema = z.object({
  type: z.enum(["create", "update", "delete"]),
  entity_type: z.enum(["document", "agent_request", "agent_session"]),
  entity_id: z.string().uuid(),
  data: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
});

export const syncRequestSchema = z.object({
  device_id: z.string().min(1, "Device ID is required"),
  last_sync_timestamp: z.string().datetime(),
  operations: z.array(syncOperationSchema).default([]),
});

// Usage Event Schemas
export const usageEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_type: z.enum(["ai_request", "document_processing", "text_search"]),
  tokens_used: z.number().min(0).default(0),
  cost_usd: z.number().min(0).default(0),
  model_used: z.string().optional().nullable(),
  request_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
});

// Billing Schemas
export const billingWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  application_id: z.number(),
  user_id: z.string(),
  version: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

// API Response Schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
  error: z.string().optional(),
});

// Form Validation Helpers
export const createValidationErrors = (error: z.ZodError) => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
};

export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): {
  success: boolean;
  data?: T;
  error?: string;
} => {
  try {
    const data = schema.parse(value);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
};

// File validation helpers
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const isValidFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
};

// Common validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
];
export const ALLOWED_FILE_EXTENSIONS = ["txt", "md", "markdown", "pdf"];
export const MAX_SEARCH_QUERY_LENGTH = 1000;
export const MAX_AGENT_CONTENT_LENGTH = 10000;
export const MAX_FILENAME_LENGTH = 255;
export const MAX_SESSION_NAME_LENGTH = 200;

// Export all schemas
export type UserProfile = z.infer<typeof userProfileSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type Document = z.infer<typeof documentSchema>;
export type UploadDocumentData = z.infer<typeof uploadDocumentSchema>;
export type DocumentChunk = z.infer<typeof documentChunkSchema>;
export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type CreateAgentRequestData = z.infer<typeof createAgentRequestSchema>;
export type AgentSession = z.infer<typeof agentSessionSchema>;
export type CreateAgentSessionData = z.infer<typeof createAgentSessionSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SyncOperation = z.infer<typeof syncOperationSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type UsageEvent = z.infer<typeof usageEventSchema>;
export type BillingWebhook = z.infer<typeof billingWebhookSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;
