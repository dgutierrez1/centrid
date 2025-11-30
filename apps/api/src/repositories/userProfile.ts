import { eq } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { userProfiles } from '../db/schema.ts';
import type { InsertUserProfile } from '../db/types.ts';

export class UserProfileRepository {
  /**
   * Create a new user profile
   */
  async create(input: Pick<InsertUserProfile, 'userId' | 'firstName' | 'lastName'>) {
    const { db, cleanup } = await getDB();
    try {
      const [profile] = await db
        .insert(userProfiles)
        .values({
          userId: input.userId,
          firstName: input.firstName,
          lastName: input.lastName,
        })
        .returning();
      return profile;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find user profile by userId
   */
  async findByUserId(userId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      return profile || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Update user profile
   */
  async update(userId: string, input: Partial<Pick<InsertUserProfile, 'firstName' | 'lastName'>>) {
    const { db, cleanup } = await getDB();
    try {
      const [updated] = await db
        .update(userProfiles)
        .set({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete user profile by userId
   */
  async delete(userId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db
        .delete(userProfiles)
        .where(eq(userProfiles.userId, userId));
    } finally {
      await cleanup();
    }
  }
}
