import { type OptionItem } from '@/types/common'
import { ProductSortBy, RoastLevel, VALIDATION_RULES } from '@repo/constants'

export const ROAST_PRICE_MIN = VALIDATION_RULES.PRICE.MIN
export const ROAST_PRICE_MAX = VALIDATION_RULES.PRICE.MAX

export const ROAST_DEFAULT_PRICE_RANGE: [number, number] = [
  ROAST_PRICE_MIN,
  ROAST_PRICE_MAX,
]

// The API's sort values plus the UI-only default (no sort param sent).
export const ROAST_SORT_VALUE = {
  CURATED: 'curated',
  ...ProductSortBy,
} as const

export type RoastSortValue =
  (typeof ROAST_SORT_VALUE)[keyof typeof ROAST_SORT_VALUE]

export interface RoastLevelOption {
  value: RoastLevel
  label: string
}

export const ROAST_LEVEL_OPTIONS: RoastLevelOption[] = [
  { value: RoastLevel.LIGHT, label: 'Light Roast' },
  { value: RoastLevel.MEDIUM, label: 'Medium Roast' },
  { value: RoastLevel.DARK, label: 'Dark Roast' },
]

export const ROAST_LEVEL_SPECTRUM_PERCENT: Record<RoastLevel, number> = {
  [RoastLevel.LIGHT]: 15,
  [RoastLevel.MEDIUM]: 50,
  [RoastLevel.DARK]: 85,
}

export const ROAST_SORT_OPTIONS: OptionItem[] = [
  { value: ROAST_SORT_VALUE.CURATED, label: 'Curated Selection' },
  { value: ROAST_SORT_VALUE.PRICE_ASC, label: 'Price: Low to High' },
  { value: ROAST_SORT_VALUE.PRICE_DESC, label: 'Price: High to Low' },
  { value: ROAST_SORT_VALUE.NAME_ASC, label: 'Name: A to Z' },
  { value: ROAST_SORT_VALUE.NAME_DESC, label: 'Name: Z to A' },
]

export interface RoastCollection {
  id: string
  name: string
  price: number
  flavorNotes: string
  roastMeta: string
  roastLevel: RoastLevel
  imageUrl: string
  badgeLabel?: string
}
