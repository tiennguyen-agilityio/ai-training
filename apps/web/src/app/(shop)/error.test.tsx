import { render, screen } from '@testing-library/react'

import ShopErrorBoundary from '@/app/(shop)/error'

describe('ShopErrorBoundary', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' })

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('links back to the shop home', () => {
    render(<ShopErrorBoundary error={error} reset={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
