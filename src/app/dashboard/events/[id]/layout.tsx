import { requireRole } from '@/lib/auth/require-role'
import { notFound } from 'next/navigation'
import { formatEventLevelLabel } from '@/lib/events/level'

export default async function EventLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    // Await params before using its properties
    const { id } = await params
    const { supabase, user, role } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })

    let eventQuery = supabase
        .from('events')
        .select('*')
        .eq('id', id)

    const { data: event } = await eventQuery.single()

    if (!event) notFound()

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
                    <div className="flex text-sm text-muted-foreground gap-4">
                        <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        <span className="capitalize">{event.event_type}</span>
                        {event.event_level ? <span>{formatEventLevelLabel(event.event_level)}</span> : null}
                    </div>
                </div>
            </div>

            {children}
        </div>
    )
}
