import type { UserRole, UserStatus } from '@repo/constants'

export interface User {
  id?: string
  deletedAt?: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  address?: {
    firstName: string | null
    lastName: string | null
    phoneNumber: string | null
    addressLine: string | null
    district: string | null
    ward: string | null
    city: string | null
    postalCode: string | null
    isDefault: boolean | null
  } | null
  name: string | null
  avatarUrl: string | null
  role?: UserRole
  status?: UserStatus
}

export interface ClerkUser extends User {
  fullName: string | null
  imageUrl: string | null
  primaryEmailAddress?: { emailAddress: string } | null
}
