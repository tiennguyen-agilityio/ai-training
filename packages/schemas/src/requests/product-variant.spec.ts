import { DiscountType, ProductUnit } from '@repo/constants';
import {
  createProductVariantSchema,
  updateProductVariantSchema,
} from './product-variant.js';

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

  it('leaves the percent rule to the API', () => {
    expect(
      createProductVariantSchema.safeParse({ ...variant, discountValue: 100 })
        .success,
    ).toBe(true);
  });

  it('rejects a null discountValue', () => {
    const result = createProductVariantSchema.safeParse({
      ...variant,
      discountValue: null,
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ['discountValue'],
    ]);
  });

  it('rejects a null discountType', () => {
    const result = createProductVariantSchema.safeParse({
      ...variant,
      discountType: null,
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ['discountType'],
    ]);
  });

  it('accepts a variant without discount fields', () => {
    const { sku, weight, unit, price } = variant;

    expect(
      createProductVariantSchema.safeParse({ sku, weight, unit, price })
        .success,
    ).toBe(true);
  });

  it('rejects a non-numeric price', () => {
    const result = createProductVariantSchema.safeParse({
      ...variant,
      price: 'abc',
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([['price']]);
  });
});

describe('updateProductVariantSchema', () => {
  const id = '7d5b1c1e-1d2f-4c6a-9b1e-2f3a4b5c6d7e';

  it('accepts an id with only quantity', () => {
    expect(updateProductVariantSchema.parse({ id, quantity: 50 })).toEqual({
      id,
      quantity: 50,
    });
  });

  it('rejects a null discountType', () => {
    const result = updateProductVariantSchema.safeParse({
      id,
      discountType: null,
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ['discountType'],
    ]);
  });

  it('rejects a null discountValue', () => {
    const result = updateProductVariantSchema.safeParse({
      id,
      discountValue: null,
    });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ['discountValue'],
    ]);
  });

  it('coerces string numbers', () => {
    expect(
      updateProductVariantSchema.parse({
        id,
        price: '120',
        discountValue: '12.5',
      }),
    ).toMatchObject({ price: '120', discountValue: '12.5' });
  });

  it('rejects a missing id', () => {
    const result = updateProductVariantSchema.safeParse({ quantity: 50 });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([['id']]);
  });
});
