'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { isRegistrationClosed } from '@/lib/events/registration'

async function ensureRegistrationOpenForEvent(supabase: any, eventId: string) {
    const { data: event, error } = await supabase
        .from('events')
        .select('id, end_date, is_registration_open, registration_close_date')
        .eq('id', eventId)
        .single()

    if (error || !event) {
        throw new Error('Event not found')
    }

    if (isRegistrationClosed(event)) {
        throw new Error('Registration is closed for this event')
    }
}

export async function upsertEntry(formData: FormData) {
    const { supabase, user } = await requireRole('coach')

    const event_id = formData.get('event_id') as string
    const student_id = formData.get('student_id') as string
    const category_id = formData.get('category_id') as string
    const event_day_id = formData.get('event_day_id') as string
    const participation_type = formData.get('participation_type') as string

    await ensureRegistrationOpenForEvent(supabase, event_id)

    // Upsert logic: If entry exists for (event_id, student_id), update it.
    // We need to check if one exists first or rely on unique constraint?
    // Schema doesn't enforce one entry per student per event strictly unique index yet, but logic implies it.
    // Let's assume one entry row per student per event.

    const { data: existing } = await supabase
        .from('entries')
        .select('id')
        .eq('event_id', event_id)
        .eq('student_id', student_id)
        .single()

    const payload = {
        event_id,
        coach_id: user.id,
        student_id,
        category_id: category_id || null, // handle 'null' string from selects if any
        event_day_id: event_day_id || null,
        participation_type: participation_type || null,
        status: 'draft' // Always reset to draft if edited? Or keep current status? Usually editing puts back to draft.
    }

    let error;
    if (existing) {
        const res = await supabase.from('entries').update(payload).eq('id', existing.id)
        error = res.error
    } else {
        const res = await supabase.from('entries').insert(payload)
        error = res.error
    }

    if (error) {
        console.error(error)
        throw new Error('Failed to save entry')
    }

    revalidatePath(`/dashboard/entries`)
    revalidatePath(`/dashboard/entries/${event_id}`)
    return { success: true }
}

export async function submitEntries(eventId: string) {
    const { supabase, user } = await requireRole('coach')

    await ensureRegistrationOpenForEvent(supabase, eventId)

    // Update all 'draft' entries for this event and coach to 'submitted'
    const { error } = await supabase
        .from('entries')
        .update({ status: 'submitted' })
        .eq('event_id', eventId)
        .eq('coach_id', user.id)
        .eq('status', 'draft')

    if (error) throw new Error('Failed to submit entries')

    revalidatePath(`/dashboard/entries`)
    revalidatePath(`/dashboard/entries/${eventId}`)
    return { success: true }
}

export async function bulkCreateEntries(eventId: string, entries: { student_id: string, participation_type?: string | null, event_day_id?: string | null }[]) {
    const { supabase, user } = await requireRole('coach')

    await ensureRegistrationOpenForEvent(supabase, eventId)

    if (entries.length === 0) return { success: true }

    const payload = entries.map(e => ({
        event_id: eventId,
        coach_id: user.id,
        student_id: e.student_id,
        participation_type: e.participation_type || null,
        status: 'draft',
        category_id: null,
        event_day_id: e.event_day_id || null
    }))

    const { error } = await supabase.from('entries').insert(payload)
    if (error) {
        console.error(error)
        throw new Error('Failed to create entries')
    }

    revalidatePath(`/dashboard/entries/${eventId}`)
    return { success: true }
}

