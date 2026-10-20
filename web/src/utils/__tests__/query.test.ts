import { getQueryErrorMessage, throwIfServiceFailed } from '@/utils/query'

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
})
