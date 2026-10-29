import { DiscountType, ProductUnit } from '@repo/constants';
import { ResponseProductVariantDto } from './response-product-variant.dto.js';
import type { ProductVariant } from '../entities/product-variant.entity.js';

const variant = (overrides: Partial<ProductVariant>): ProductVariant =>
  ({
    id: 'variant-id-1',
    sku: 'SKU-1',
    weight: '250.00',
    unit: ProductUnit.G,
    name: '250.00G',
    price: '120.00',
    discountType: DiscountType.PERCENT,
    discountValue: '10.00',
    quantity: 30,
    ...overrides,
  }) as ProductVariant;

describe('ResponseProductVariantDto', () => {
  it('reads a null discount as PERCENT 0', () => {
    expect(
      ResponseProductVariantDto.fromEntity(
        variant({ discountType: null, discountValue: null }),
      ),
    ).toMatchObject({ discountType: DiscountType.PERCENT, discountValue: 0 });
  });

  it('reads FIXED with a null value as FIXED 0', () => {
    expect(
      ResponseProductVariantDto.fromEntity(
        variant({ discountType: DiscountType.FIXED, discountValue: null }),
      ),
    ).toMatchObject({ discountType: DiscountType.FIXED, discountValue: 0 });
  });

  it('reads a null type with a value as PERCENT with that value', () => {
    expect(
      ResponseProductVariantDto.fromEntity(
        variant({ discountType: null, discountValue: '10.00' }),
      ),
    ).toMatchObject({ discountType: DiscountType.PERCENT, discountValue: 10 });
  });

  it('keeps a stored discount', () => {
    expect(
      ResponseProductVariantDto.fromEntity(
        variant({ discountType: DiscountType.FIXED, discountValue: '12.50' }),
      ),
    ).toMatchObject({ discountType: DiscountType.FIXED, discountValue: 12.5 });
  });
});
