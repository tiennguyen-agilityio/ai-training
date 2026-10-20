import { render, screen } from '@testing-library/react'

import NotFound from '@/app/not-found'

describe('NotFound', () => {
  it('renders the 404 message', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(screen.getByText('404 Error')).toBeInTheDocument()
  })

  it('links back to a valid page', () => {
    render(<NotFound />)

    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Shop Roasts' })).toHaveAttribute(
      'href',
      '/roasts',
    )
  })
})
