/**
 * AuthService - Account management operations
 *
 * Handles:
 * - Account creation with profile
 * - Profile updates
 * - Account deletion (GDPR)
 *
 * All requests automatically get:
 * - Auth header injection
 * - Retry on 5xx errors
 * - Consistent error handling
 */

import { api } from '@/lib/api/client';
import type { SignupInput } from '@centrid/shared/schemas';

export interface CreateAccountResponse {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
}

export interface UpdateProfileResponse {
  user_id: string;
  first_name?: string;
  last_name?: string;
}

export const AuthService = {
  /**
   * Create a new account with profile
   *
   * Creates auth user and initializes user profile atomically
   */
  async createAccount(input: SignupInput): Promise<CreateAccountResponse> {
    return api.post<CreateAccountResponse>('/create-account', input);
  },

  /**
   * Update user profile
   */
  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResponse> {
    return api.put<UpdateProfileResponse>('/update-profile', input);
  },

  /**
   * Delete account and all associated data (GDPR)
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/delete-account');
  },
};

// Lowercase alias for convenience
export const authService = AuthService;
