import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ERROR_MESSAGES } from '@/constants/messages'
import { ServiceError } from '@/utils/query'

export interface ServerFieldError<K extends string> {
  field: K
  message: string
}

const fallbackMessage = (error: unknown) =>
  error instanceof Error && error.message.trim()
    ? error.message
    : ERROR_MESSAGES.NETWORK_ERROR

/**
 * Splits a failed mutation's API errors into the ones `resolve` maps to a form
 * target (first message per target) and the distinct messages left for the
 * form's fallback (toast or banner), in API order. An API error without a
 * message is skipped; when nothing is left to show, the error's own message
 * is the fallback.
 */
export function mapServerErrors<K extends string>(
  error: unknown,
  resolve: (apiField: string) => K | undefined,
): { fieldErrors: ServerFieldError<K>[]; unmatched: string[] } {
  const details = error instanceof ServiceError ? error.errors : []
  const fieldErrors: ServerFieldError<K>[] = []
  const unmatched: string[] = []
  for (const detail of details) {
    const message = detail.message?.trim()
      ? detail.message.trim()
      : (detail.description?.trim() ?? '')
    if (!message) continue
    const field = detail.field ? resolve(detail.field) : undefined
    if (field) {
      if (!fieldErrors.some((entry) => entry.field === field)) {
        fieldErrors.push({ field, message })
      }
    } else if (!unmatched.includes(message)) {
      unmatched.push(message)
    }
  }

  if (!fieldErrors.length && !unmatched.length) {
    unmatched.push(fallbackMessage(error))
  }
  return { fieldErrors, unmatched }
}

/** Shows API errors under their react-hook-form fields, focusing the first. */
export function setServerFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: ServerFieldError<Path<T>>[],
): void {
  fieldErrors.forEach(({ field, message }, index) => {
    setError(field, { type: 'server', message }, { shouldFocus: index === 0 })
  })
}
