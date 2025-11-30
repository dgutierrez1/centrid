/**
 * Shadow Entity Repository
 * Data access layer for shadow_entities table (semantic search)
 */

import { eq, and } from "drizzle-orm";
import { shadowEntities } from "../db/schema.ts";
import { getDB } from "../functions/_shared/db.ts";
import { createLogger } from "../utils/logger.ts";
import type { ShadowEntity, InsertShadowEntity } from "../db/types.js";

const logger = createLogger("repositories/shadowEntity");

export const shadowEntityRepository = {
  /**
   * Find shadow entity by ID
   */
  async findById(
    shadowId: string,
    userId: string
  ): Promise<ShadowEntity | null> {
    const { db, cleanup } = await getDB();
    try {
      const [entity] = await db
        .select()
        .from(shadowEntities)
        .where(
          and(
            eq(shadowEntities.id, shadowId),
            eq(shadowEntities.ownerUserId, userId)
          )
        );
      return entity || null;
    } finally {
      await cleanup();
    }
  },

  /**
   * Find shadow entities by source entity
   */
  async findByEntity(
    entityId: string,
    entityType: "file" | "thread" | "kg_node",
    userId: string
  ): Promise<ShadowEntity[]> {
    const { db, cleanup } = await getDB();
    try {
      const entities = await db
        .select()
        .from(shadowEntities)
        .where(
          and(
            eq(shadowEntities.entityId, entityId),
            eq(shadowEntities.entityType, entityType),
            eq(shadowEntities.ownerUserId, userId)
          )
        );
      return entities;
    } finally {
      await cleanup();
    }
  },

  /**
   * Find shadow entities by file ID
   */
  async findByFileId(fileId: string, userId: string): Promise<ShadowEntity[]> {
    return this.findByEntity(fileId, "file", userId);
  },

  /**
   * Find all shadow entities for a user
   * Accepts null for limit to support GraphQL optional args
   */
  async findByUserId(userId: string, limit?: number | null): Promise<ShadowEntity[]> {
    const { db, cleanup } = await getDB();
    try {
      const entities = await db
        .select()
        .from(shadowEntities)
        .where(eq(shadowEntities.ownerUserId, userId))
        .limit(limit ?? 100);
      return entities;
    } finally {
      await cleanup();
    }
  },

  /**
   * Create shadow entity
   */
  async create(data: Omit<InsertShadowEntity, 'id' | 'embedding' | 'lastUpdated' | 'createdAt'>): Promise<ShadowEntity> {
    const { db, cleanup } = await getDB();
    try {
      const [entity] = await db
        .insert(shadowEntities)
        .values({
          ownerUserId: data.ownerUserId,
          entityId: data.entityId,
          entityType: data.entityType,
          summary: data.summary || null,
          structureMetadata: data.structureMetadata || null,
          embedding: null, // Set by background job
        })
        .returning();

      logger.info("Shadow entity created", {
        shadowId: entity.id,
        entityId: data.entityId,
        entityType: data.entityType,
      });

      return entity;
    } finally {
      await cleanup();
    }
  },

  /**
   * Update shadow entity (summary, embedding, metadata)
   */
  async update(
    shadowId: string,
    userId: string,
    data: Partial<Pick<InsertShadowEntity, 'summary' | 'embedding' | 'structureMetadata'>>
  ): Promise<ShadowEntity | null> {
    const { db, cleanup } = await getDB();
    try {
      const [entity] = await db
        .update(shadowEntities)
        .set({
          summary: data.summary,
          embedding: data.embedding,
          structureMetadata: data.structureMetadata,
          lastUpdated: new Date().toISOString(),
        })
        .where(
          and(
            eq(shadowEntities.id, shadowId),
            eq(shadowEntities.ownerUserId, userId)
          )
        )
        .returning();

      if (entity) {
        logger.info("Shadow entity updated", {
          shadowId: entity.id,
          hasEmbedding: !!data.embedding,
        });
      }

      return entity || null;
    } finally {
      await cleanup();
    }
  },

  /**
   * Delete shadow entity
   * Note: Schema has no DELETE policy (shadow entities persist for history)
   * This method exists for admin/cleanup operations only
   */
  async delete(shadowId: string, userId: string): Promise<boolean> {
    const { db, cleanup } = await getDB();
    try {
      const result = await db
        .delete(shadowEntities)
        .where(
          and(
            eq(shadowEntities.id, shadowId),
            eq(shadowEntities.ownerUserId, userId)
          )
        );

      logger.info("Shadow entity deleted", { shadowId, success: !!result });
      return !!result;
    } finally {
      await cleanup();
    }
  },

  /**
   * Check if shadow entity exists for source entity
   */
  async exists(
    entityId: string,
    entityType: "file" | "thread" | "kg_node",
    userId: string
  ): Promise<boolean> {
    const { db, cleanup } = await getDB();
    try {
      const [entity] = await db
        .select({ id: shadowEntities.id })
        .from(shadowEntities)
        .where(
          and(
            eq(shadowEntities.entityId, entityId),
            eq(shadowEntities.entityType, entityType),
            eq(shadowEntities.ownerUserId, userId)
          )
        )
        .limit(1);

      return !!entity;
    } finally {
      await cleanup();
    }
  },
};
