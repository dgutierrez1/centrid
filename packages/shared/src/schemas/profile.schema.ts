import { z } from 'zod'

/**
 * Shared name field validation for first name and last name
 * Used in profile update schema
 */
const nameFieldSchema = z.string()
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)')
  .optional()

/**
 * Profile update schema for modifying user profile data
 * Both fields are optional - user can update one or both
 */
export const updateProfileSchema = z.object({
  firstName: nameFieldSchema,
  lastName: nameFieldSchema
})

/**
 * Account deletion schema with explicit confirmation requirement
 * User must type "DELETE" exactly to confirm deletion
 */
export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' })
  })
})

/**
 * Type exports for TypeScript type safety
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
