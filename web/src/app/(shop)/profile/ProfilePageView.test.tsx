import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProfilePageView } from '@/app/(shop)/profile/ProfilePageView'

const mockUseAuth = jest.fn()
const mockUseClerkUser = jest.fn()

jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

jest.mock('@clerk/nextjs', () => ({
  useUser: (...args: unknown[]) => mockUseClerkUser(...args),
}))

jest.mock('@clerk/nextjs/errors', () => ({
  isClerkAPIResponseError: () => false,
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

describe('ProfilePageView', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        name: null,
        email: 'jane@example.com',
        avatarUrl: null,
      },
      error: null,
      isSignedIn: true,
      isAuthLoaded: true,
    })
    mockUseClerkUser.mockReturnValue({
      user: {
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        imageUrl: 'https://example.com/avatar.png',
        update: jest.fn(),
        setProfileImage: jest.fn(),
      },
      isLoaded: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not render the order history section (order feature not implemented on backend yet)', () => {
    render(<ProfilePageView />)

    expect(screen.queryByText('Order History')).not.toBeInTheDocument()
  })

  it('enables the Edit Profile action once the user is signed in', () => {
    render(<ProfilePageView />)

    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeEnabled()
  })

  it('disables the Edit Profile action while signed out', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      error: null,
      isSignedIn: false,
      isAuthLoaded: true,
    })

    render(<ProfilePageView />)

    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeDisabled()
  })

  it('opens the edit profile dialog prefilled from the Clerk user', async () => {
    const user = userEvent.setup()
    render(<ProfilePageView />)

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }))

    expect(screen.getByTestId('modal-edit-profile')).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Jane')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
  })
})
