import type {
  DiscountType,
  ProductStatus,
  ProductUnit,
  RoastLevel,
} from '@repo/constants'

// A variant as the product response lists it.
export interface ProductVariantSummary {
  id?: string
  sku?: string
  weight: number
  unit: ProductUnit
  price: number
  discountType: DiscountType | null
  discountValue: number | null
  quantity: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku?: string
  weight: number
  unit: ProductUnit
  name: string
  price: number
  discountType: DiscountType | null
  discountValue: number | null
  quantity: number
}

export interface ProductImage {
  id?: string
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  roastLevel: RoastLevel
  isOrganic: boolean
  isFairTrade: boolean
  status: ProductStatus
  tastingNotes: string
  origin: string
  processingMethod: string
  variants: ProductVariantSummary[]
  images: ProductImage[]
  createdAt: string | null
  updatedAt: string | null
}

export interface ProductFormValues {
  categoryId: string
  name: string
  description: string
  roastLevel: RoastLevel
  isOrganic: boolean
  isFairTrade: boolean
  weight: number
  unit: ProductUnit | ''
  price: number
  discountType: DiscountType
  discountValue: number
  quantity: number | ''
  origin: string
  processingMethod: string
}
