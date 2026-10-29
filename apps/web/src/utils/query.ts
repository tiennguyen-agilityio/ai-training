import type { ApiErrorResponse, ErrorDetail } from '@/types/api'

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
