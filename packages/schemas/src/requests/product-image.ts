import { z } from 'zod';
import { VALIDATION_RULES } from '@repo/constants';

export const createProductImageSchema = z.object({
  url: z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
  isPrimary: z.boolean().optional(),
  sortOrder: z
    .int()
    .min(VALIDATION_RULES.IMAGE.MIN_SORT_ORDER)
    .max(VALIDATION_RULES.IMAGE.MAX_SORT_ORDER)
    .optional(),
});

// An existing image in a product update: any field, plus its id.
export const updateProductImageSchema = createProductImageSchema
  .partial()
  .extend({ id: z.uuid() });

export type CreateProductImagePayload = z.input<
  typeof createProductImageSchema
>;
export type UpdateProductImagePayload = z.input<
  typeof updateProductImageSchema
>;
