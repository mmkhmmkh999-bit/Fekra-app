import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // لو داخل على /admin بس مش على /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // في المتصفح، هنعتمد على localStorage، فالسيرفر مش هيقدر يتحقق
    // فالحماية الحقيقية جوه كل صفحة
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}