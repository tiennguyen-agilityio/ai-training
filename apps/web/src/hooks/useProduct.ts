'use client'

import { useAuth } from '@clerk/nextjs'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  CLERK_SESSION_TEMPLATE,
  LIST_QUERY_GC_MS,
  LIST_QUERY_STALE_MS,
  PAGE_SIZE,
} from '@/constants/common'
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
import { ProductStatus } from '@repo/constants'
import { getQueryErrorMessage, throwIfServiceFailed } from '@/utils/query'

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

const listQueryOptions = {
  staleTime: LIST_QUERY_STALE_MS,
  gcTime: LIST_QUERY_GC_MS,
  placeholderData: keepPreviousData,
} as const

const detailQueryOptions = {
  staleTime: LIST_QUERY_STALE_MS,
  gcTime: LIST_QUERY_GC_MS,
} as const

export function productDetailQueryRoot(id: string) {
  return ['products', 'detail', id] as const
}

// What the API returns depends on who asks, so admin reads are cached per
// user and apart from the shop's.
export function productDetailQueryKey(
  id: string,
  options: { asAdmin?: boolean; userId?: string | null } = {},
) {
  const asAdmin = options.asAdmin ?? false
  return [
    ...productDetailQueryRoot(id),
    asAdmin,
    asAdmin ? (options.userId ?? null) : null,
  ] as const
}

export function productsListQueryKey(
  params: ProductOptions,
  userId: string | null = null,
) {
  const asAdmin = params.asAdmin ?? false
  return [
    'products',
    'list',
    asAdmin,
    params.page ?? 1,
    params.limit ?? PAGE_SIZE,
    params.search ?? '',
    params.categoryId ?? '',
    params.status ?? '',
    params.minPrice ?? '',
    params.maxPrice ?? '',
    params.roastLevel ?? '',
    params.sortBy ?? '',
    asAdmin ? userId : null,
  ] as const
}

export const useProducts = (params: ProductOptions = {}): UseProductsResult => {
  const { isLoaded, userId, getToken } = useAuth()
  const asAdmin = params.asAdmin ?? false

  const query = useQuery({
    queryKey: productsListQueryKey(params, userId ?? null),
    queryFn: async () => {
      // Without the token the API answers as a shopper (ACTIVE only), so an
      // admin list must not run before Clerk can sign the request.
      const result = await fetchProducts(
        asAdmin
          ? {
              ...params,
              getToken: () => getToken({ template: CLERK_SESSION_TEMPLATE }),
            }
          : params,
      )
      if (!result.ok) throwIfServiceFailed(result)
      return {
        products: result.products,
        meta: result.meta ?? null,
      }
    },
    enabled: !asAdmin || isLoaded,
    ...listQueryOptions,
  })

  return {
    products: query.data?.products ?? [],
    meta: query.data?.meta ?? null,
    isLoading: !query.data && (query.isFetching || (asAdmin && !isLoaded)),
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage: getQueryErrorMessage(query),
    refetch: async () => {
      await query.refetch()
    },
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

interface ProductsListCache {
  products: Product[]
  meta: ResponseMeta | null
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProduct(id)
      if (!result.ok) throwIfServiceFailed(result)
    },
    onSuccess: async (_result, deletedId) => {
      // The API archives a product when it deletes it.
      const markDeleted = (product: Product): Product => ({
        ...product,
        status: ProductStatus.ARCHIVED,
        deletedAt: new Date().toISOString(),
      })
      // Admin lists show deleted products, so they keep the row, marked.
      queryClient.setQueriesData<ProductsListCache>(
        { queryKey: ['products', 'list', true] },
        (old) => {
          if (!old) return old
          if (!old.products.some((p) => p.id === deletedId)) return old
          const products = old.products.map((p) =>
            p.id === deletedId ? markDeleted(p) : p,
          )
          return { ...old, products }
        },
      )
      queryClient.setQueriesData<Product>(
        { queryKey: productDetailQueryRoot(deletedId) },
        (old) => (old ? markDeleted(old) : old),
      )
      queryClient.setQueriesData<ProductsListCache>(
        { queryKey: ['products', 'list', false] },
        (old) => {
          if (!old) return old
          const products = old.products.filter((p) => p.id !== deletedId)
          if (products.length === old.products.length) return old
          const meta = old.meta
            ? {
                ...old.meta,
                totalCount: Math.max(0, old.meta.totalCount - 1),
              }
            : null
          return { products, meta }
        },
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

export function useProductById(
  id: string,
  options: { asAdmin?: boolean } = {},
): UseProductByIdResult {
  const { isLoaded, userId, getToken } = useAuth()
  const asAdmin = options.asAdmin ?? false

  const query = useQuery({
    queryKey: productDetailQueryKey(id, { asAdmin, userId: userId ?? null }),
    queryFn: async () => {
      const result = await fetchProductById(
        id,
        asAdmin
          ? {
              asAdmin,
              getToken: () => getToken({ template: CLERK_SESSION_TEMPLATE }),
            }
          : {},
      )
      if (!result.ok) throwIfServiceFailed(result)
      return result.product
    },
    enabled: Boolean(id?.trim()) && (!asAdmin || isLoaded),
    ...detailQueryOptions,
  })

  return {
    product: query.data ?? null,
    isLoading: !query.data && (query.isFetching || (asAdmin && !isLoaded)),
    isError: query.isError,
    errorMessage: getQueryErrorMessage(query),
    refetch: async () => {
      await query.refetch()
    },
  }
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
        queryKey: productDetailQueryRoot(variables.id.trim()),
      })
    },
  })
}
