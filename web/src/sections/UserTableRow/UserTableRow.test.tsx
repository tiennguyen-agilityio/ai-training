import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UserTableRow } from '@/sections/UserTableRow'
import { USER_ROLES, USER_STATUS } from '@/types/user'

const baseUser = {
  id: 'u-1',
  email: 'pat@example.com',
  firstName: 'Pat',
  lastName: 'Lee',
  name: 'Pat Lee',
  avatarUrl: null,
  role: USER_ROLES.USER,
  status: USER_STATUS.ACTIVE,
}

describe('UserTableRow', () => {
  it('sets title on name and email for hover when text may truncate', () => {
    const longEmail = `${'a'.repeat(48)}@example.com`

    render(
      <table>
        <tbody>
          <tr>
            <UserTableRow
              user={{
                ...baseUser,
                firstName: 'Pat',
                lastName: 'Lee',
                email: longEmail,
              }}
            />
          </tr>
        </tbody>
      </table>,
    )

    expect(screen.getByText('Pat Lee')).toHaveAttribute('title', 'Pat Lee')
    expect(screen.getByText(longEmail)).toHaveAttribute('title', longEmail)
  })

  it('calls onRequestEdit with the row user when the edit action is clicked', async () => {
    const user = userEvent.setup()
    const onRequestEdit = jest.fn()

    render(
      <table>
        <tbody>
          <tr>
            <UserTableRow user={baseUser} onRequestEdit={onRequestEdit} />
          </tr>
        </tbody>
      </table>,
    )

    await user.click(screen.getByRole('button', { name: 'Edit Pat Lee' }))

    expect(onRequestEdit).toHaveBeenCalledWith(baseUser)
  })

  it('disables the edit action when isEditDisabled is true', () => {
    render(
      <table>
        <tbody>
          <tr>
            <UserTableRow
              user={{ ...baseUser, deletedAt: '2024-01-01T00:00:00.000Z' }}
              onRequestEdit={jest.fn()}
              isEditDisabled
            />
          </tr>
        </tbody>
      </table>,
    )

    expect(screen.getByRole('button', { name: 'Edit Pat Lee' })).toBeDisabled()
  })
})
