import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/'];

  // Protected paths that require authentication
  const isProtectedPath = pathname.startsWith('/chats') || pathname.startsWith('/call') || pathname === '/profile';

  // If user is not authenticated and trying to access protected path
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login page
  if (token && pathname === '/login') {
    const chatsUrl = new URL('/chats', request.url);
    return NextResponse.redirect(chatsUrl);
  }

  // Redirect root to login or chats based on auth status
  if (pathname === '/') {
    const redirectUrl = new URL(token ? '/chats' : '/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
