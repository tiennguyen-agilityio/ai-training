import { QueryClient, keepPreviousData } from '@tanstack/react-query'

import {
  ServiceError,
  detailQueryOptions,
  getQueryErrorMessage,
  listQueryOptions,
  removeFromCachedLists,
  throwIfServiceFailed,
  toQueryResult,
} from '@/utils/query'
import type { ResponseMeta } from '@/types/api'

describe('getQueryErrorMessage', () => {
  it('returns null when the query has no error', () => {
    expect(getQueryErrorMessage({ isError: false, error: null })).toBeNull()
  })

  it('returns the message of an Error', () => {
    expect(
      getQueryErrorMessage({ isError: true, error: new Error('Load failed') }),
    ).toBe('Load failed')
  })

  it('stringifies a non-Error value', () => {
    expect(getQueryErrorMessage({ isError: true, error: 'boom' })).toBe('boom')
  })
})

describe('throwIfServiceFailed', () => {
  it('throws an Error carrying the service error message', () => {
    expect(() =>
      throwIfServiceFailed({ ok: false, error: 'Request failed' }),
    ).toThrow(new Error('Request failed'))
  })

  it('throws a ServiceError carrying the API errors', () => {
    const errors = [
      {
        errCode: 'maxFixedDiscountValue',
        field: 'updateVariants.0.discountValue',
        message: 'Fixed discount must be less than base price',
      },
    ]

    let thrown: unknown
    try {
      throwIfServiceFailed({
        ok: false,
        error: 'Fixed discount must be less than base price',
        errorResponse: {
          statusCode: 400,
          message: 'Validation failed',
          errors,
        },
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ServiceError)
    expect((thrown as ServiceError).message).toBe(
      'Fixed discount must be less than base price',
    )
    expect((thrown as ServiceError).errors).toEqual(errors)
  })
})

describe('query options', () => {
  it('list options carry the shared timings and keep previous data', () => {
    expect(listQueryOptions).toEqual({
      staleTime: 60_000,
      gcTime: 300_000,
      placeholderData: keepPreviousData,
    })
  })

  it('detail options carry the shared timings without placeholder data', () => {
    expect(detailQueryOptions).toEqual({ staleTime: 60_000, gcTime: 300_000 })
    expect(detailQueryOptions).not.toHaveProperty('placeholderData')
  })
})

describe('toQueryResult', () => {
  const query = (state: {
    data?: unknown
    isFetching?: boolean
    isError?: boolean
    error?: unknown
  }) => ({
    data: undefined,
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn().mockResolvedValue({ data: 'x' }),
    ...state,
  })

  it('reports loading only with no data while fetching', () => {
    expect(
      toQueryResult(query({ data: undefined, isFetching: true })),
    ).toMatchObject({ isLoading: true, isFetching: true })
    expect(toQueryResult(query({ data: 'x', isFetching: true }))).toMatchObject(
      { isLoading: false, isFetching: true },
    )
    expect(
      toQueryResult(query({ data: undefined, isFetching: false })),
    ).toMatchObject({ isLoading: false, isFetching: false })
  })

  it('maps the error state and message', () => {
    expect(
      toQueryResult(query({ isError: true, error: new Error('Load failed') })),
    ).toMatchObject({ isError: true, errorMessage: 'Load failed' })
    expect(toQueryResult(query({ isError: false, error: null }))).toMatchObject(
      { isError: false, errorMessage: null },
    )
  })

  it('refetch resolves to undefined', async () => {
    const source = query({})
    const result = toQueryResult(source)

    await expect(result.refetch()).resolves.toBeUndefined()
    expect(source.refetch).toHaveBeenCalledTimes(1)
  })

  it('returns only the five state fields', () => {
    expect(Object.keys(toQueryResult(query({}))).sort()).toEqual([
      'errorMessage',
      'isError',
      'isFetching',
      'isLoading',
      'refetch',
    ])
  })
})

describe('removeFromCachedLists', () => {
  interface ThingsList {
    things: { id?: string }[]
    meta: ResponseMeta | null
  }

  const key = ['things', 'list', 1] as const
  const filters = { queryKey: ['things', 'list'] }
  const meta: ResponseMeta = {
    limit: 10,
    currentPage: 1,
    pageCount: 1,
    totalCount: 2,
  }

  let client: QueryClient

  const seed = (list: ThingsList, queryKey: readonly unknown[] = key) => {
    client.setQueryData(queryKey, list)
    return client.getQueryData<ThingsList>(queryKey)
  }

  beforeEach(() => {
    client = new QueryClient()
  })

  afterEach(() => {
    client.clear()
  })

  it('removes the item and decrements totalCount', () => {
    seed({ things: [{ id: 'a' }, { id: 'b' }], meta })

    removeFromCachedLists(client, filters, 'things', 'a')

    expect(client.getQueryData<ThingsList>(key)).toEqual({
      things: [{ id: 'b' }],
      meta: { ...meta, totalCount: 1 },
    })
  })

  it('clamps totalCount at 0', () => {
    seed({ things: [{ id: 'a' }], meta: { ...meta, totalCount: 0 } })

    removeFromCachedLists(client, filters, 'things', 'a')

    expect(client.getQueryData<ThingsList>(key)?.meta?.totalCount).toBe(0)
  })

  it('keeps a null meta', () => {
    seed({ things: [{ id: 'a' }, { id: 'b' }], meta: null })

    removeFromCachedLists(client, filters, 'things', 'a')

    expect(client.getQueryData<ThingsList>(key)).toEqual({
      things: [{ id: 'b' }],
      meta: null,
    })
  })

  it('returns the same list when no item matches', () => {
    const seeded = seed({ things: [{ id: 'a' }, { id: 'b' }], meta })

    removeFromCachedLists(client, filters, 'things', 'zzz')

    expect(client.getQueryData(key)).toBe(seeded)
  })

  it('matches ids after trimming', () => {
    seed({ things: [{ id: ' a ' }, { id: undefined }, { id: 'b' }], meta })

    removeFromCachedLists(client, filters, 'things', 'a ')

    expect(client.getQueryData<ThingsList>(key)?.things).toEqual([
      { id: undefined },
      { id: 'b' },
    ])
  })

  it('only touches lists matching the filters', () => {
    seed({ things: [{ id: 'a' }, { id: 'b' }], meta })
    const other = seed({ things: [{ id: 'a' }, { id: 'b' }], meta }, [
      'other',
      'list',
    ])

    removeFromCachedLists(client, filters, 'things', 'a')

    expect(client.getQueryData(['other', 'list'])).toBe(other)
  })
})
