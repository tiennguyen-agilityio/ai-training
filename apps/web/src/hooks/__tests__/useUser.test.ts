import { createElement, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useUpdateUserInfo, usersListQueryKey } from '@/hooks/useUser'
import { updateUserById } from '@/services/user'
import { ServiceError } from '@/utils/query'
import { UserStatus } from '@repo/constants'

jest.mock('@/services/user', () => ({
  ...jest.requireActual('@/services/user'),
  updateUserById: jest.fn(),
}))

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      }),
    },
    children,
  )

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

describe('useUpdateUserInfo', () => {
  it('rejects with a ServiceError that keeps errors[]', async () => {
    jest.mocked(updateUserById).mockResolvedValue({
      ok: false,
      error: 'Invalid',
      errorResponse: {
        statusCode: 400,
        message: 'Bad Request',
        errors: [
          { errCode: 'E', field: 'firstName', message: 'FirstName too short' },
        ],
      },
    } as Awaited<ReturnType<typeof updateUserById>>)
    const { result } = renderHook(() => useUpdateUserInfo(), { wrapper })

    const error = await result.current
      .mutateAsync({ id: 'u-1', payload: { firstName: 'P' } })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ServiceError)
    expect((error as ServiceError).errors[0]?.field).toBe('firstName')
  })
})
