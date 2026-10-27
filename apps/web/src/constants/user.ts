import { Mail, UserCheck, UserPlus, Users } from 'lucide-react'

import type { StatCardItem } from '@/components/StatsCards'
import type { TableColumn } from '@/components/Table'
import { UserRole, UserStatus } from '@repo/constants'

export const ROLES_OPTIONS: readonly {
  value: UserRole
  label: string
}[] = [
  { value: UserRole.USER, label: 'User' },
  { value: UserRole.ADMIN, label: 'Admin' },
]

export const STATUS_OPTIONS: readonly {
  value: UserStatus
  label: string
}[] = [
  { value: UserStatus.ACTIVE, label: 'Active' },
  { value: UserStatus.INACTIVE, label: 'Inactive' },
]

export const STATUS_FILTER_OPTIONS: readonly {
  value: string
  label: string
}[] = [{ value: 'all-status', label: 'All statuses' }, ...STATUS_OPTIONS]

export const ROLE_FILTER_OPTIONS = [
  'All Roles',
  ...Object.values(UserRole).map((role) => role.toString()),
] as const

export const USERS_TABLE_COLUMNS: TableColumn[] = [
  {
    key: 'user',
    label: 'User',
    className: 'min-w-0 px-6 py-4',
  },
  { key: 'role', label: 'Role', className: 'w-36 min-w-36 text-center' },
  {
    key: 'status',
    label: 'Status',
    className: 'w-40 min-w-40 text-center',
  },
  {
    key: 'actions',
    label: 'Actions',
    className: 'w-[18%] min-w-0 text-center',
  },
]

export const USERS_DASHBOARD_STATS: StatCardItem[] = [
  {
    id: 'total-users',
    label: 'Total users',
    value: '1,284',
    footnote: '+12% this month',
    footnoteTone: 'success',
    footnoteIcon: UserPlus,
  },
  {
    id: 'active-baristas',
    label: 'Active baristas',
    value: 42,
    footnote: 'Across 8 lab locations',
    footnoteIcon: Users,
  },
  {
    id: 'Admins',
    label: 'Admins',
    value: 12,
    footnote: '2 recently promoted',
    footnoteIcon: UserCheck,
  },
  {
    id: 'pending-invites',
    label: 'Pending invites',
    value: '07',
    footnote: 'Requires approval',
    variant: 'accent',
    icon: UserPlus,
    footnoteIcon: Mail,
  },
]
