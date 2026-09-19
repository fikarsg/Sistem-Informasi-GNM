import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public paths that do not require auth
  const isAuthRoute = path === '/login' || path === '/auth/callback';
  const isPublicAsset = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.');

  if (isPublicAsset) {
    return response;
  }

  // Not logged in -> Protect private routes
  if (!user) {
    if (path.startsWith('/admin') || path.startsWith('/warga')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // User is logged in -> Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // If visiting login while already logged in
  if (isAuthRoute) {
    if (role === 'PENGURUS') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/warga', request.url));
    }
  }

  // Role based enforcement (PRD 5.1 & 5.2)
  if (path.startsWith('/admin') && role !== 'PENGURUS') {
    // Warga trying to access admin -> redirect to warga dashboard
    return NextResponse.redirect(new URL('/warga', request.url));
  }

  if (path.startsWith('/warga') && role === 'PENGURUS') {
    // Pengurus trying to access warga view -> redirect to admin
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}
