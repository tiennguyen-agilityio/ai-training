import { act, renderHook } from '@testing-library/react'

import { SEARCH_URL_DEBOUNCE_MS } from '@/constants/common'
import { useDebouncedUrlSearch } from '@/hooks/useDebouncedUrlSearch'

interface HookProps {
  search: string
  updateUrl: jest.Mock
}

const renderSearchHook = (search = '') => {
  const updateUrl = jest.fn()
  const view = renderHook(
    (props: HookProps) => useDebouncedUrlSearch(props.search, props.updateUrl),
    { initialProps: { search, updateUrl } },
  )
  return { ...view, updateUrl }
}

describe('useDebouncedUrlSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('initialises the input from the URL search', () => {
    const { result } = renderSearchHook('latte')

    expect(result.current.searchInput).toBe('latte')
  })

  it('pushes the typed value to the URL after the debounce and resets page', () => {
    const { result, updateUrl } = renderSearchHook()

    act(() => result.current.setSearchInput('mocha'))
    act(() => jest.advanceTimersByTime(SEARCH_URL_DEBOUNCE_MS - 1))
    expect(updateUrl).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))
    expect(updateUrl).toHaveBeenCalledTimes(1)
    expect(updateUrl).toHaveBeenCalledWith({ search: 'mocha', page: 1 })
  })

  it('only pushes the last value when typing quickly', () => {
    const { result, updateUrl } = renderSearchHook()

    act(() => result.current.setSearchInput('m'))
    act(() => jest.advanceTimersByTime(100))
    act(() => result.current.setSearchInput('mo'))
    act(() => jest.advanceTimersByTime(SEARCH_URL_DEBOUNCE_MS))

    expect(updateUrl).toHaveBeenCalledTimes(1)
    expect(updateUrl).toHaveBeenCalledWith({ search: 'mo', page: 1 })
  })

  it('does not update the URL when the input already matches it', () => {
    const { updateUrl } = renderSearchHook('latte')

    act(() => jest.advanceTimersByTime(SEARCH_URL_DEBOUNCE_MS))

    expect(updateUrl).not.toHaveBeenCalled()
  })

  it('syncs the input when the URL search changes externally', () => {
    const { result, rerender, updateUrl } = renderSearchHook('latte')

    rerender({ search: 'espresso', updateUrl })

    expect(result.current.searchInput).toBe('espresso')
  })

  it('keeps what the user is typing when the input is focused', () => {
    const { result, rerender, updateUrl } = renderSearchHook('latte')
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    act(() => {
      result.current.searchInputRef.current = input
      result.current.setSearchInput('lat')
    })

    rerender({ search: 'espresso', updateUrl })

    expect(result.current.searchInput).toBe('lat')
    input.remove()
  })
})
