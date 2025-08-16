import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protectedRoutes = ['/dashboard', '/territory-map', '/routes', '/knockmap', '/street', '/knockform','/create-team']
  const authRoutes = ['/login', '/select-user-type', '/forgot-password']
  const refreshToken = request.cookies.get('refreshToken')?.value
  const accessToken = request.cookies.get('accessToken')?.value

  console.log('accessToken', accessToken)
  console.log('refreshToken', refreshToken)
  console.log('pathname', pathname)

  // 1. Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!refreshToken) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      response.headers.set('x-clear-auth', 'true')
      return response
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `refreshToken=${refreshToken}` },
       credentials: 'include'
      })

      if (!response.ok) throw new Error('Token refresh failed')

      // If backend sets new cookies, forward them to the client
      const nextResponse = NextResponse.next()
      //const data = await response.json()



      return nextResponse
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('refreshToken')
      response.cookies.delete('accessToken')
      response.headers.set('x-clear-auth', 'true')
      return response
    }
  }

  // 2. Handle auth routes
  if (authRoutes.includes(pathname) && refreshToken) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `refreshToken=${refreshToken}` },
        credentials: 'include'
      })

      if (response.ok) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      const response = NextResponse.next()
      response.cookies.delete('refreshToken')
      response.cookies.delete('accessToken')
      response.headers.set('x-clear-auth', 'true')
      return response
    }
  }

  return NextResponse.next()
}
