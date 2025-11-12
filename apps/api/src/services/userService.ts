/**
 * User Service
 * Handles user account and profile operations
 * ✅ STATELESS - All methods are static utility functions
 */

import { UserProfileRepository } from '../repositories/userProfile.ts';
import { getSupabaseServiceClient } from '../lib/supabase.ts';
import { createLogger } from '../utils/logger.ts';
import type { UserProfile, CreateUserResponseDTO, DeleteUserResponseDTO } from '../db/types.js';

const logger = createLogger('UserService');
const userProfileRepository = new UserProfileRepository();

export class UserService {
  /**
   * Create a new user account with profile
   * Implements atomic transaction with rollback on failure
   */
  static async createUser(
    email: string,
    password: string,
    profileData: { firstName: string; lastName: string }
  ): Promise<CreateUserResponseDTO> {
    const supabase = getSupabaseServiceClient();

    logger.info('Creating user account', { email });

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // MVP: Auto-confirm email
    });

    if (authError) {
      logger.error('Auth account creation failed', authError);
      throw new Error(authError.message || 'Failed to create account');
    }

    const userId = authData.user.id;
    logger.info('Auth account created', { userId });

    try {
      // Step 2: Create user profile
      const profile = await userProfileRepository.create({
        userId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });

      logger.info('User profile created', { userId, profileId: profile.id });

      return {
        user: {
          id: userId,
          email,
        },
        profile,
      };
    } catch (error) {
      // Step 3: Rollback - delete auth user if profile creation fails
      logger.error('Profile creation failed, rolling back auth account', { userId, error });

      await supabase.auth.admin.deleteUser(userId);
      logger.info('Auth account rolled back', { userId });

      throw new Error('Failed to create profile. Account creation rolled back.');
    }
  }

  /**
   * Get user profile by userId
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    logger.info('Fetching user profile', { userId });

    const profile = await userProfileRepository.findByUserId(userId);

    if (!profile) {
      logger.warn('User profile not found', { userId });
      throw new Error('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      planType: profile.planType,
      usageCount: profile.usageCount,
      subscriptionStatus: profile.subscriptionStatus,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<UserProfile> {
    logger.info('Updating user profile', { userId, updates });

    const updated = await userProfileRepository.update(userId, updates);

    if (!updated) {
      logger.warn('User profile not found for update', { userId });
      throw new Error('Profile not found');
    }

    logger.info('User profile updated', { userId });

    return {
      id: updated.id,
      userId: updated.userId,
      firstName: updated.firstName,
      lastName: updated.lastName,
      planType: updated.planType,
      usageCount: updated.usageCount,
      subscriptionStatus: updated.subscriptionStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete user account
   * Cascade deletes profile via database foreign key
   */
  static async deleteUser(userId: string): Promise<DeleteUserResponseDTO> {
    logger.info('Deleting user account', { userId });

    const supabase = getSupabaseServiceClient();

    // Delete auth user (profile auto-deleted via CASCADE FK)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      logger.error('User account deletion failed', { userId, error });
      throw new Error(error.message || 'Failed to delete account');
    }

    logger.info('User account deleted', { userId });

    return { success: true, userId };
  }
}
