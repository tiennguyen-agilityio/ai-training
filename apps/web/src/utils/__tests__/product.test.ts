import {
  DiscountType,
  ProductStatus,
  ProductUnit,
  RoastLevel,
} from '@repo/constants'

import type { EditProductFormValues } from '@/schemas/product'
import type { Product, ProductVariantSummary } from '@/types/product'
import {
  buildVariantUpdates,
  mapProductToEditFormValues,
  toCreateVariantPayload,
  variantFieldErrors,
} from '@/utils/product'

const variant = (
  overrides: Partial<ProductVariantSummary> = {},
): ProductVariantSummary => ({
  id: 'variant-a',
  sku: 'SKU-A',
  weight: 250,
  unit: ProductUnit.G,
  price: 100,
  discountType: DiscountType.PERCENT,
  discountValue: 10,
  quantity: 30,
  ...overrides,
})

const product = (variants: ProductVariantSummary[]): Product => ({
  id: 'product-1',
  categoryId: 'category-1',
  name: 'Single Origin',
  description: 'Bright and floral',
  roastLevel: RoastLevel.LIGHT,
  isOrganic: false,
  isFairTrade: false,
  status: ProductStatus.ACTIVE,
  tastingNotes: '',
  origin: 'Ethiopia',
  processingMethod: 'Washed',
  variants,
  images: [],
  createdAt: null,
  updatedAt: null,
})

const formValues = (
  overrides: Partial<EditProductFormValues> = {},
): EditProductFormValues => ({
  ...mapProductToEditFormValues(product([variant()])),
  ...overrides,
})

describe('mapProductToEditFormValues', () => {
  it("prefills the first variant's pricing", () => {
    expect(
      mapProductToEditFormValues(
        product([variant(), variant({ id: 'variant-b', price: 999 })]),
      ),
    ).toMatchObject({
      price: 100,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      quantity: 30,
    })
  })

  it('reads a null discount as PERCENT 0', () => {
    expect(
      mapProductToEditFormValues(
        product([variant({ discountType: null, discountValue: null })]),
      ),
    ).toMatchObject({ discountType: DiscountType.PERCENT, discountValue: 0 })
  })

  it('uses defaults for a product without variants', () => {
    expect(mapProductToEditFormValues(product([]))).toMatchObject({
      price: 0,
      discountType: DiscountType.PERCENT,
      discountValue: 0,
      quantity: 0,
    })
  })
})

describe('buildVariantUpdates', () => {
  it('updates only the first variant', () => {
    expect(
      buildVariantUpdates(
        product([variant(), variant({ id: 'variant-b' })]),
        formValues({ price: 120 }),
      ),
    ).toEqual([
      {
        id: 'variant-a',
        price: 120,
        discountType: DiscountType.PERCENT,
        discountValue: 10,
        quantity: 30,
      },
    ])
  })

  it('sends PERCENT 0 for a removed discount', () => {
    expect(
      buildVariantUpdates(
        product([variant()]),
        formValues({ discountValue: 0 }),
      )[0],
    ).toMatchObject({ discountType: DiscountType.PERCENT, discountValue: 0 })
  })

  it('keeps a decimal percent of 12.5', () => {
    expect(
      buildVariantUpdates(
        product([variant()]),
        formValues({ discountValue: 12.5 }),
      )[0].discountValue,
    ).toBe(12.5)
  })

  it('returns [] for a product without variants', () => {
    expect(buildVariantUpdates(product([]), formValues())).toEqual([])
  })
})

describe('toCreateVariantPayload', () => {
  const values = {
    weight: 250,
    unit: ProductUnit.G,
    price: 100,
    discountType: DiscountType.PERCENT,
    discountValue: 0,
    quantity: 5,
  }

  it('sends PERCENT 0 for no discount', () => {
    expect(toCreateVariantPayload(values, 'SKU-1')).toEqual({
      sku: 'SKU-1',
      weight: 250,
      unit: ProductUnit.G,
      price: 100,
      discountType: DiscountType.PERCENT,
      discountValue: 0,
      quantity: 5,
    })
  })

  it('keeps FIXED 0', () => {
    expect(
      toCreateVariantPayload(
        { ...values, discountType: DiscountType.FIXED },
        'SKU-1',
      ),
    ).toMatchObject({ discountType: DiscountType.FIXED, discountValue: 0 })
  })
})

describe('variantFieldErrors', () => {
  it('maps updateVariants.0.discountValue to discountValue and ignores other fields', () => {
    expect(
      variantFieldErrors([
        {
          errCode: 'maxFixedDiscountValue',
          field: 'updateVariants.0.discountValue',
          message: 'Fixed discount must be less than base price',
        },
        { errCode: 'productNameExists', field: 'name', message: 'Taken' },
        {
          errCode: 'min',
          field: 'updateVariants.1.price',
          message: 'Price must not be less than 1',
        },
      ]),
    ).toEqual([
      {
        field: 'discountValue',
        message: 'Fixed discount must be less than base price',
      },
    ])
  })
})
