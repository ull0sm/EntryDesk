import { requireRole } from '@/lib/auth/require-role'
import { CoachDashboard } from '@/components/coach/coach-dashboard'
import { notFound } from 'next/navigation'
import { isRegistrationClosed } from '@/lib/events/registration'

export default async function EventEntriesPage({ params }: { params: { eventId: string } }) {
  const { eventId } = await params
  const { supabase, user } = await requireRole('coach', { redirectTo: '/dashboard' })

  // Fetch Event Details
  const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (!event) notFound()

  // Verify access
  const { data: app } = await supabase
    .from('event_applications')
    .select('status')
    .eq('event_id', eventId)
    .eq('coach_id', user.id)
    .single()

  if (!app || app.status !== 'approved') {
    return <div className="p-8 text-center text-red-600">Access Denied. You are not approved for this event.</div>
  }

  // Fetch ALL students for this coach (via Dojos)
  // RLS ensures we only get students for dojos we own or collaborate on.
  const { data: students } = await supabase
    .from('students')
    .select('*, dojos!inner(id, name, coach_id)')
    .order('name')

  // Fetch Entries
  const { data: entries } = await supabase
    .from('entries')
    .select(`
        *,
        students(id, name, gender, rank, weight, date_of_birth, dojo_id, registration_no),
        event_days(name)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  // Fetch Event Days for Registration
  const { data: eventDays } = await supabase
    .from('event_days')
    .select('*')
    .eq('event_id', eventId)
    .order('date', { ascending: true })

  // Fetch Dojos for Edit Form
  const { data: dojos } = await supabase
    .from('dojos')
    .select('id, name, coach_id')

  // Compute Stats
  const validEntries = entries || []
  const isEntryLocked = isRegistrationClosed(event)
  const stats = {
    total: validEntries.length,
    draft: validEntries.filter(e => e.status === 'draft').length,
    submitted: validEntries.filter(e => e.status === 'submitted').length,
    approved: validEntries.filter(e => e.status === 'approved').length
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const isPast = event.end_date ? event.end_date < todayIso : false

  return (
    <CoachDashboard
      event={event}
      eventType={event.event_type}
      stats={stats}
      entries={validEntries}
      students={students || []}
      eventDays={eventDays || []}
      dojos={dojos || []}
      isPastEvent={isPast}
      isRegistrationClosed={isEntryLocked}
    />
  )
}
