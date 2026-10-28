import { z } from 'zod';
import {
  paginationQuerySchema,
  type PaginationQueryInput,
} from '../../../common/dto/pagination.schema.js';
import {
  VALIDATION_RULES,
  ProductStatus,
  RoastLevel,
  ProductSortBy,
} from '@repo/constants';
import { productBodySchema, updateProductSchema } from '@repo/schemas';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant.js';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';

// The shared body plus the API's rule: exactly one primary image.
export const createProductSchema = productBodySchema.refine(
  (data) => data.images.filter((image) => image.isPrimary).length === 1,
  {
    message: ERROR_MESSAGES.PRODUCT.PRIMARY_IMAGE_REQUIRED,
    path: ['images'],
    params: { errCode: ERROR_CODES.PRODUCT.PRIMARY_IMAGE_REQUIRED },
  },
);

export type CreateProductInput = z.infer<typeof createProductSchema>;

export { updateProductSchema };

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
