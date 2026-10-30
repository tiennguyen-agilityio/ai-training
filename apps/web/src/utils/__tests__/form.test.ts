import { ERROR_MESSAGES } from '@/constants/messages'
import {
  getErrorMessage,
  mapServerErrors,
  setServerFieldErrors,
} from '@/utils/form'
import { ServiceError } from '@/utils/query'

const resolve = (field: string) => {
  if (field === 'name') return 'name'
  if (field === 'variants.0.price') return 'price'
  return undefined
}

const detail = (field: string, message: string, description?: string) => ({
  errCode: 'E',
  field,
  message,
  ...(description !== undefined && { description }),
})

describe('mapServerErrors', () => {
  it('maps a matched field to its form field', () => {
    const error = new ServiceError('x', [detail('name', 'Name taken')])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [{ field: 'name', message: 'Name taken' }],
      unmatched: [],
    })
  })

  it('maps a nested API path through the resolver', () => {
    const error = new ServiceError('x', [
      detail('variants.0.price', 'Price too high'),
    ])

    expect(mapServerErrors(error, resolve).fieldErrors).toEqual([
      { field: 'price', message: 'Price too high' },
    ])
  })

  it('sends unmatched errors to the fallback in API order, once each', () => {
    const error = new ServiceError('x', [
      detail('', 'A'),
      detail('sku', 'B'),
      detail('', 'A'),
    ])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [],
      unmatched: ['A', 'B'],
    })
  })

  it('keeps matched and unmatched errors together', () => {
    const error = new ServiceError('x', [
      detail('variants.0.price', 'Price too high'),
      detail('', 'Too many images'),
    ])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [{ field: 'price', message: 'Price too high' }],
      unmatched: ['Too many images'],
    })
  })

  it('keeps the first message per field', () => {
    const error = new ServiceError('x', [
      detail('name', 'First'),
      detail('name', 'Second'),
    ])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [{ field: 'name', message: 'First' }],
      unmatched: [],
    })
  })

  it('uses description when message is empty', () => {
    const error = new ServiceError('x', [detail('name', '', 'Desc')])

    expect(mapServerErrors(error, resolve).fieldErrors).toEqual([
      { field: 'name', message: 'Desc' },
    ])
  })

  it('falls back to the error message when no API error has a message', () => {
    const error = new ServiceError('Conflict', [detail('', '')])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [],
      unmatched: ['Conflict'],
    })
  })

  it('does not set a field error without a message', () => {
    const error = new ServiceError('Conflict', [detail('name', '')])

    expect(mapServerErrors(error, resolve)).toEqual({
      fieldErrors: [],
      unmatched: ['Conflict'],
    })
  })

  it('falls back to the error message when errors[] is empty', () => {
    expect(mapServerErrors(new ServiceError('Network down'), resolve)).toEqual({
      fieldErrors: [],
      unmatched: ['Network down'],
    })
  })

  it('falls back to the message of a plain Error', () => {
    expect(mapServerErrors(new Error('Boom'), resolve)).toEqual({
      fieldErrors: [],
      unmatched: ['Boom'],
    })
  })

  it('falls back to NETWORK_ERROR for a non-Error value', () => {
    expect(mapServerErrors('boom', resolve)).toEqual({
      fieldErrors: [],
      unmatched: [ERROR_MESSAGES.NETWORK_ERROR],
    })
  })
})

describe('setServerFieldErrors', () => {
  it('sets each error with type server and focuses only the first', () => {
    const setError = jest.fn()

    setServerFieldErrors(setError, [
      { field: 'name', message: 'A' },
      { field: 'price', message: 'B' },
    ])

    expect(setError.mock.calls).toEqual([
      ['name', { type: 'server', message: 'A' }, { shouldFocus: true }],
      ['price', { type: 'server', message: 'B' }, { shouldFocus: false }],
    ])
  })

  it('focuses the first field again on the next tick when setFocus is given', () => {
    jest.useFakeTimers()
    const setFocus = jest.fn()

    setServerFieldErrors(
      jest.fn(),
      [
        { field: 'name', message: 'A' },
        { field: 'price', message: 'B' },
      ],
      setFocus,
    )
    expect(setFocus).not.toHaveBeenCalled()
    jest.runAllTimers()

    expect(setFocus.mock.calls).toEqual([['name']])
    jest.useRealTimers()
  })
})

describe('getErrorMessage', () => {
  it('returns the error message', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom')
  })

  it('falls back to NETWORK_ERROR for a blank message', () => {
    expect(getErrorMessage(new Error(''))).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    expect(getErrorMessage(new Error('   '))).toBe(ERROR_MESSAGES.NETWORK_ERROR)
  })

  it('falls back to NETWORK_ERROR for a non-Error', () => {
    expect(getErrorMessage('boom')).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    expect(getErrorMessage({ message: 'x' })).toBe(ERROR_MESSAGES.NETWORK_ERROR)
  })
})
