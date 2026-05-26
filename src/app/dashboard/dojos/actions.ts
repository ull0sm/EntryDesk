'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'

export async function createDojo(formData: FormData) {
  const { supabase, user } = await requireRole('coach')

  const nameValue = formData.get('name')
  const name = typeof nameValue === 'string' ? nameValue.trim() : ''

  if (!name) {
    throw new Error('Dojo name is required')
  }

  const { error } = await supabase
    .from('dojos')
    .insert({
      name,
      coach_id: user.id
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}

export async function updateDojo(dojoId: string, formData: FormData) {
  const { supabase, user } = await requireRole('coach')

  const nameValue = formData.get('name')
  const name = typeof nameValue === 'string' ? nameValue.trim() : ''

  if (!name) {
    throw new Error('Dojo name is required')
  }

  const { error } = await supabase
    .from('dojos')
    .update({ name })
    .eq('id', dojoId)
    .eq('coach_id', user.id) // Security check

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}

export async function deleteDojo(dojoId: string) {
  const { supabase, user } = await requireRole('coach')

  const { count: studentCount, error: studentCountError } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('dojo_id', dojoId)

  if (studentCountError) {
    throw new Error(studentCountError.message)
  }

  if ((studentCount ?? 0) > 0) {
    throw new Error('This dojo still has students. Remove or reassign them before deleting the dojo.')
  }

  const { error } = await supabase
    .from('dojos')
    .delete()
    .eq('id', dojoId)
    .eq('coach_id', user.id) // Security check

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/dojos')
  return { success: true }
}
