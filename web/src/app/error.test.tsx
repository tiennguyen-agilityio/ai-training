import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import GlobalErrorBoundary from '@/app/error'

describe('GlobalErrorBoundary', () => {
  const error = Object.assign(new Error('secret db connection string leaked'), {
    digest: 'abc123',
  })

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders a generic message without leaking the raw error', () => {
    render(<GlobalErrorBoundary error={error} reset={jest.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/secret db connection string/i),
    ).not.toBeInTheDocument()
  })

  it('links back to a valid page', () => {
    render(<GlobalErrorBoundary error={error} reset={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('calls reset when retrying', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()
    render(<GlobalErrorBoundary error={error} reset={reset} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
