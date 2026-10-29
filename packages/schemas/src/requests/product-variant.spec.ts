import { DiscountType, ProductUnit } from '@repo/constants';
import { DISCOUNT_PERCENT_MESSAGE } from '../fields/discount.js';
import { createProductVariantSchema } from './product-variant.js';

const variant = {
  sku: 'SKU-001',
  weight: '250',
  unit: ProductUnit.G,
  price: '12.5',
  discountType: DiscountType.PERCENT,
  discountValue: 99,
};

describe('createProductVariantSchema', () => {
  it('coerces numbers sent as strings and hands decimals over as strings', () => {
    expect(createProductVariantSchema.parse(variant)).toMatchObject({
      weight: '250',
      price: '12.5',
      discountValue: '99',
    });
  });

  it('rejects a percent discount of 100 with the shared message', () => {
    const result = createProductVariantSchema.safeParse({
      ...variant,
      discountValue: 100,
    });

    expect(
      result.error?.issues.map(({ path, message }) => ({ path, message })),
    ).toEqual([{ path: ['discountValue'], message: DISCOUNT_PERCENT_MESSAGE }]);
  });

  it('rejects a non-numeric price', () => {
    const result = createProductVariantSchema.safeParse({
      ...variant,
      price: 'abc',
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([['price']]);
  });
});
