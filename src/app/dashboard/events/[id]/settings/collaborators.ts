'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'

export async function addEventCollaborator(eventId: string, email: string, permission: 'read' | 'write') {
  const { supabase, user } = await requireRole('organizer')

  // Verify the current user is the owner of the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (eventError || !event) {
    throw new Error('You do not have permission to share this event.')
  }

  // Find the user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('User not found. Please ensure they have signed up first.')
  }

  if (profile.id === user.id) {
    throw new Error('You cannot add yourself as a collaborator.')
  }

  // Insert or update collaborator
  const { error: upsertError } = await supabase
    .from('event_collaborators')
    .upsert({
      event_id: eventId,
      user_id: profile.id,
      permission
    }, { onConflict: 'event_id,user_id' })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  revalidatePath(`/dashboard/events/${eventId}/settings`)
  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function removeEventCollaborator(eventId: string, collaboratorUserId: string) {
  const { supabase, user } = await requireRole('organizer')

  // Verify the current user is the owner of the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (eventError || !event) {
    throw new Error('You do not have permission to manage this event.')
  }

  const { error } = await supabase
    .from('event_collaborators')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', collaboratorUserId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/events/${eventId}/settings`)
  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function updateEventCollaborator(eventId: string, collaboratorUserId: string, permission: 'read' | 'write') {
  const { supabase, user } = await requireRole('organizer')

  // Verify the current user is the owner of the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (eventError || !event) {
    throw new Error('You do not have permission to manage this event.')
  }

  const { error } = await supabase
    .from('event_collaborators')
    .update({ permission })
    .eq('event_id', eventId)
    .eq('user_id', collaboratorUserId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/events/${eventId}/settings`)
  revalidatePath('/dashboard/events')
  return { success: true }
}
