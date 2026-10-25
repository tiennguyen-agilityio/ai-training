import { usersListQueryKey } from '@/hooks/useUser'
import { USER_STATUS } from '@/types/user'

describe('usersListQueryKey', () => {
  it('separates lists by status', () => {
    const all = usersListQueryKey({ page: 1 })
    const active = usersListQueryKey({ page: 1, status: USER_STATUS.ACTIVE })
    const inactive = usersListQueryKey({
      page: 1,
      status: USER_STATUS.INACTIVE,
    })

    expect(active).not.toEqual(inactive)
    expect(all).not.toEqual(active)
    expect(all).not.toEqual(inactive)
  })
})
