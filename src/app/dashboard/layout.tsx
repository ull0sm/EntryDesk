import { getUserProfileWithoutAutoCreate } from '@/lib/auth/require-role'
import { ResponsiveDashboardFrame } from '@/components/dashboard/responsive-dashboard-frame'
import { redirect } from 'next/navigation'
import { isUserIdentityVerified } from '@/lib/auth/verification'
import { TermsDialog } from '@/components/terms-dialog'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, role } = await getUserProfileWithoutAutoCreate()

  if (!isUserIdentityVerified(user)) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email ?? '')}`)
  }

  if (!profile) {
    redirect('/onboarding')
  }

  const roleLabel = role === 'organizer' ? 'Organizer' : role === 'admin' ? 'Admin' : 'Coach'

  return (
    <ResponsiveDashboardFrame
      role={role}
      roleLabel={roleLabel}
      profileFullName={profile?.full_name ?? null}
      userEmail={user.email || ''}
    >
      <TermsDialog />
      {children}
    </ResponsiveDashboardFrame>
  )
}
