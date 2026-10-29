import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from '@repo/schemas';

export { createCategorySchema, updateCategorySchema };

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
