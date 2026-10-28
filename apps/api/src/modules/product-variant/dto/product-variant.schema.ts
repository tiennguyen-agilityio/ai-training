import { z } from 'zod';
import { createProductVariantSchema } from '@repo/schemas';

export { createProductVariantSchema };

export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
