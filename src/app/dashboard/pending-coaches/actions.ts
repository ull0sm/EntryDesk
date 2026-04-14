'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveCoach(coachId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['organizer', 'admin'].includes(profile.role)) {
    return
  }

  await supabase
    .from('profiles')
    .update({ approval_status: 'approved' })
    .eq('id', coachId)

  revalidatePath('/dashboard/pending-coaches')
}

export async function rejectCoach(coachId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['organizer', 'admin'].includes(profile.role)) {
    return
  }

  await supabase
    .from('profiles')
    .update({   
      approval_status: 'rejected',
      rejection_reason: 'Unverified coach request',
    })
    .eq('id', coachId)

  revalidatePath('/dashboard/pending-coaches')
}   