/**
 * Shadow Entity GraphQL Type
 * Semantic search layer for files, threads, and knowledge graph nodes
 */

import { builder } from '../builder.ts';
import { shadowEntityRepository } from '../../repositories/shadowEntity.ts';
import type { ShadowEntity } from '../../db/types.ts';

// ============================================================================
// Shadow Entity Type
// ============================================================================

const ShadowEntityType = builder.objectRef<ShadowEntity>('ShadowEntity').implement({
  description: 'Shadow entity for semantic search (embeddings, summaries, metadata)',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Shadow entity ID' }),
    ownerUserId: t.exposeString('ownerUserId', { description: 'Owner user ID' }),
    entityId: t.exposeString('entityId', { description: 'Source entity ID (file, thread, kg_node)' }),
    entityType: t.exposeString('entityType', { description: 'Source entity type: file, thread, kg_node' }),
    embedding: t.field({
      type: ['Float'],
      nullable: true,
      description: 'Vector embedding for semantic search (768 dimensions) - set by background job',
      resolve: (entity) => entity.embedding,
    }),
    summary: t.exposeString('summary', { nullable: true, description: 'AI-generated summary of source entity - set by background job' }),
    structureMetadata: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Entity-specific metadata (file structure, thread metadata, etc.)',
      resolve: (entity) => entity.structureMetadata || null,
    }),
    lastUpdated: t.field({
      type: 'DateTime',
      nullable: false,
      description: 'Last update timestamp (embedding, summary, metadata)',
      resolve: (entity) => entity.lastUpdated,
    }),
    createdAt: t.field({
      type: 'DateTime',
      nullable: false,
      description: 'Creation timestamp',
      resolve: (entity) => entity.createdAt,
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateShadowEntityInput = builder.inputType('CreateShadowEntityInput', {
  description: 'Input for creating a shadow entity',
  fields: (t) => ({
    entityId: t.string({ required: true, description: 'Source entity ID' }),
    entityType: t.string({ required: true, description: 'Source entity type: file, thread, kg_node' }),
    summary: t.string({ required: false, description: 'AI-generated summary' }),
  }),
});

const UpdateShadowEntityInput = builder.inputType('UpdateShadowEntityInput', {
  description: 'Input for updating shadow entity (summary, embedding, metadata)',
  fields: (t) => ({
    summary: t.string({ required: false, description: 'Updated summary' }),
    embedding: t.field({ type: ['Float'], required: false, description: 'Updated embedding (768 dimensions)' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('shadowEntity', (t) =>
  t.field({
    type: ShadowEntityType,
    nullable: true,
    description: 'Get shadow entity by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      try {
        return await shadowEntityRepository.findById(args.id, context.userId);
      } catch (error) {
        return null;
      }
    },
  })
);

builder.queryField('shadowEntitiesByEntity', (t) =>
  t.field({
    type: [ShadowEntityType],
    description: 'Get shadow entities for a source entity (file, thread, kg_node)',
    args: {
      entityId: t.arg.id({ required: true }),
      entityType: t.arg.string({ required: true, description: 'Entity type: file, thread, kg_node' }),
    },
    resolve: async (parent, args, context) => {
      const entityType = args.entityType as 'file' | 'thread' | 'kg_node';
      return await shadowEntityRepository.findByEntity(
        args.entityId,
        entityType,
        context.userId
      );
    },
  })
);

builder.queryField('shadowEntitiesByFile', (t) =>
  t.field({
    type: [ShadowEntityType],
    description: 'Get shadow entities for a file',
    args: {
      fileId: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await shadowEntityRepository.findByFileId(args.fileId, context.userId);
    },
  })
);

builder.queryField('shadowEntities', (t) =>
  t.field({
    type: [ShadowEntityType],
    description: 'Get all shadow entities for the current user',
    args: {
      limit: t.arg.int({ required: false, defaultValue: 100 }),
    },
    resolve: async (parent, args, context) => {
      return await shadowEntityRepository.findByUserId(context.userId, args.limit);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('createShadowEntity', (t) =>
  t.field({
    type: ShadowEntityType,
    description: 'Create a new shadow entity for semantic search',
    args: {
      input: t.arg({ type: CreateShadowEntityInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const { entityId, entityType, summary } = args.input;

      // Validate entityType
      if (!['file', 'thread', 'kg_node'].includes(entityType)) {
        throw new Error(`Invalid entityType: ${entityType}. Must be one of: file, thread, kg_node`);
      }

      // Check if shadow entity already exists
      const exists = await shadowEntityRepository.exists(
        entityId,
        entityType as 'file' | 'thread' | 'kg_node',
        context.userId
      );

      if (exists) {
        throw new Error(`Shadow entity already exists for ${entityType} ${entityId}`);
      }

      return await shadowEntityRepository.create({
        ownerUserId: context.userId,
        entityId,
        entityType: entityType as 'file' | 'thread' | 'kg_node',
        summary,
      });
    },
  })
);

builder.mutationField('updateShadowEntity', (t) =>
  t.field({
    type: ShadowEntityType,
    nullable: true,
    description: 'Update shadow entity (summary, embedding, metadata)',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateShadowEntityInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      // Validate embedding dimensions (must be 768 for OpenAI embeddings)
      if ('embedding' in args.input && args.input.embedding && args.input.embedding.length !== 768) {
        throw new Error(`Invalid embedding dimensions: ${args.input.embedding.length}. Must be 768.`);
      }

      // Build updates only for provided fields (preserves null vs omitted distinction)
      const updates: Partial<{ summary: string | null; embedding: number[] | null }> = {};

      if ('summary' in args.input) {
        updates.summary = args.input.summary;
      }
      if ('embedding' in args.input) {
        updates.embedding = args.input.embedding;
      }

      return await shadowEntityRepository.update(
        args.id,
        context.userId,
        updates
      );
    },
  })
);

builder.mutationField('deleteShadowEntity', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Delete shadow entity (admin/cleanup only - normally persist for history)',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await shadowEntityRepository.delete(args.id, context.userId);
    },
  })
);
