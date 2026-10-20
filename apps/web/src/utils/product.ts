import type { UploadImageGalleryItem } from '@/components/UploadImage/Gallery'
import { OUT_OF_STOCK_LABEL } from '@/constants/order'
import { type RoastCollection } from '@/constants/roast'
import type { EditProductFormValues } from '@/schemas/product'
import {
  DISCOUNT_TYPE,
  ROAST_LEVEL,
  type Product,
  type ProductFormValues,
  type ProductImage,
  type ProductImagePayload,
  type ProductImageUpdatePayload,
} from '@/types/product'
import { getPrimaryVariantQuantity } from '@/utils/inventory'

export const LOW_STOCK_THRESHOLD = 10

function formatProductRoastMeta(product: Product): string {
  const levelLabel: Record<ROAST_LEVEL, string> = {
    [ROAST_LEVEL.LIGHT]: 'Light roast',
    [ROAST_LEVEL.MEDIUM]: 'Medium roast',
    [ROAST_LEVEL.DARK]: 'Dark roast',
  }
  const origin = product.origin?.trim()
  const roast = levelLabel[product.roastLevel]
  if (origin) {
    return `${origin} | ${roast}`
  }
  return roast
}

function productFlavorLine(product: Product): string {
  const notes = product.tastingNotes?.trim()
  if (notes) return notes
  const description = product.description?.trim()
  if (description) return description
  return '—'
}

export function getProductListPrice(product: Product): number {
  const firstVariant = product.variants[0]
  if (!firstVariant) return 0
  return Number.isFinite(firstVariant.price) ? firstVariant.price : 0
}

export function getProductPrimaryImageUrl(product: Product): string | null {
  if (product.images.length === 0) return null
  const primary = product.images.find((image) => image.isPrimary)
  const first = primary ?? product.images[0]
  const url = first?.url?.trim() ?? ''
  return url || null
}

export function mapProductToRoastCollection(
  product: Product,
  placeholderImageUrl: string,
): RoastCollection {
  const price = getProductListPrice(product)
  const imageUrl = getProductPrimaryImageUrl(product) ?? placeholderImageUrl
  const quantity = getPrimaryVariantQuantity(product)
  let badgeLabel: string | undefined
  if (quantity <= 0) {
    badgeLabel = OUT_OF_STOCK_LABEL
  } else if (quantity < LOW_STOCK_THRESHOLD) {
    badgeLabel = 'Low Stock'
  }

  return {
    id: product.id,
    name: product.name,
    price,
    flavorNotes: productFlavorLine(product),
    roastMeta: formatProductRoastMeta(product),
    roastLevel: product.roastLevel,
    imageUrl,
    badgeLabel,
  }
}

export function parseTastingNotesString(notes = ''): string[] {
  return notes
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function mapProductToEditFormValues(
  product: Product,
): EditProductFormValues {
  return {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    roastLevel: product.roastLevel,
    isOrganic: product.isOrganic,
    isFairTrade: product.isFairTrade,
    origin: product.origin,
    processingMethod: product.processingMethod,
  }
}

export function mapProductToFormValues(product: Product): ProductFormValues {
  const variant = product.variants[0]
  const hasDiscount =
    Number(variant?.discountValue) > 0 &&
    Number.isFinite(Number(variant?.discountValue))

  const discountType =
    variant?.discountType === DISCOUNT_TYPE.FIXED
      ? DISCOUNT_TYPE.FIXED
      : DISCOUNT_TYPE.PERCENT

  return {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    roastLevel: product.roastLevel,
    isOrganic: product.isOrganic,
    isFairTrade: product.isFairTrade,
    weight: variant?.weight ?? 0,
    unit: variant?.unit ?? '',
    price: variant?.price ?? 0,
    discountType,
    discountValue: hasDiscount ? (variant?.discountValue ?? 0) : 0,
    quantity: variant?.quantity ?? 0,
    origin: product.origin,
    processingMethod: product.processingMethod,
  }
}

export function splitProductImagesForGallery(product: Product): {
  primaryUrl: string | null
  galleryItems: UploadImageGalleryItem[]
} {
  if (!product.images.length) {
    return { primaryUrl: null, galleryItems: [] }
  }

  const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
  const primary = sorted.find((image) => image.isPrimary) ?? sorted[0] ?? null
  const primaryUrl = primary?.url?.trim() ? primary.url.trim() : null

  const galleryItems: UploadImageGalleryItem[] = sorted
    .filter((image) => image !== primary)
    .map((image, index) => {
      const persistedId = image.id?.trim()
      return {
        id:
          persistedId !== undefined && persistedId !== ''
            ? persistedId
            : `existing-${index}-${image.sortOrder}`,
        url: image.url,
        name: `Gallery ${index + 1}`,
      }
    })

  return { primaryUrl, galleryItems }
}

function normalizeImageUrl(url: string): string {
  return url.trim()
}

export interface ProductUpdateImageDiff {
  addImages: ProductImagePayload[]
  removeImageIds: string[]
  updateImages: ProductImageUpdatePayload[]
}

/**
 * Builds the desired full image list. Only the avatar (UploadImage) is primary;
 * every gallery image is secondary.
 */
export function buildProductImagesPayload({
  avatarUrl,
  galleryUrls,
}: {
  avatarUrl: string | null
  galleryUrls: string[]
}): ProductImagePayload[] {
  const payload: ProductImagePayload[] = []
  if (avatarUrl) {
    payload.push({ url: avatarUrl, isPrimary: true, sortOrder: 0 })
  }
  galleryUrls.forEach((url, index) => {
    payload.push({
      url,
      isPrimary: false,
      sortOrder: avatarUrl ? index + 1 : index,
    })
  })
  return payload
}

/**
 * Builds addImages / removeImageIds / updateImages from full desired image list vs initial API state.
 * Matches by URL, consuming each initial image once so duplicate URLs are handled correctly.
 */
export function buildProductUpdateImageDiff(
  initialImages: ProductImage[],
  finalImages: ProductImagePayload[],
): ProductUpdateImageDiff {
  const available = new Map<string, ProductImage[]>()
  for (const img of initialImages) {
    const url = normalizeImageUrl(img.url)
    available.set(url, [...(available.get(url) ?? []), img])
  }

  const addImages: ProductImagePayload[] = []
  const updateImages: ProductImageUpdatePayload[] = []

  for (const fin of finalImages) {
    const url = normalizeImageUrl(fin.url)
    const candidates = available.get(url) ?? []
    // Prefer an unchanged match, then any persisted one.
    const matchIndex = candidates.findIndex(
      (c) =>
        c.id?.trim() &&
        c.sortOrder === fin.sortOrder &&
        c.isPrimary === fin.isPrimary,
    )
    const index =
      matchIndex !== -1
        ? matchIndex
        : candidates.findIndex((c) => Boolean(c.id?.trim()))

    if (index === -1) {
      addImages.push(fin)
      continue
    }

    const [init] = candidates.splice(index, 1)
    const persistedId = init?.id?.trim()
    if (
      persistedId &&
      (init.sortOrder !== fin.sortOrder || init.isPrimary !== fin.isPrimary)
    ) {
      updateImages.push({
        id: persistedId,
        sortOrder: fin.sortOrder,
        isPrimary: fin.isPrimary,
      })
    }
  }

  const removeImageIds: string[] = []
  for (const leftovers of available.values()) {
    for (const img of leftovers) {
      const id = img.id?.trim()
      if (id) removeImageIds.push(id)
    }
  }

  return { addImages, removeImageIds, updateImages }
}
