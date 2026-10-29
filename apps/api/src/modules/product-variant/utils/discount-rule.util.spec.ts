import { DiscountType } from '@repo/constants';
import { findDiscountRuleViolation } from './discount-rule.util.js';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';
import {
  ERROR_DESCRIPTIONS,
  ERROR_MESSAGES,
} from '../../../common/constants/message.constant.js';

describe('findDiscountRuleViolation', () => {
  it('reports a PERCENT discount of 100', () => {
    expect(
      findDiscountRuleViolation({
        price: 120,
        discountType: DiscountType.PERCENT,
        discountValue: 100,
      }),
    ).toEqual({
      errCode: ERROR_CODES.PRODUCT_VARIANT.MAX_PERCENT_DISCOUNT_VALUE,
      message:
        'DiscountValue must be less than 100 when DiscountType is PERCENT',
      description:
        ERROR_DESCRIPTIONS.PRODUCT_VARIANT.MAX_PERCENT_DISCOUNT_VALUE,
    });
  });

  it('accepts a PERCENT discount of 99.99', () => {
    expect(
      findDiscountRuleViolation({
        price: 120,
        discountType: DiscountType.PERCENT,
        discountValue: 99.99,
      }),
    ).toBeNull();
  });

  it('reports a FIXED discount above the price', () => {
    expect(
      findDiscountRuleViolation({
        price: 120,
        discountType: DiscountType.FIXED,
        discountValue: 150,
      }),
    ).toEqual({
      errCode: ERROR_CODES.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE,
      message: 'Fixed discount must be less than base price',
      description: ERROR_DESCRIPTIONS.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE,
    });
  });

  it('accepts a FIXED discount of 0', () => {
    expect(
      findDiscountRuleViolation({
        price: 120,
        discountType: DiscountType.FIXED,
        discountValue: 0,
      }),
    ).toBeNull();
  });

  it('reads stored decimal strings', () => {
    expect(
      findDiscountRuleViolation({
        price: '120.00',
        discountType: DiscountType.FIXED,
        discountValue: '120.00',
      })?.errCode,
    ).toBe(ERROR_CODES.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE);
  });

  it('uses the centralized messages', () => {
    expect(ERROR_MESSAGES.PRODUCT_VARIANT.MAX_FIXED_DISCOUNT_VALUE).toBe(
      'Fixed discount must be less than base price',
    );
  });
});
