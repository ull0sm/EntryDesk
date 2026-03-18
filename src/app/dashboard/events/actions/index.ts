'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { addDays, format, subMinutes } from 'date-fns'
import { isEventLevel } from '@/lib/events/level'
import { isEventTypeRequiringLevel } from '@/lib/events/type'

type SupabaseActionError = {
  code?: string
  message?: string
  details?: string
}

function isMissingRegistrationCloseDateColumnError(error: SupabaseActionError | null | undefined) {
  if (!error) return false

  const combined = `${error.code || ''} ${error.message || ''} ${error.details || ''}`.toLowerCase()
  return (
    combined.includes('registration_close_date') &&
    (combined.includes('column') || combined.includes('schema cache') || combined.includes('pgrst204'))
  )
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireRole(['organizer', 'admin'])

  const title = (formData.get('title') as string)?.trim()
  const description = formData.get('description') as string
  const event_type = formData.get('event_type') as 'tournament' | 'seminar' | 'test'
  const event_level_raw = (formData.get('event_level') as string | null)?.trim() || ''
  const location = (formData.get('location') as string)?.trim()
  const start_date = formData.get('start_date') as string // YYYY-MM-DD
  const end_date = formData.get('end_date') as string // YYYY-MM-DD
  const registration_close_date_raw = (formData.get('registration_close_date') as string | null)?.trim() || ''
  const registration_close_date = registration_close_date_raw || null
  const is_public = formData.get('is_public') === 'on'
  const requiresEventLevel = isEventTypeRequiringLevel(event_type)

  if (!title || !event_type || !start_date || !end_date) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  if (requiresEventLevel && !event_level_raw) {
    return { success: false, error: 'Please choose an event level for tournaments.' }
  }

  if (event_level_raw && !isEventLevel(event_level_raw)) {
    return { success: false, error: 'Please choose a valid event level.' }
  }

  const event_level = requiresEventLevel ? event_level_raw : null

  if (start_date > end_date) {
    return { success: false, error: 'Event start date must be on or before end date.' }
  }

  if (registration_close_date && registration_close_date > start_date) {
    return { success: false, error: 'Registration close date must be on or before event start date.' }
  }

  const dedupeWindowStart = subMinutes(new Date(), 2).toISOString()
  let duplicateQuery = supabase
    .from('events')
    .select('id')
    .eq('organizer_id', user.id)
    .eq('title', title)
    .eq('event_type', event_type)
    .eq('start_date', start_date)
    .eq('end_date', end_date)
    .gte('created_at', dedupeWindowStart)
    .order('created_at', { ascending: false })
    .limit(1)

  duplicateQuery = event_level
    ? duplicateQuery.eq('event_level', event_level)
    : duplicateQuery.is('event_level', null)

  duplicateQuery = location
    ? duplicateQuery.eq('location', location)
    : duplicateQuery.is('location', null)

  const { data: duplicateEvent, error: duplicateError } = await duplicateQuery.maybeSingle()

  if (duplicateError) {
    console.error(duplicateError)
    return { success: false, error: 'Failed to create event. Please try again.' }
  }

  if (duplicateEvent) {
    revalidatePath('/dashboard/events')
    return { success: true, eventId: duplicateEvent.id, duplicatePrevented: true }
  }

  // Insert Event
  const baseInsertPayload = {
    title,
    description,
    event_type,
    event_level,
    location,
    start_date,
    end_date,
    is_public,
    organizer_id: user.id
  }

  let { data: event, error } = await supabase
    .from('events')
    .insert({
      ...baseInsertPayload,
      registration_close_date,
    })
    .select()
    .single()

  // Backward compatibility: production might still be on an older schema without this column.
  if (error && isMissingRegistrationCloseDateColumnError(error as SupabaseActionError)) {
    const fallbackInsert = await supabase
      .from('events')
      .insert(baseInsertPayload)
      .select()
      .single()

    event = fallbackInsert.data
    error = fallbackInsert.error
  }

  if (error) {
    // Unique constraint can still race under concurrent requests; treat as duplicate.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgCode = (error as any)?.code
    if (pgCode === '23505') {
      let existingEventQuery = supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id)
        .eq('title', title)
        .eq('event_type', event_type)
        .eq('start_date', start_date)
        .eq('end_date', end_date)
        .order('created_at', { ascending: false })
        .limit(1)

      existingEventQuery = event_level
        ? existingEventQuery.eq('event_level', event_level)
        : existingEventQuery.is('event_level', null)

      existingEventQuery = location
        ? existingEventQuery.eq('location', location)
        : existingEventQuery.is('location', null)

      const { data: existingEvent, error: existingEventError } = await existingEventQuery.maybeSingle()
      if (existingEventError) {
        console.error(existingEventError)
        return { success: false, error: 'Failed to create event. Please try again.' }
      }

      if (existingEvent) {
        revalidatePath('/dashboard/events')
        return { success: true, eventId: existingEvent.id, duplicatePrevented: true }
      }
    }

    console.error(error)
    return { success: false, error: 'Failed to create event. Please try again.' }
  }

  // Auto-generate Event Days if multi-day or single day
  if (event && event_type === 'tournament') {
    const start = new Date(start_date)
    const end = new Date(end_date)
    let current = start
    let dayCount = 1

    while (current <= end) {
      await supabase.from('event_days').insert({
        event_id: event.id,
        date: format(current, 'yyyy-MM-dd'),
        name: `Day ${dayCount}`
      })
      current = addDays(current, 1)
      dayCount++
    }
  }

  revalidatePath('/dashboard/events')
  return { success: true, eventId: event.id }
}
