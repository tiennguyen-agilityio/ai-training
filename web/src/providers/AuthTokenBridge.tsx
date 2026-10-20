'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'

import { CLERK_SESSION_TEMPLATE } from '@/constants/common'
import { setDefaultTokenGetter } from '@/services/api'

/**
 * Registers the Clerk `getToken` accessor as apiClient's fallback token
 * source, so hooks/services that forget to pass `getToken` explicitly still
 * send an Authorization header instead of silently going unauthenticated.
 */
export const AuthTokenBridge = () => {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn) {
      setDefaultTokenGetter(null)
      return
    }

    setDefaultTokenGetter(() => getToken({ template: CLERK_SESSION_TEMPLATE }))

    return () => setDefaultTokenGetter(null)
  }, [getToken, isSignedIn])

  return null
}
