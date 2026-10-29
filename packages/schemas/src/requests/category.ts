import { z } from 'zod';
import { nameField } from '../fields/text.js';

export const createCategorySchema = z.object({
  name: nameField,
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryPayload = z.input<typeof createCategorySchema>;
export type UpdateCategoryPayload = z.input<typeof updateCategorySchema>;
