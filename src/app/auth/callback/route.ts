import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check user role to redirect appropriately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'PENGURUS') {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/warga', request.url));
        }
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
}
