import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const PROTECTED_PATH = /^\/app(?:\/.*)?$/;

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  const res = NextResponse.next({ request: req });

  try {
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isProtectedRoute = PROTECTED_PATH.test(nextUrl.pathname);

    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/login', nextUrl.origin);
      redirectUrl.searchParams.set('redirectTo', nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/app', nextUrl.origin));
    }

    return res;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Auth middleware error', error);
    }
    return res;
  }
}

export const config = {
  matcher: ['/((?!api/stripe-webhook|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
