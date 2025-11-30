/**
 * Folder GraphQL Type
 * Hierarchical folder structure with DataLoader optimization
 */

import { builder } from '../builder.ts';
import { FolderService } from '../../services/folderService.ts';
import { folderRepository } from '../../repositories/folder.ts';
import type { Folder } from '../../db/types.ts';
import DataLoader from 'dataloader';

// ============================================================================
// DataLoader for batching child folder queries
// ============================================================================

// Create folder children DataLoader (groups by parent ID)
const createFolderChildrenLoader = (userId: string) =>
  new DataLoader<string | null, Folder[]>(
    async (parentIds) => {
      // Fetch all children for requested parent IDs
      const allChildren: Folder[] = [];
      for (const parentId of parentIds) {
        const children = await folderRepository.findByParentId(parentId, userId);
        allChildren.push(...children);
      }

      // Group results by parent ID
      return parentIds.map((parentId) =>
        allChildren.filter((folder) => folder.parentFolderId === parentId)
      );
    },
    { cache: false } // Disable caching for real-time updates
  );

// ============================================================================
// Folder Type
// ============================================================================

// Create object ref first (forward reference for self-referencing type)
const FolderType = builder.objectRef<Folder>('Folder');

// Then implement it
FolderType.implement({
  description: 'Hierarchical folder for organizing files',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Folder ID' }),
    userId: t.exposeString('userId', { description: 'Owner user ID' }),
    name: t.exposeString('name', { description: 'Folder name' }),
    parentFolderId: t.exposeString('parentFolderId', {
      nullable: true,
      description: 'Parent folder ID (null for root folders)',
    }),
    path: t.exposeString('path', { description: 'Computed path from hierarchy' }),
    createdAt: t.field({
      type: 'DateTime',
      nullable: false,
      description: 'Creation timestamp',
      resolve: (folder) => folder.createdAt, // Already ISO string from database
    }),
    updatedAt: t.field({
      type: 'DateTime',
      nullable: false,
      description: 'Last update timestamp',
      resolve: (folder) => folder.updatedAt, // Already ISO string from database
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateFolderInput = builder.inputType('CreateFolderInput', {
  description: 'Input for creating a new folder',
  fields: (t) => ({
    id: t.field({
      type: 'UUID',
      required: false,
      description: 'Optional client-provided UUID (for optimistic updates)',
    }),
    name: t.string({ required: true, description: 'Folder name' }),
    parentFolderId: t.string({ required: false, description: 'Parent folder ID (null for root)' }),
  }),
});

const UpdateFolderInput = builder.inputType('UpdateFolderInput', {
  description: 'Input for updating folder',
  fields: (t) => ({
    name: t.string({ required: false, description: 'New folder name' }),
    parentFolderId: t.string({ required: false, description: 'New parent folder ID (null for root)' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('folder', (t) =>
  t.field({
    type: FolderType,
    nullable: true,
    description: 'Get folder by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      try {
        return await FolderService.getFolder(args.id, context.userId);
      } catch (error) {
        return null;
      }
    },
  })
);

builder.queryField('folders', (t) =>
  t.field({
    type: [FolderType],
    description: 'Get all folders for current user',
    resolve: async (parent, args, context) => {
      return await FolderService.listFolders(context.userId);
    },
  })
);

builder.queryField('rootFolders', (t) =>
  t.field({
    type: [FolderType],
    description: 'Get root folders (no parent) for current user',
    resolve: async (parent, args, context) => {
      return await folderRepository.findByParentId(null, context.userId);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('createFolder', (t) =>
  t.field({
    type: FolderType,
    description: 'Create a new folder',
    args: {
      input: t.arg({ type: CreateFolderInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await FolderService.createFolder(
        context.userId,
        args.input.name,
        args.input.parentFolderId || null,
        args.input.id || undefined // Client-provided UUID for optimistic updates
      );
    },
  })
);

builder.mutationField('updateFolder', (t) =>
  t.field({
    type: FolderType,
    description: 'Update folder (rename or move)',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateFolderInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const updated = await FolderService.updateFolder(args.id, context.userId, {
        name: args.input.name || undefined,
        parentFolderId: args.input.parentFolderId !== undefined
          ? args.input.parentFolderId || null
          : undefined,
      });
      if (!updated) {
        throw new Error('Folder not found');
      }
      return updated;
    },
  })
);

builder.mutationField('deleteFolder', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Delete folder (must be empty)',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      await FolderService.deleteFolder(args.id, context.userId);
      return true;
    },
  })
);
