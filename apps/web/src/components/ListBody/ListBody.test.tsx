import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ListBody from '@/components/ListBody'

const baseProps = {
  isLoading: false,
  isError: false,
  errorMessage: null,
  isFetching: false,
}

describe('ListBody', () => {
  it('shows Loading while loading', () => {
    render(
      <ListBody {...baseProps} isLoading>
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('rows')).not.toBeInTheDocument()
  })

  it('prefers Loading over the error', () => {
    render(
      <ListBody {...baseProps} isLoading isError errorMessage="Failed">
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Failed')).not.toBeInTheDocument()
  })

  it('shows the error with Retry calling onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = jest.fn()
    render(
      <ListBody {...baseProps} isError errorMessage="Failed" onRetry={onRetry}>
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.queryByText('rows')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the error without Retry when onRetry is absent', () => {
    render(
      <ListBody {...baseProps} isError errorMessage="Failed">
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument()
  })

  it('shows the overlay only while fetching', () => {
    const { rerender } = render(
      <ListBody {...baseProps} isFetching>
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByText('rows')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(
      <ListBody {...baseProps}>
        <p>rows</p>
      </ListBody>,
    )

    expect(screen.getByText('rows')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
