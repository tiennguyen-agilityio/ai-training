import { renderHook } from '@testing-library/react'

import { usePageClamp } from '@/hooks/usePageClamp'

const meta = { limit: 10, currentPage: 5, pageCount: 2, totalCount: 15 }

describe('usePageClamp', () => {
  it('moves the page back to totalPages when past it', () => {
    const updateUrl = jest.fn()

    renderHook(() => usePageClamp({ meta, page: 5, totalPages: 2, updateUrl }))

    expect(updateUrl).toHaveBeenCalledTimes(1)
    expect(updateUrl).toHaveBeenCalledWith({ page: 2 })
  })

  it('does nothing without meta', () => {
    const updateUrl = jest.fn()

    renderHook(() =>
      usePageClamp({ meta: null, page: 5, totalPages: 1, updateUrl }),
    )

    expect(updateUrl).not.toHaveBeenCalled()
  })

  it('does nothing within range', () => {
    const updateUrl = jest.fn()

    renderHook(() => usePageClamp({ meta, page: 2, totalPages: 2, updateUrl }))

    expect(updateUrl).not.toHaveBeenCalled()
  })
})
