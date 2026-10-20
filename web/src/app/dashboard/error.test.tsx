import { render, screen } from '@testing-library/react'

import DashboardErrorBoundary from '@/app/dashboard/error'

describe('DashboardErrorBoundary', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' })

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('links back to the dashboard, not the public home', () => {
    render(<DashboardErrorBoundary error={error} reset={jest.fn()} />)

    expect(
      screen.getByRole('link', { name: 'Back to Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
  })
})
