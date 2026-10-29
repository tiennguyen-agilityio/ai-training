import { z } from 'zod';
import { VALIDATION_RULES, ProductStatus, RoastLevel } from '@repo/constants';
import { longTextField, nameField } from '../fields/text.js';
import {
  createProductImageSchema,
  updateProductImageSchema,
} from './product-image.js';
import { createProductVariantSchema } from './product-variant.js';

// A product create body without the API's primary-image rule, which the API
// adds on top; unrefined so updateProductSchema can still omit from it.
export const productBodySchema = z.object({
  categoryId: z.uuid(),
  name: nameField,
  description: longTextField,
  roastLevel: z.enum(RoastLevel),
  isOrganic: z.boolean().optional(),
  isFairTrade: z.boolean().optional(),
  status: z.enum(ProductStatus).optional(),
  tastingNotes: z.string().nullish(),
  origin: longTextField,
  processingMethod: longTextField,
  images: z
    .array(createProductImageSchema)
    .min(VALIDATION_RULES.IMAGE.MIN_COUNT)
    .max(VALIDATION_RULES.IMAGE.MAX_COUNT),
  variants: z
    .array(createProductVariantSchema)
    .min(VALIDATION_RULES.VARIANT.MIN_COUNT),
});

export const updateProductSchema = productBodySchema
  .omit({ images: true, variants: true })
  .partial()
  .extend({
    removeImageIds: z.array(z.uuid()).optional(),
    updateImages: z.array(updateProductImageSchema).optional(),
    addImages: z.array(createProductImageSchema).optional(),
  });

export type CreateProductPayload = z.input<typeof productBodySchema>;
export type UpdateProductPayload = z.input<typeof updateProductSchema>;
