/**
 * Search GraphQL Type
 * Semantic search with union types for polymorphic results
 */

import { builder } from "../builder.ts";
import { SearchService } from "../../services/searchService.ts";

// ============================================================================
// Search Result Types (Polymorphic Union)
// ============================================================================

// Base interface for search results
interface SearchResultBase {
  id: string;
  excerpt: string;
  relevance: number;
  entityType: "file" | "thread" | "concept";
}

// File search result
interface FileSearchResult extends SearchResultBase {
  entityType: "file";
  path: string;
}

// Thread search result (future)
interface ThreadSearchResult extends SearchResultBase {
  entityType: "thread";
  title: string;
}

// Concept search result (future - knowledge graph)
interface ConceptSearchResult extends SearchResultBase {
  entityType: "concept";
  conceptName: string;
}

// Union type for all search results
type SearchResult = FileSearchResult | ThreadSearchResult | ConceptSearchResult;

// ============================================================================
// Autocomplete Result Type
// ============================================================================

interface AutocompleteItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder" | "thread";
  branchName?: string;
  branchId?: string;
  relevanceScore?: number;
  lastModified?: string;
}

// ============================================================================
// GraphQL Types
// ============================================================================

// File search result type
const FileSearchResultType = builder
  .objectRef<FileSearchResult>("FileSearchResult")
  .implement({
    description: "File search result",
    fields: (t) => ({
      id: t.exposeID("id", { description: "File ID" }),
      path: t.exposeString("path", { description: "File path" }),
      excerpt: t.exposeString("excerpt", {
        description: "Content excerpt with context",
      }),
      relevance: t.exposeFloat("relevance", {
        description: "Relevance score (0-1)",
      }),
      entityType: t.exposeString("entityType", {
        description: "Entity type: file",
      }),
    }),
  });

// Thread search result type (future)
const ThreadSearchResultType = builder
  .objectRef<ThreadSearchResult>("ThreadSearchResult")
  .implement({
    description: "Thread search result",
    fields: (t) => ({
      id: t.exposeID("id", { description: "Thread ID" }),
      title: t.exposeString("title", { description: "Thread title" }),
      excerpt: t.exposeString("excerpt", {
        description: "Content excerpt with context",
      }),
      relevance: t.exposeFloat("relevance", {
        description: "Relevance score (0-1)",
      }),
      entityType: t.exposeString("entityType", {
        description: "Entity type: thread",
      }),
    }),
  });

// Concept search result type (future - knowledge graph)
const ConceptSearchResultType = builder
  .objectRef<ConceptSearchResult>("ConceptSearchResult")
  .implement({
    description: "Concept search result from knowledge graph",
    fields: (t) => ({
      id: t.exposeID("id", { description: "Concept ID" }),
      conceptName: t.exposeString("conceptName", {
        description: "Concept name",
      }),
      excerpt: t.exposeString("excerpt", {
        description: "Concept description",
      }),
      relevance: t.exposeFloat("relevance", {
        description: "Relevance score (0-1)",
      }),
      entityType: t.exposeString("entityType", {
        description: "Entity type: concept",
      }),
    }),
  });

// Union type for search results
const SearchResultType = builder.unionType("SearchResult", {
  description: "Union of all search result types",
  types: [
    FileSearchResultType,
    ThreadSearchResultType,
    ConceptSearchResultType,
  ],
  resolveType: (result) => {
    switch (result.entityType) {
      case "file":
        return FileSearchResultType;
      case "thread":
        return ThreadSearchResultType;
      case "concept":
        return ConceptSearchResultType;
      default:
        throw new Error(`Unknown entity type: ${result.entityType}`);
    }
  },
});

