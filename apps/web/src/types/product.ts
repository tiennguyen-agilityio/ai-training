import type {
  DiscountType,
  ProductStatus,
  ProductUnit,
  RoastLevel,
} from '@repo/constants'

export interface ProductVariantPayload {
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

export interface ProductImagePayload {
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductImage extends ProductImagePayload {
  id?: string
}

export interface ProductImageUpdatePayload {
  id: string
  sortOrder: number
  isPrimary: boolean
}

export interface ProductPayload {
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
  variants: ProductVariantPayload[]
  images: ProductImagePayload[]
}

export interface ProductUpdatePayload extends Omit<
  ProductPayload,
  'images' | 'variants'
> {
  addImages?: ProductImagePayload[]
  removeImageIds?: string[]
  updateImages?: ProductImageUpdatePayload[]
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
  variants: ProductVariantPayload[]
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
