'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'

export async function addDojoCollaborator(dojoId: string, email: string, permission: 'read' | 'write') {
  const { supabase, user } = await requireRole('coach')

  // Verify the current user is the owner of the dojo
  const { data: dojo, error: dojoError } = await supabase
    .from('dojos')
    .select('id')
    .eq('id', dojoId)
    .eq('coach_id', user.id)
    .single()

  if (dojoError || !dojo) {
    throw new Error('You do not have permission to share this dojo.')
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
    .from('dojo_collaborators')
    .upsert({
      dojo_id: dojoId,
      user_id: profile.id,
      permission
    }, { onConflict: 'dojo_id,user_id' })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}

export async function removeDojoCollaborator(dojoId: string, collaboratorUserId: string) {
  const { supabase, user } = await requireRole('coach')

  // Verify the current user is the owner of the dojo
  const { data: dojo, error: dojoError } = await supabase
    .from('dojos')
    .select('id')
    .eq('id', dojoId)
    .eq('coach_id', user.id)
    .single()

  if (dojoError || !dojo) {
    throw new Error('You do not have permission to manage this dojo.')
  }

  const { error } = await supabase
    .from('dojo_collaborators')
    .delete()
    .eq('dojo_id', dojoId)
    .eq('user_id', collaboratorUserId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}

export async function updateDojoCollaborator(dojoId: string, collaboratorUserId: string, permission: 'read' | 'write') {
  const { supabase, user } = await requireRole('coach')

  // Verify the current user is the owner of the dojo
  const { data: dojo, error: dojoError } = await supabase
    .from('dojos')
    .select('id')
    .eq('id', dojoId)
    .eq('coach_id', user.id)
    .single()

  if (dojoError || !dojo) {
    throw new Error('You do not have permission to manage this dojo.')
  }

  const { error } = await supabase
    .from('dojo_collaborators')
    .update({ permission })
    .eq('dojo_id', dojoId)
    .eq('user_id', collaboratorUserId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}
