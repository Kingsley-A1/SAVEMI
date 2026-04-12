import { auth } from '../auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API through without a session
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/register' ||
    pathname === '/api/admin/register' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
