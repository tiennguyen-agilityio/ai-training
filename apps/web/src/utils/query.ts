import {
  keepPreviousData,
  type QueryClient,
  type QueryFilters,
} from '@tanstack/react-query'

import { LIST_QUERY_GC_MS, LIST_QUERY_STALE_MS } from '@/constants/common'
import type { ApiErrorResponse, ErrorDetail, ResponseMeta } from '@/types/api'

/** Cache timings for list queries; keeps the previous page while the next loads. */
export const listQueryOptions = {
  staleTime: LIST_QUERY_STALE_MS,
  gcTime: LIST_QUERY_GC_MS,
  placeholderData: keepPreviousData,
} as const

/** Cache timings for detail queries. */
export const detailQueryOptions = {
  staleTime: LIST_QUERY_STALE_MS,
  gcTime: LIST_QUERY_GC_MS,
} as const

/** A failed service call, with the API's field errors when it sent any. */
export class ServiceError extends Error {
  constructor(
    message: string,
    readonly errors: ErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

/**
 * Turns a failed service result into a thrown ServiceError so React Query
 * marks the query/mutation as errored and callers can read the field errors.
 */
export function throwIfServiceFailed(result: {
  ok: false
  error: string
  errorResponse?: ApiErrorResponse
}): never {
  throw new ServiceError(result.error, result.errorResponse?.errors)
}

/**
 * Human-readable message for a React Query error, or null when there is none.
 */
export const getQueryErrorMessage = (query: {
  isError: boolean
  error: unknown
}): string | null =>
  query.isError && query.error instanceof Error
    ? query.error.message
    : query.isError
      ? String(query.error)
      : null

/** The loading, error and refetch fields every data hook returns. */
export interface QueryResultState {
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  errorMessage: string | null
  refetch: () => Promise<void>
}

/**
 * Maps a React Query result to the hook fields; `isLoading` is true only while
 * the first data (or data for a new key without a placeholder) is fetched.
 */
export function toQueryResult(query: {
  data: unknown
  isFetching: boolean
  isError: boolean
  error: unknown
  refetch: () => Promise<unknown>
}): QueryResultState {
  return {
    isLoading: !query.data && query.isFetching,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage: getQueryErrorMessage(query),
    refetch: async () => {
      await query.refetch()
    },
  }
}

type CachedList<K extends string> = Record<K, { id?: string }[]> & {
  meta: ResponseMeta | null
}

/**
 * Drops a deleted item from every cached list matching `filters` and lowers
 * `meta.totalCount` by one; a list without the item is left as the same object.
 */
export function removeFromCachedLists<K extends string>(
  queryClient: QueryClient,
  filters: QueryFilters,
  itemsKey: K,
  deletedId: string,
): void {
  const deleted = deletedId.trim()
  queryClient.setQueriesData<CachedList<K>>(filters, (old) => {
    if (!old) return old
    const items = old[itemsKey]
    const remaining = items.filter(
      (item) => String(item.id ?? '').trim() !== deleted,
    )
    if (remaining.length === items.length) return old
    const meta = old.meta
      ? { ...old.meta, totalCount: Math.max(0, old.meta.totalCount - 1) }
      : null
    return { ...old, [itemsKey]: remaining, meta }
  })
}