export async function bulkSubmitEntries(entryIds: string[]) {
    const { supabase, user } = await requireRole('coach')
    if (entryIds.length === 0) return { success: true }

    const { data: scopedEntries, error: scopedEntriesError } = await supabase
        .from('entries')
        .select('event_id')
        .in('id', entryIds)
        .eq('coach_id', user.id)

    if (scopedEntriesError) {
        throw new Error('Failed to validate entries')
    }

    const eventIds = Array.from(new Set((scopedEntries ?? []).map((entry: { event_id: string }) => entry.event_id)))
    for (const eventId of eventIds) {
        await ensureRegistrationOpenForEvent(supabase, eventId)
    }

    // 1. Fetch entries with Student details to Validate
    const { data: entriesToValidate } = await supabase
        .from('entries')
        .select('id, students(name, gender, date_of_birth, rank, weight)')
        .in('id', entryIds)
        .eq('coach_id', user.id)

    if (!entriesToValidate) return { success: false, message: 'No entries found' }

    // 2. Filter Valid Entries
    const validEntryIds: string[] = []
    const invalidEntries: any[] = []

    entriesToValidate.forEach(e => {
        // @ts-ignore
        const s = Array.isArray(e.students) ? e.students[0] : e.students
        // Weight is optional; only core profile fields are required for submission.
        if (s && s.name && s.gender && s.date_of_birth && s.rank) {
            validEntryIds.push(e.id)
        } else {
            invalidEntries.push(e)
        }
    })

    if (validEntryIds.length === 0) {
        // All selected entries were invalid
        console.log("No valid entries to submit. Missing profile details.")
        return { success: false, message: 'All selected entries are missing required profile details (Rank, DOB, Gender, etc).' }
    }

    // 3. Update Valid Entries Only
    const { error } = await supabase
        .from('entries')
        .update({ status: 'submitted' })
        .in('id', validEntryIds)
        .eq('status', 'draft') // Double check we only submit drafts
        .eq('coach_id', user.id)

    if (error) throw new Error('Failed to submit entries')

    revalidatePath(`/dashboard/entries`)

    // Optional: could return details about how many were passed/failed
    return { success: true, submitted: validEntryIds.length, ignored: invalidEntries.length }
}

export async function deleteEntry(entryId: string) {
    const { supabase, user } = await requireRole('coach')

    const { data: entry, error: entryError } = await supabase
        .from('entries')
        .select('event_id')
        .eq('id', entryId)
        .eq('coach_id', user.id)
        .single()

    if (entryError || !entry) {
        throw new Error('Entry not found')
    }

    await ensureRegistrationOpenForEvent(supabase, entry.event_id)

    const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
        .eq('coach_id', user.id)

    if (error) throw new Error('Failed to delete entry')

    revalidatePath('/dashboard/entries')
    return { success: true }
}

export async function bulkDeleteEntries(entryIds: string[]) {
    const { supabase, user } = await requireRole('coach')
    if (entryIds.length === 0) return { success: true }

    const { data: scopedEntries, error: scopedEntriesError } = await supabase
        .from('entries')
        .select('event_id')
        .in('id', entryIds)
        .eq('coach_id', user.id)

    if (scopedEntriesError) {
        throw new Error('Failed to validate entries')
    }

    const eventIds = Array.from(new Set((scopedEntries ?? []).map((entry: { event_id: string }) => entry.event_id)))
    for (const eventId of eventIds) {
        await ensureRegistrationOpenForEvent(supabase, eventId)
    }

    const { error } = await supabase
        .from('entries')
        .delete()
        .in('id', entryIds)
        .eq('coach_id', user.id)

    if (error) throw new Error('Failed to delete entries')

    revalidatePath(`/dashboard/entries`)
    return { success: true }
}

export async function updateEntryGenericChecked(entryId: string, checked: boolean, eventId?: string) {
    const { supabase, user } = await requireRole('coach')

    const { error } = await supabase
        .from('entries')
        .update({ generic_checked: checked })
        .eq('id', entryId)
        .eq('coach_id', user.id)

    if (error) {
        console.error('Failed to update generic checkbox:', error)
        throw new Error('Failed to save checkbox state')
    }

    if (eventId) {
        revalidatePath(`/dashboard/entries/${eventId}`)
    }
    revalidatePath('/dashboard/entries')

    return { success: true }
}

