import { requireRole } from '@/lib/auth/require-role'
import { notFound } from 'next/navigation'
import { EventSettingsForm } from '@/components/events/event-settings-form'
import { EventSharingSection } from '@/components/events/event-sharing-section'

export default async function EventSettingsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const { supabase, user, role } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })

    const { data: event } = await supabase
        .from('events')
        .select(`
            id, title, location, event_type, event_level, is_registration_open, is_public, organizer_id, temporary_registration_closes_at,
            event_collaborators (
                user_id,
                permission,
                profiles (
                    email,
                    full_name
                )
            )
        `)
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

    const isOwner = event.organizer_id === user.id
    const collaborators = event.event_collaborators || []

    if (role !== 'admin' && !isOwner) {
        // Find if user is a collaborator with write access
        const myCollaboration = collaborators.find((c: any) => c.user_id === user.id)
        if (!myCollaboration || myCollaboration.permission !== 'write') {
            notFound() // Or redirect to unauthorized
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Event Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your event configurations, registration status, and danger zone actions.</p>
            </div>

            <EventSettingsForm event={event} entryCount={entryCount ?? 0} />

            {isOwner && (
                <div className="pt-6">
                    <EventSharingSection event={event} collaborators={collaborators as any} />
                </div>
            )}
        </div>
    )
}

