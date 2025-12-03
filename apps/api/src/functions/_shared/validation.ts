import type { ZodSchema } from 'zod';
import { z, ZodError } from 'zod';

/**
 * Validates incoming request body against a Zod schema
 * Throws structured validation error if invalid
 */
export async function validateRequest<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  try {
    const body = await req.json();
    return await schema.parseAsync(body);
  } catch (error) {
    if (error instanceof ZodError) {
      // Transform Zod errors into structured format
      const issues = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      throw {
        type: 'VALIDATION_ERROR',
        message: 'Invalid request',
        issues,
      };
    }

    // Re-throw if not a validation error
    throw error;
  }
}

export { z, type ZodSchema };
