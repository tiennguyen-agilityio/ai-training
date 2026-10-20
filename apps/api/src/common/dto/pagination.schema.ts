import { z } from 'zod';
import { VALIDATION_RULES } from '../constants/validation.constant.js';

const { MIN_PAGE, DEFAULT_PAGE, MIN_LIMIT, MAX_LIMIT, DEFAULT_LIMIT } =
  VALIDATION_RULES.PAGINATION;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).default(DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(MIN_LIMIT)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT),
  search: z.string().optional(),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
