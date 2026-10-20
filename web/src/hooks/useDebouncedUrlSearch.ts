'use client'

import { useEffect, useRef, useState } from 'react'

import { SEARCH_URL_DEBOUNCE_MS } from '@/constants/common'

type UpdateSearchUrl = (patch: { search: string; page: number }) => void

/**
 * Two-way sync between a list page's search input and its `search` URL param.
 * Typing pushes to the URL after SEARCH_URL_DEBOUNCE_MS (resetting to page 1);
 * an external URL change (back/forward, reset) updates the input unless the
 * user is currently typing in it.
 */
export function useDebouncedUrlSearch(
  search: string,
  updateUrl: UpdateSearchUrl,
) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchInput, setSearchInput] = useState(search)
  const updateUrlRef = useRef(updateUrl)
  const urlSearchRef = useRef(search)
  const lastUrlSearchSynced = useRef<string | null>(null)
  updateUrlRef.current = updateUrl
  urlSearchRef.current = search

  useEffect(() => {
    if (lastUrlSearchSynced.current === null) {
      lastUrlSearchSynced.current = search
      return
    }
    if (search === lastUrlSearchSynced.current) return
    lastUrlSearchSynced.current = search
    if (searchInputRef.current === document.activeElement) return
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (searchInput === urlSearchRef.current) return
      updateUrlRef.current({ search: searchInput, page: 1 })
    }, SEARCH_URL_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

  return { searchInput, setSearchInput, searchInputRef }
}