// Autocomplete result type
const AutocompleteItemType = builder
  .objectRef<AutocompleteItem>("AutocompleteItem")
  .implement({
    description: "Autocomplete result for fuzzy matching",
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      path: t.exposeString("path"),
      type: t.exposeString("type", {
        description: "Entity type: file, folder, thread",
      }),
      branchName: t.exposeString("branchName", { nullable: true }),
      branchId: t.exposeString("branchId", { nullable: true }),
      relevanceScore: t.exposeFloat("relevanceScore", { nullable: true }),
      lastModified: t.exposeString("lastModified", { nullable: true }),
    }),
  });

// ============================================================================
// Input Types
// ============================================================================

const SearchInput = builder.inputType("SearchInput", {
  description: "Search input parameters",
  fields: (t) => ({
    query: t.string({ required: true, description: "Search query" }),
    limit: t.int({
      required: false,
      description: "Max results (default: 10)",
    }),
    fileTypes: t.stringList({
      required: false,
      description: 'Filter by file extensions (e.g., ["ts", "md"])',
    }),
    entityTypes: t.stringList({
      required: false,
      description:
        'Filter by entity types (file, thread, concept). Default: ["file"]',
    }),
  }),
});

const AutocompleteInput = builder.inputType("AutocompleteInput", {
  description: "Autocomplete input parameters for quick fuzzy search",
  fields: (t) => ({
    query: t.string({
      required: true,
      description: "Autocomplete query (fuzzy matching)",
    }),
    entityType: t.string({
      required: false,
      description:
        "Filter by entity type: files, folders, threads. Default: all",
    }),
    limit: t.int({
      required: false,
      description: "Max results (default: 10)",
    }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField("search", (t) =>
  t.field({
    type: [SearchResultType],
    description: "Semantic search across files, threads, and concepts",
    args: {
      input: t.arg({ type: SearchInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const results = await SearchService.search(
        context.userId,
        args.input.query,
        {
          limit: args.input.limit || 10,
          fileTypes: args.input.fileTypes || undefined,
          entityTypes: (args.input.entityTypes as Array<
            "file" | "thread" | "concept"
          >) || ["file"],
        }
      );

      // Map service results to GraphQL types
      return results.map((result) => {
        if (result.entityType === "file") {
          return {
            id: result.id,
            path: result.path,
            excerpt: result.excerpt,
            relevance: result.relevance,
            entityType: "file" as const,
          } as FileSearchResult;
        }
        // Future: Handle thread and concept results
        throw new Error(`Unsupported entity type: ${result.entityType}`);
      });
    },
  })
);

builder.queryField("autocomplete", (t) =>
  t.field({
    type: [AutocompleteItemType],
    description:
      "Autocomplete search for quick fuzzy matching of files, folders, and threads",
    args: {
      input: t.arg({ type: AutocompleteInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const results = await SearchService.autocomplete(
        context.userId,
        args.input.query,
        {
          entityType: args.input.entityType as
            | "files"
            | "folders"
            | "threads"
            | "all"
            | undefined,
          limit: args.input.limit || 10,
        }
      );

      // Map service results to GraphQL types
      return results.map(
        (result) =>
          ({
            id: result.id,
            name: result.name || result.title || "Untitled",
            path: result.path || result.id,
            type: result.type,
            branchName: result.branchName,
            branchId: result.branchId,
            relevanceScore: result.relevanceScore,
            lastModified: result.lastModified,
          } as AutocompleteItem)
      );
    },
  })
);

// ============================================================================
// Future: Vector Search Query (Phase 2)
// ============================================================================

// builder.queryField('semanticSearch', (t) =>
//   t.field({
//     type: [SearchResultType],
//     description: 'Semantic vector search using embeddings',
//     args: {
//       query: t.arg.string({ required: true }),
//       limit: t.arg.int({ required: false }),
//       threshold: t.arg.float({ required: false, description: 'Minimum similarity threshold (0-1)' }),
//     },
//     resolve: async (parent, args, context) => {
//       // Generate embedding for query
//       // Query shadow_entities with pgvector similarity search
//       // Return ranked results
//     },
//   })
// );
