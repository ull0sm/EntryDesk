'use server'

import { requireRole } from '@/lib/auth/require-role'
import { redirect } from 'next/navigation'
import { isEventLevel, type EventLevel } from '@/lib/events/level'
import { isEventTypeRequiringLevel } from '@/lib/events/type'

export async function deleteEvent(formData: FormData) {
    const eventIdValue = formData.get('eventId')
    const eventId = typeof eventIdValue === 'string' ? eventIdValue : ''

    if (!eventId) {
        throw new Error('Missing eventId')
    }

    const { supabase, user } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })

    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('id', eventId)
        .single()

    if (eventError || !event) {
        throw new Error('Event not found')
    }

    if (event.organizer_id !== user.id) {
        throw new Error('Not authorized to delete this event')
    }

    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId)

    if (deleteError) {
        throw new Error(deleteError.message)
    }

    redirect('/dashboard/events')
}

export async function updateEventSettings(eventId: string, data: { title?: string; location?: string; event_level?: EventLevel | null; is_registration_open?: boolean; is_public?: boolean; temporary_registration_closes_at?: string | null }) {
    if (!eventId) throw new Error('Missing eventId')

    if (typeof data.event_level === 'string' && !isEventLevel(data.event_level)) {
        throw new Error('Invalid event level')
    }

    const { supabase, user } = await requireRole(['organizer', 'admin'])

    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id, event_type')
        .eq('id', eventId)
        .single()

    if (eventError || !event) throw new Error('Event not found')

    if (event.organizer_id !== user.id) {
        throw new Error('Not authorized to edit this event')
    }

    const updateData = { ...data }
    if (!isEventTypeRequiringLevel(event.event_type)) {
        updateData.event_level = null
    }

    const { error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)

    if (updateError) throw new Error(updateError.message)

    return { success: true }
}
