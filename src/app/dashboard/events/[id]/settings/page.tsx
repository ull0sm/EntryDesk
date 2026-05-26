import { requireRole } from '@/lib/auth/require-role'
import { notFound } from 'next/navigation'
import { EventSettingsForm } from '@/components/events/event-settings-form'

export default async function EventSettingsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const { supabase, user, role } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })

    const { data: event } = await supabase
        .from('events')
        .select('id, title, location, event_type, event_level, is_registration_open, is_public, organizer_id, temporary_registration_closes_at')
        .eq('id', id)
        .single()

    // Count only entries that should block deletion: approved or with assigned chest numbers
    const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('id, status, chest_no')
        .eq('event_id', id)

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const entryCount = (entries ?? []).filter((e: any) => e.status === 'approved' || e.chest_no !== null).length

    if (!event) notFound()

    if (role !== 'admin' && event.organizer_id !== user.id) {
        notFound() // Or redirect to unauthorized
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Event Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your event configurations, registration status, and danger zone actions.</p>
            </div>

            <EventSettingsForm event={event} entryCount={entryCount ?? 0} />
        </div>
    )
}
