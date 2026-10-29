import { z } from 'zod';
import {
  paginationQuerySchema,
  type PaginationQueryInput,
} from '../../../common/dto/pagination.schema.js';
import {
  DiscountType,
  VALIDATION_RULES,
  ProductStatus,
  RoastLevel,
  ProductSortBy,
} from '@repo/constants';
import {
  productBodySchema,
  updateProductSchema as updateProductBodySchema,
} from '@repo/schemas';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant.js';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';
import { findDiscountRuleViolation } from '../../product-variant/utils/discount-rule.util.js';

// The shared body plus the API's rules: exactly one primary image, and each
// variant's discount checked on the values it is stored with (PERCENT / 0 when
// the request leaves them out).
export const createProductSchema = productBodySchema
  .refine(
    (data) => data.images.filter((image) => image.isPrimary).length === 1,
    {
      message: ERROR_MESSAGES.PRODUCT.PRIMARY_IMAGE_REQUIRED,
      path: ['images'],
      params: { errCode: ERROR_CODES.PRODUCT.PRIMARY_IMAGE_REQUIRED },
    },
  )
  .superRefine((data, ctx) => {
    data.variants.forEach((variant, index) => {
      const violation = findDiscountRuleViolation({
        price: variant.price,
        discountType: variant.discountType ?? DiscountType.PERCENT,
        discountValue: variant.discountValue ?? 0,
      });
      if (violation) {
        ctx.addIssue({
          code: 'custom',
          message: violation.message,
          path: ['variants', index, 'discountValue'],
          params: { errCode: violation.errCode },
        });
      }
    });
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

// The shared body plus the API's rule: each variant at most once.
export const updateProductSchema = updateProductBodySchema.refine(
  ({ updateVariants = [] }) =>
    new Set(updateVariants.map((variant) => variant.id)).size ===
    updateVariants.length,
  {
    message: ERROR_MESSAGES.PRODUCT_VARIANT.DUPLICATE_IDS,
    path: ['updateVariants'],
    params: { errCode: ERROR_CODES.PRODUCT_VARIANT.DUPLICATE_IDS },
  },
);

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
