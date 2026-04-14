import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PendingCoachesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['organizer', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: pendingCoaches } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('role', 'coach')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })

  return (
        <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending Coach Approvals</h1>

      {pendingCoaches?.map((coach) => (
        <div key={coach.id} className="rounded-lg border p-4">
          <p>{coach.full_name}</p>
          <p>{coach.email}</p>
        </div>
      ))}
    </div>
  )
}