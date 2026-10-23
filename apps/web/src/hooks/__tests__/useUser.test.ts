import { usersListQueryKey } from '@/hooks/useUser'

describe('usersListQueryKey', () => {
  it('usersListQueryKey separates lists by status', () => {
    expect(usersListQueryKey({ page: 1, status: 'ACTIVE' })).not.toEqual(
      usersListQueryKey({ page: 1, status: 'INACTIVE' }),
    )
    expect(usersListQueryKey({ page: 1 }).at(-1)).toBe('')
  })
})
