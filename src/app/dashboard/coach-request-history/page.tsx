import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CoachRequestHistoryPage() {
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

  const { data: requests } = await supabase
    .from('profiles')
    .select('id, full_name, email, approval_status, rejection_reason, created_at')
    .in('approval_status', ['approved', 'rejected', 'pending'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Coach Request History</h1>

      {requests?.map((coach) => (
        <div key={coach.id} className="rounded-lg border p-4">
          <p className="font-semibold">{coach.full_name}</p>
          <p>{coach.email}</p>
          <p>Status: {coach.approval_status}</p>

          {coach.rejection_reason && (
            <p>Reason: {coach.rejection_reason}</p>
          )}

          <p className="text-sm text-gray-500">
            Requested on: {new Date(coach.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}