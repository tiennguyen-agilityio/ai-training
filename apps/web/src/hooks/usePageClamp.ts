'use client'

import { useEffect } from 'react'

import type { ResponseMeta } from '@/types/api'

interface UsePageClampArgs {
  meta: ResponseMeta | null | undefined
  page: number
  totalPages: number
  updateUrl: (patch: { page: number }) => void
}

/**
 * Moves a list page's `page` URL param back to the last page once the list's
 * meta shows it is past `totalPages` (e.g. after the last row of a page went).
 */
export function usePageClamp({
  meta,
  page,
  totalPages,
  updateUrl,
}: UsePageClampArgs): void {
  useEffect(() => {
    if (meta && page > totalPages) {
      updateUrl({ page: totalPages })
    }
  }, [meta, page, totalPages, updateUrl])
}
