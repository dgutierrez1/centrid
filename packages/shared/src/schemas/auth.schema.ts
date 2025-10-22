import { z } from 'zod'

/**
 * Shared name field validation for first name and last name
 * Required during signup for personalization
 * Validates valid characters and length
 */
const nameFieldSchema = z.string()
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)')

/**
 * Signup schema for new user account creation
 * Requires email, password, firstName, and lastName
 * Name fields enable immediate personalization of user experience
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: nameFieldSchema,
  lastName: nameFieldSchema
})

/**
 * Login schema for existing user authentication
 * Minimal validation - just email and password format
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

/**
 * Forgot password schema for password reset request
 * Only requires email address
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

/**
 * Reset password schema for setting new password from reset link
 * Validates password format only (confirmation handled in frontend)
 */
export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters')
})

/**
 * Type exports for TypeScript type safety
 */
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
