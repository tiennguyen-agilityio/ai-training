import { usersListQueryKey } from '@/hooks/useUser'
import { UserStatus } from '@repo/constants'

describe('usersListQueryKey', () => {
  it('separates lists by status', () => {
    const all = usersListQueryKey({ page: 1 })
    const active = usersListQueryKey({ page: 1, status: UserStatus.ACTIVE })
    const inactive = usersListQueryKey({
      page: 1,
      status: UserStatus.INACTIVE,
    })

    expect(active).not.toEqual(inactive)
    expect(all).not.toEqual(active)
    expect(all).not.toEqual(inactive)
  })
})
