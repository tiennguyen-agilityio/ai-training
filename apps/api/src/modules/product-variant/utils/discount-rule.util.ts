import { DiscountType } from '@repo/constants';
import { isDiscountFixedValid, isDiscountPercentValid } from '@repo/schemas';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';
import {
  ERROR_DESCRIPTIONS,
  ERROR_MESSAGES,
} from '../../../common/constants/message.constant.js';

export interface VariantDiscountValues {
  price: number | string;
  discountType: DiscountType;
  discountValue: number | string;
}

/**
 * Checks the values a variant ends up with against both discount rules and
 * returns the first one broken, or null. Callers resolve missing or stored
 * null discounts (PERCENT / 0) before calling.
 */
export const findDiscountRuleViolation = (
  values: VariantDiscountValues,
): { errCode: string; message: string; description: string } | null => {
  if (!isDiscountPercentValid(values)) {
    return {
      errCode: ERROR_CODES.PRODUCT_VARIANT.MAX_PERCENT_DISCOUNT_VALUE,
      message: ERROR_MESSAGES.PRODUCT_VARIANT.MAX_PERCENT_DISCOUNT_VALUE,
      description:
        ERROR_DESCRIPTIONS.PRODUCT_VARIANT.MAX_PERCENT_DISCOUNT_VALUE,
    };
  }
  if (!isDiscountFixedValid(values)) {
    return {
      errCode: ERROR_CODES.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE,
      message: ERROR_MESSAGES.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE,
      description: ERROR_DESCRIPTIONS.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE,
    };
  }
  return null;
};
