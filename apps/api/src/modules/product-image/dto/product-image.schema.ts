import { z } from 'zod';
import { createProductImageSchema } from '@repo/schemas';

export { createProductImageSchema };

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
