import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { EditUserForm } from '@/sections/EditUserForm'
import { useUpdateUserInfo } from '@/hooks/useUser'
import { uploadImageToImgBB } from '@/services/image'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { USER_ROLES, USER_STATUS } from '@/types/user'

jest.mock('@/hooks/useUser', () => ({
  useUpdateUserInfo: jest.fn(),
}))

jest.mock('@/services/image', () => ({
  uploadImageToImgBB: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/components/Select', () => ({
  Select: ({
    label,
    selected,
    disabled,
    onValueChange,
    options,
  }: {
    label?: string
    selected?: string
    disabled?: boolean
    onValueChange?: (value: string) => void
    options: { value: string; label: string }[]
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={selected ?? ''}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}))

describe('EditUserForm', () => {
  const onOpenChangeMock = jest.fn()
  const mutateMock = jest.fn()
  const useUpdateUserInfoMock = jest.mocked(useUpdateUserInfo)
  const uploadImageMock = jest.mocked(uploadImageToImgBB)

  const targetUser = {
    id: 'u-1',
    email: 'pat@example.com',
    firstName: 'Pat',
    lastName: 'Lee',
    name: 'Pat Lee',
    avatarUrl: 'https://example.com/pat.png',
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
  }

  const defaultProps = {
    open: true,
    onOpenChange: onOpenChangeMock,
    user: targetUser,
  }

  beforeEach(() => {
    useUpdateUserInfoMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserInfo>)
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-preview')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not render dialog content when closed', () => {
    render(<EditUserForm {...defaultProps} open={false} />)

    expect(screen.queryByTestId('modal-edit-user')).not.toBeInTheDocument()
  })

  it('prefills first name, last name, role, and status from the target user', () => {
    render(<EditUserForm {...defaultProps} />)

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Pat')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Lee')
    expect(screen.getByLabelText('Role')).toHaveValue(USER_ROLES.USER)
    expect(screen.getByLabelText('Status')).toHaveValue(USER_STATUS.ACTIVE)
  })

  it('submits the updated name, role, and status for the target user id', async () => {
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Patricia')
    await user.selectOptions(screen.getByLabelText('Role'), USER_ROLES.ADMIN)
    await user.selectOptions(
      screen.getByLabelText('Status'),
      USER_STATUS.INACTIVE,
    )
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mutateMock).toHaveBeenCalledWith(
      {
        id: 'u-1',
        payload: {
          firstName: 'Patricia',
          lastName: 'Lee',
          role: USER_ROLES.ADMIN,
          status: USER_STATUS.INACTIVE,
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )

    const [, callbacks] = mutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ]
    callbacks.onSuccess()

    expect(toast.success).toHaveBeenCalledWith(SUCCESS_MESSAGES.PROFILE_UPDATED)
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
  })

  it('uploads a new avatar and includes it in the submit payload', async () => {
    uploadImageMock.mockResolvedValue({
      ok: true,
      url: 'https://example.com/new-avatar.png',
    })
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/upload user photo/i), file)

    await waitFor(() => expect(uploadImageMock).toHaveBeenCalledWith(file))

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mutateMock).toHaveBeenCalledWith(
      {
        id: 'u-1',
        payload: {
          firstName: 'Pat',
          lastName: 'Lee',
          role: USER_ROLES.USER,
          status: USER_STATUS.ACTIVE,
          avatarUrl: 'https://example.com/new-avatar.png',
        },
      },
      expect.anything(),
    )
  })

  it('disables Save without a loading spinner while the avatar is uploading', async () => {
    let resolveUpload: (value: { ok: true; url: string }) => void = () => {
      /* noop until reassigned below */
    }
    uploadImageMock.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve
      }),
    )
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/upload user photo/i), file)

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeDisabled()
    expect(saveButton).not.toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /cancel/i })).toBeEnabled()
    expect(screen.getByLabelText(/first name/i)).toBeEnabled()

    resolveUpload({ ok: true, url: 'https://example.com/new-avatar.png' })
    await waitFor(() => expect(saveButton).toBeEnabled())
  })

  it('only shows the loading spinner and disables fields/close after Save is clicked', () => {
    useUpdateUserInfoMock.mockReturnValue({
      mutate: mutateMock,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateUserInfo>)

    render(<EditUserForm {...defaultProps} />)

    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).toBeDisabled()
    expect(screen.getByLabelText('Role')).toBeDisabled()
    expect(screen.getByLabelText('Status')).toBeDisabled()
  })

  it('shows the upload error and keeps the previous avatar on failure', async () => {
    uploadImageMock.mockResolvedValue({
      ok: false,
      error: 'Could not upload image',
    })
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/upload user photo/i), file)

    expect(
      await screen.findByText('Could not upload image'),
    ).toBeInTheDocument()
  })

  it('shows a required error and does not submit when first name is cleared', async () => {
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    await user.clear(screen.getByLabelText(/first name/i))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText(ERROR_MESSAGES.FIRST_NAME_REQUIRED),
    ).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('shows the API error and keeps the dialog open on failure', async () => {
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    const [, callbacks] = mutateMock.mock.calls[0] as [
      unknown,
      { onError: (error: Error) => void },
    ]
    act(() => callbacks.onError(new Error('Could not update user')))

    expect(await screen.findByText('Could not update user')).toBeInTheDocument()
    expect(onOpenChangeMock).not.toHaveBeenCalledWith(false)
  })

  it('closes without submitting on cancel', async () => {
    const user = userEvent.setup()
    render(<EditUserForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('shows a generic error when there is no target user id', async () => {
    const user = userEvent.setup()
    render(
      <EditUserForm
        {...defaultProps}
        user={{ ...targetUser, id: undefined }}
      />,
    )

    await waitFor(() =>
      expect(screen.getByLabelText(/first name/i)).toHaveValue('Pat'),
    )
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText(ERROR_MESSAGES.SOMETHING_WENT_WRONG),
    ).toBeInTheDocument()
    expect(mutateMock).not.toHaveBeenCalled()
  })
})
