'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PAGE_SIZE } from '@/constants/common'
import {
  createProduct,
  deleteProduct,
  fetchProductById,
  fetchProducts,
  updateProduct,
  type ProductOptions,
} from '@/services/product'
import type { ResponseMeta } from '@/types/api'
import type { CreateProductPayload, UpdateProductPayload } from '@repo/schemas'
import type { Product } from '@/types/product'
import {
  detailQueryOptions,
  listQueryOptions,
  removeFromCachedLists,
  throwIfServiceFailed,
  toQueryResult,
} from '@/utils/query'

export interface UseProductsResult {
  products: Product[]
  meta: ResponseMeta | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  errorMessage: string | null
  refetch: () => Promise<void>
}

const productsQueryRoot = ['products'] as const

export function productDetailQueryKey(id: string) {
  return ['products', 'detail', id] as const
}

export function productsListQueryKey(params: ProductOptions) {
  return [
    'products',
    'list',
    params.page ?? 1,
    params.limit ?? PAGE_SIZE,
    params.search ?? '',
    params.categoryId ?? '',
    params.status ?? '',
    params.minPrice ?? '',
    params.maxPrice ?? '',
    params.roastLevel ?? '',
    params.sortBy ?? '',
  ] as const
}

export const useProducts = (params: ProductOptions = {}): UseProductsResult => {
  const query = useQuery({
    queryKey: productsListQueryKey(params),
    queryFn: async () => {
      const result = await fetchProducts(params)
      if (!result.ok) throwIfServiceFailed(result)
      return {
        products: result.products,
        meta: result.meta ?? null,
      }
    },
    ...listQueryOptions,
  })

  return {
    products: query.data?.products ?? [],
    meta: query.data?.meta ?? null,
    ...toQueryResult(query),
  }
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateProductPayload) => {
      const result = await createProduct(body)
      if (!result.ok) throwIfServiceFailed(result)
      return result.product
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryRoot })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProduct(id)
      if (!result.ok) throwIfServiceFailed(result)
    },
    onSuccess: async (_result, deletedId) => {
      removeFromCachedLists(
        queryClient,
        { queryKey: ['products', 'list'] },
        'products',
        deletedId,
      )
      await queryClient.invalidateQueries({ queryKey: productsQueryRoot })
    },
  })
}

export interface UseProductByIdResult {
  product: Product | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  refetch: () => Promise<void>
}

export function useProductById(id: string): UseProductByIdResult {
  const query = useQuery({
    queryKey: productDetailQueryKey(id),
    queryFn: async () => {
      const result = await fetchProductById(id)
      if (!result.ok) throwIfServiceFailed(result)
      return result.product
    },
    enabled: Boolean(id?.trim()),
    ...detailQueryOptions,
  })

  const { isFetching: _isFetching, ...state } = toQueryResult(query)

  return { product: query.data ?? null, ...state }
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; body: UpdateProductPayload }) => {
      const result = await updateProduct(input.id, input.body)
      if (!result.ok) throwIfServiceFailed(result)
      return result.product
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryRoot })
      void queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.id.trim()),
      })
    },
  })
}
