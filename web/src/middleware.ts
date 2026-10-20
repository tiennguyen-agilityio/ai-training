import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { ROLES } from '@/constants/user'
import { ROUTES } from '@/constants/routes'
import { DASHBOARD_MENU } from '@/constants/nav'
import { getSessionPublicRole } from '@/utils/session'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
const isProfileRoute = createRouteMatcher([`${ROUTES.USER_PROFILE}(.*)`])
const isCheckoutRoute = createRouteMatcher([`${ROUTES.CHECKOUT}(.*)`])

const disabledDashboardHrefs = DASHBOARD_MENU.filter(
  (item) => item.disabled,
).map((item) => `${item.href}(.*)`)
const isDisabledDashboardRoute = createRouteMatcher(disabledDashboardHrefs)

export default clerkMiddleware(async (auth, request) => {
  if (isProfileRoute(request) || isCheckoutRoute(request)) {
    await auth.protect()
    return NextResponse.next()
  }

  if (!isDashboardRoute(request)) {
    return
  }

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    await auth.protect()
    return
  }

  const role = getSessionPublicRole(sessionClaims)
  if (role !== ROLES.ADMIN) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url))
  }

  if (isDisabledDashboardRoute(request)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile',
    '/profile/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
}
