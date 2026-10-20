import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ErrorFallback from '@/components/ErrorFallback'

describe('ErrorFallback', () => {
  it('renders a generic error message', () => {
    render(
      <ErrorFallback reset={jest.fn()} homeHref="/" homeLabel="Back to Home" />,
    )

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
  })

  it('links home using the given href and label', () => {
    render(
      <ErrorFallback
        reset={jest.fn()}
        homeHref="/dashboard"
        homeLabel="Back to Dashboard"
      />,
    )

    expect(
      screen.getByRole('link', { name: 'Back to Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
  })

  it('calls reset when retrying', async () => {
    const user = userEvent.setup()
    const reset = jest.fn()
    render(
      <ErrorFallback reset={reset} homeHref="/" homeLabel="Back to Home" />,
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
