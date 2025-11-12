/**
 * User GraphQL Type
 * User profile queries and mutations
 */

import { builder } from '../builder.ts';
import { UserService } from '../../services/userService.ts';
import type { UserProfile } from '../db/types.js';

// ============================================================================
// User Type
// ============================================================================

const UserType = builder.objectRef<UserProfile>('User').implement({
  description: 'User profile with account information',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Profile ID' }),
    userId: t.exposeString('userId', { description: 'Auth user ID' }),
    firstName: t.exposeString('firstName', { description: 'User first name' }),
    lastName: t.exposeString('lastName', { description: 'User last name' }),
    planType: t.exposeString('planType', { description: 'Subscription plan (free, pro, enterprise)' }),
    usageCount: t.exposeInt('usageCount', { description: 'Current usage count' }),
    subscriptionStatus: t.exposeString('subscriptionStatus', { description: 'Subscription status (active, cancelled, expired)' }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'Profile creation timestamp',
      resolve: (user) => new Date(user.createdAt),
    }),
    updatedAt: t.field({
      type: 'DateTime',
      description: 'Last update timestamp',
      resolve: (user) => new Date(user.updatedAt),
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const UpdateUserInput = builder.inputType('UpdateUserInput', {
  description: 'Input for updating user profile',
  fields: (t) => ({
    firstName: t.string({ required: false, description: 'New first name' }),
    lastName: t.string({ required: false, description: 'New last name' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('me', (t) =>
  t.field({
    type: UserType,
    description: 'Get current user profile',
    resolve: async (parent, args, context) => {
      // context.userId is set by auth middleware
      return await UserService.getUserProfile(context.userId);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('updateProfile', (t) =>
  t.field({
    type: UserType,
    description: 'Update current user profile',
    args: {
      input: t.arg({ type: UpdateUserInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await UserService.updateUserProfile(context.userId, {
        firstName: args.input.firstName || undefined,
        lastName: args.input.lastName || undefined,
      });
    },
  })
);

builder.mutationField('deleteAccount', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Delete current user account (irreversible)',
    resolve: async (parent, args, context) => {
      const result = await UserService.deleteUser(context.userId);
      return result.success;
    },
  })
);
