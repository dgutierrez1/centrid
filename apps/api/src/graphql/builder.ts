/**
 * Pothos Schema Builder
 * Type-safe GraphQL schema construction without Drizzle plugin
 * (Drizzle plugin requires v1.0.0-beta, we're on 0.44.7)
 */

import SchemaBuilder from "@pothos/core";
import ValidationPlugin from "@pothos/plugin-validation";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import type DataLoader from "dataloader";
import type { Folder, Message } from "../db/types.js";
import type { FileUpload } from "graphql-upload";

// Initialize builder with plugins
export const builder = new SchemaBuilder<{
  // Global context type (request-scoped data)
  Context: {
    userId: string;
    // DataLoaders for N+1 prevention (created per-request)
    folderChildrenLoader?: DataLoader<string | null, Folder[]>;
    messagesByThreadLoader?: DataLoader<string, Message[]>;
  };
  // Scalars
  Scalars: {
    ID: { Input: string; Output: string };
    DateTime: { Input: string; Output: string };
    Upload: { Input: Promise<FileUpload>; Output: never };
    JSON: { Input: any; Output: any };
  };
}>({
  plugins: [ValidationPlugin, DataloaderPlugin],
});

// Define DateTime scalar (ISO 8601 string pass-through)
builder.scalarType("DateTime", {
  serialize: (value: string) => {
    // Database returns ISO strings with mode: 'string', pass through directly
    if (typeof value === "string") {
      return value;
    }
    throw new Error("DateTime must be an ISO string from database");
  },
  parseValue: (value) => {
    // GraphQL input expects ISO strings, pass through directly
    if (typeof value === "string") {
      return value;
    }
    throw new Error("DateTime input must be an ISO string");
  },
});

// Define Upload scalar (for multipart file uploads)
builder.scalarType("Upload", {
  description: "File upload scalar for multipart form data",
  // Upload scalar is handled by GraphQL Yoga's multipart processor
  // It resolves to a FileUpload promise that contains: filename, mimetype, encoding, createReadStream()
  serialize: () => {
    throw new Error("Upload scalar cannot be serialized (output only)");
  },
  parseValue: (value) => {
    // GraphQL Yoga automatically processes multipart uploads
    // The value here is already a Promise<FileUpload> from the multipart processor
    return value as Promise<FileUpload>;
  },
});

// Define JSON scalar (for arbitrary JSON data)
builder.scalarType("JSON", {
  description: "Arbitrary JSON data (pass-through from JSONB database columns)",
  serialize: (value) => value, // Pass-through to client
  parseValue: (value) => value, // Pass-through from client
});

// Root Query type
builder.queryType({});

// Root Mutation type
builder.mutationType({});
