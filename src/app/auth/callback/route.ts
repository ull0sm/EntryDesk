import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deriveFullName } from '@/lib/auth/profile'
import { isUserIdentityVerified } from '@/lib/auth/verification'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          const provider = user.app_metadata?.provider

          if (provider === 'email' && isUserIdentityVerified(user) && user.email) {
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                role: 'coach',
                approval_status: 'pending',
                full_name: deriveFullName(user),
              })

            if (!createProfileError) {
              return NextResponse.redirect(`${origin}${next}`)
            }
          }

          const onboardingUrl = new URL('/onboarding', origin)
          if (next) {
            onboardingUrl.searchParams.set('next', next)
          }
          return NextResponse.redirect(onboardingUrl)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
