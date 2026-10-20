import { z } from 'zod';
import { VALIDATION_RULES } from '../../../common/constants/validation.constant.js';

export const createProductImageSchema = z.object({
  url: z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
  isPrimary: z.boolean().optional(),
  sortOrder: z
    .int()
    .min(VALIDATION_RULES.IMAGE.MIN_SORT_ORDER)
    .max(VALIDATION_RULES.IMAGE.MAX_SORT_ORDER)
    .optional(),
});

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
