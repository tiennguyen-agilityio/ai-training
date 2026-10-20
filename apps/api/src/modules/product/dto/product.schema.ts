import { z } from 'zod';
import {
  paginationQuerySchema,
  type PaginationQueryInput,
} from '../../../common/dto/pagination.schema.js';
import { VALIDATION_RULES } from '../../../common/constants/validation.constant.js';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant.js';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';
import {
  ProductSortBy,
  ProductStatus,
  RoastLevel,
} from '../enums/product.enum.js';
import { createProductImageSchema } from '../../product-image/dto/product-image.schema.js';
import { createProductVariantSchema } from '../../product-variant/dto/product-variant.schema.js';

const productObjectSchema = z.object({
  categoryId: z.uuid(),
  name: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH),
  description: z.string().min(VALIDATION_RULES.NAME.MIN_LENGTH),
  roastLevel: z.enum(RoastLevel),
  isOrganic: z.boolean().optional(),
  isFairTrade: z.boolean().optional(),
  status: z.enum(ProductStatus).optional(),
  tastingNotes: z.string().nullish(),
  origin: z.string().min(VALIDATION_RULES.NAME.MIN_LENGTH),
  processingMethod: z.string().min(VALIDATION_RULES.NAME.MIN_LENGTH),
  images: z
    .array(createProductImageSchema)
    .min(VALIDATION_RULES.IMAGE.MIN_COUNT)
    .max(VALIDATION_RULES.IMAGE.MAX_COUNT),
  variants: z
    .array(createProductVariantSchema)
    .min(VALIDATION_RULES.VARIANT.MIN_COUNT),
});

export const createProductSchema = productObjectSchema.refine(
  (data) => data.images.filter((image) => image.isPrimary).length === 1,
  {
    message: ERROR_MESSAGES.PRODUCT.PRIMARY_IMAGE_REQUIRED,
    path: ['images'],
    params: { errCode: ERROR_CODES.PRODUCT.PRIMARY_IMAGE_REQUIRED },
  },
);

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = productObjectSchema
  .omit({ images: true, variants: true })
  .partial()
  .extend({
    removeImageIds: z.array(z.uuid()).optional(),
    updateImages: z
      .array(createProductImageSchema.partial().extend({ id: z.uuid() }))
      .optional(),
    addImages: z.array(createProductImageSchema).optional(),
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// `?roastLevel=LIGHT,DARK` arrives as one comma-separated string.
const splitComma = (value: unknown): unknown =>
  typeof value === 'string' ? value.split(',') : value;

export const productQuerySchema = paginationQuerySchema
  .extend({
    categoryId: z.uuid().optional(),
    status: z.enum(ProductStatus).optional(),
    roastLevel: z
      .preprocess(splitComma, z.array(z.enum(RoastLevel)))
      .optional(),
    minPrice: z.coerce.number().min(VALIDATION_RULES.PRICE.MIN).optional(),
    maxPrice: z.coerce.number().min(VALIDATION_RULES.PRICE.MIN).optional(),
    sortBy: z.enum(ProductSortBy).optional(),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    {
      message: ERROR_MESSAGES.PRODUCT.INVALID_PRICE_RANGE,
      path: ['maxPrice'],
    },
  );

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export type ProductFilters = Omit<
  ProductQueryInput,
  keyof PaginationQueryInput
>;
