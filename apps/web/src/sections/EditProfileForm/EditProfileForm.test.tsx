import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { EditProfileForm } from '@/sections/EditProfileForm'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { useAuth } from '@/hooks/useAuth'
import { useUserStore } from '@/store/useUserStore'

const mockUseClerkUser = jest.fn()

jest.mock('@clerk/nextjs', () => ({
  useUser: (...args: unknown[]) => mockUseClerkUser(...args),
}))

jest.mock('@clerk/nextjs/errors', () => ({
  isClerkAPIResponseError: () => false,
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

describe('EditProfileForm', () => {
  const onOpenChangeMock = jest.fn()
  const updateMock = jest.fn()
  const setProfileImageMock = jest.fn()
  const refetchMock = jest.fn()
  const useAuthMock = jest.mocked(useAuth)

  const defaultProps = {
    open: true,
    onOpenChange: onOpenChangeMock,
  }

  beforeEach(() => {
    const clerkUser = {
      firstName: 'Jane',
      lastName: 'Doe',
      fullName: 'Jane Doe',
      imageUrl: 'https://example.com/avatar.png',
      update: updateMock,
      setProfileImage: setProfileImageMock,
    }
    updateMock.mockImplementation(
      (params: { firstName?: string; lastName?: string }) => {
        Object.assign(clerkUser, params)
        return Promise.resolve(clerkUser)
      },
    )
    setProfileImageMock.mockImplementation(() => {
      clerkUser.imageUrl = 'https://example.com/new-avatar.png'
      return Promise.resolve({ publicUrl: clerkUser.imageUrl })
    })
    refetchMock.mockResolvedValue(undefined)
    mockUseClerkUser.mockReturnValue({ user: clerkUser, isLoaded: true })
    useAuthMock.mockReturnValue({
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useAuth>)
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-preview')
    useUserStore.setState({
      user: {
        id: 'user-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        name: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.png',
        deletedAt: null,
      },
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    useUserStore.setState({ user: null, isLoading: false, error: null })
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('does not render dialog content when closed', () => {
    render(<EditProfileForm {...defaultProps} open={false} />)

    expect(screen.queryByTestId('modal-edit-profile')).not.toBeInTheDocument()
  })

  it('prefills first and last name from the Clerk user', () => {
    render(<EditProfileForm {...defaultProps} />)

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Jane')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
  })

  it('shows the saved name, toasts success, and closes immediately without waiting on the backend', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Janet')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        firstName: 'Janet',
        lastName: 'Doe',
      }),
    )

    expect(useUserStore.getState().user).toMatchObject({
      firstName: 'Janet',
      lastName: 'Doe',
      name: null,
    })
    expect(toast.success).toHaveBeenCalledWith(SUCCESS_MESSAGES.PROFILE_UPDATED)
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    // The backend sync check runs on a delay in the background — it hasn't
    // fired yet at this point.
    expect(refetchMock).not.toHaveBeenCalled()
  })

  it('verifies the backend synced afterward, stopping once it matches', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })
    render(<EditProfileForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Janet')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    refetchMock.mockImplementation(async () => {
      useUserStore.setState((state) => ({
        user: state.user ? { ...state.user, firstName: 'Janet' } : null,
      }))
    })

    await act(() => jest.advanceTimersByTimeAsync(1000))

    expect(refetchMock).toHaveBeenCalledTimes(1)

    // No further retries once the backend copy matches.
    await act(() => jest.advanceTimersByTimeAsync(10000))
    expect(refetchMock).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('warns the user if the backend never confirms the sync', async () => {
    // The backend keeps returning the old name — simulates the webhook
    // never landing.
    refetchMock.mockImplementation(async () => {
      useUserStore.setState((state) => ({
        user: state.user ? { ...state.user, firstName: 'Jane' } : null,
      }))
    })
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })
    render(<EditProfileForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Janet')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await act(() => jest.advanceTimersByTimeAsync(1000 + 2000 + 3000 + 4000))

    expect(refetchMock).toHaveBeenCalledTimes(4)
    expect(toast.error).toHaveBeenCalledWith(
      ERROR_MESSAGES.PROFILE_SYNC_DELAYED,
    )
  })

  it('does not let a stale verification overwrite a newer save', async () => {
    // The backend never reflects either save — both retry loops would
    // otherwise exhaust their budget and each try to warn.
    refetchMock.mockImplementation(async () => {
      useUserStore.setState((state) => ({
        user: state.user ? { ...state.user, firstName: 'Jane' } : null,
      }))
    })
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })
    render(<EditProfileForm {...defaultProps} />)

    // First save.
    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'First')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // Second save starts before the first save's retry loop has finished.
    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Second')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(useUserStore.getState().user).toMatchObject({ firstName: 'Second' })

    // Let both retry loops run to completion. The stale (first) loop must
    // not clobber the newer optimistic value or fire its own warning.
    await act(() => jest.advanceTimersByTimeAsync(1000 + 2000 + 3000 + 4000))

    expect(useUserStore.getState().user).toMatchObject({ firstName: 'Second' })
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it('shows a required error and does not submit when first name is cleared', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText(ERROR_MESSAGES.FIRST_NAME_REQUIRED),
    ).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
    expect(refetchMock).not.toHaveBeenCalled()
  })

  it('uploads a new avatar via Clerk on save', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm {...defaultProps} />)

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/upload profile photo/i), file)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(setProfileImageMock).toHaveBeenCalledWith({ file }),
    )
    expect(useUserStore.getState().user).toMatchObject({
      avatarUrl: 'https://example.com/new-avatar.png',
    })
  })

  it('shows the Clerk error message and does not refetch or close on failure', async () => {
    updateMock.mockRejectedValue(new Error('That name is not allowed'))
    const user = userEvent.setup()
    render(<EditProfileForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText('That name is not allowed'),
    ).toBeInTheDocument()
    expect(refetchMock).not.toHaveBeenCalled()
    expect(onOpenChangeMock).not.toHaveBeenCalled()
  })

  it('closes without submitting on cancel', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    expect(updateMock).not.toHaveBeenCalled()
  })
})
