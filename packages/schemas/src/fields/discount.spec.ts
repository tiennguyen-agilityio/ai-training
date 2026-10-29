import { DiscountType } from '@repo/constants';
import {
  DISCOUNT_FIXED_MESSAGE,
  DISCOUNT_PERCENT_MESSAGE,
  isDiscountFixedValid,
  isDiscountPercentValid,
} from './discount.js';

describe('discount percent rule', () => {
  it('reads as the API message', () => {
    expect(DISCOUNT_PERCENT_MESSAGE).toBe(
      'DiscountValue must be less than 100 when DiscountType is PERCENT',
    );
  });

  it.each([
    [{ discountType: DiscountType.PERCENT, discountValue: 99 }, true],
    [{ discountType: DiscountType.PERCENT, discountValue: 100 }, false],
    [{ discountType: DiscountType.PERCENT, discountValue: '100' }, false],
    [{ discountType: DiscountType.FIXED, discountValue: 100 }, true],
    [{ discountType: DiscountType.PERCENT, discountValue: null }, true],
    [{}, true],
  ])('isDiscountPercentValid(%o) is %s', (fields, expected) => {
    expect(isDiscountPercentValid(fields)).toBe(expected);
  });
});

describe('discount fixed rule', () => {
  it('reads as the API message', () => {
    expect(DISCOUNT_FIXED_MESSAGE).toBe(
      'Fixed discount must be less than base price',
    );
  });

  it.each([
    [
      { discountType: DiscountType.FIXED, discountValue: 120, price: 120 },
      false,
    ],
    [
      { discountType: DiscountType.FIXED, discountValue: 119.99, price: 120 },
      true,
    ],
    [
      { discountType: DiscountType.PERCENT, discountValue: 150, price: 120 },
      true,
    ],
    [
      {
        discountType: DiscountType.FIXED,
        discountValue: undefined,
        price: 120,
      },
      true,
    ],
    [
      { discountType: DiscountType.FIXED, discountValue: '150', price: '120' },
      false,
    ],
    [{ discountType: DiscountType.FIXED, discountValue: 0, price: 120 }, true],
  ])('isDiscountFixedValid(%o) is %s', (fields, expected) => {
    expect(isDiscountFixedValid(fields)).toBe(expected);
  });
});
