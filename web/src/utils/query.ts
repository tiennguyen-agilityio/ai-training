/**
 * Turns a failed service result into a thrown Error so React Query marks the
 * query/mutation as errored.
 */
export function throwIfServiceFailed(result: {
  ok: false
  error: string
}): never {
  throw new Error(result.error)
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
