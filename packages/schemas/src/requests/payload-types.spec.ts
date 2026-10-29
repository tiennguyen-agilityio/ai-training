import { DiscountType, ProductUnit, RoastLevel } from '@repo/constants';
import type {
  CreateCategoryPayload,
  CreateProductPayload,
  CreateProductVariantPayload,
  UpdateUserPayload,
} from '../index.js';

describe('payload types', () => {
  // The check is tsc (`tsc --noEmit -p tsconfig.json`): every expected type
  // error below must stay an error, or type-checking this file fails.
  it('reject a payload that does not match the body schema', () => {
    const variant = {
      sku: 'SKU-001',
      weight: 250,
      unit: ProductUnit.G,
      price: 12.5,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
    } satisfies CreateProductVariantPayload;

    const product = {
      categoryId: '7d5b1c1e-1d2f-4c6a-9b1e-2f3a4b5c6d7e',
      name: 'Single Origin',
      description: 'Bright and floral',
      roastLevel: RoastLevel.LIGHT,
      origin: 'Ethiopia',
      processingMethod: 'Washed',
      images: [{ url: 'https://example.com/a.png', isPrimary: true }],
      variants: [variant],
    } satisfies CreateProductPayload;

    // @ts-expect-error price is a number
    const objectPrice: CreateProductVariantPayload = { ...variant, price: {} };
    // @ts-expect-error sku is required
    const noSku: CreateProductVariantPayload = {
      weight: 250,
      unit: ProductUnit.G,
      price: 12.5,
    };
    // @ts-expect-error role is a UserRole
    const badRole: UpdateUserPayload = { role: 'OWNER' };
    // @ts-expect-error name is a string
    const numericName: CreateCategoryPayload = { name: 1 };

    expect([product, objectPrice, noSku, badRole, numericName]).toHaveLength(5);
  });
});
