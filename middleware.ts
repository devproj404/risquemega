import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root path to /explorer
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/explorer', request.url));
  }

  // For auth pages, don't check session - let them access login/signup
  // The page itself will redirect if they're already logged in
  const authPages = ['/login', '/signup', '/register'];
  if (authPages.includes(pathname)) {
    return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
