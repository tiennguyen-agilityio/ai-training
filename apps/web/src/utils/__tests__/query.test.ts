import {
  ServiceError,
  getQueryErrorMessage,
  throwIfServiceFailed,
} from '@/utils/query'

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
