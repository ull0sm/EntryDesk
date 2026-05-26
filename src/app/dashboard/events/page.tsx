import { requireRole } from '@/lib/auth/require-role'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardPageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, ArrowRight, Globe, Lock, Share2 } from 'lucide-react'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { RegistrationDeadline } from '@/components/events/registration-deadline'
import { formatEventLevelLabel } from '@/lib/events/level'

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const { supabase, user } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const limit = 50
  const offset = (page - 1) * limit

  const { data: events, count } = await supabase
    .from('events')
    .select(`
      *,
      event_collaborators (
        user_id,
        permission
      )
    `, { count: 'exact' })
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1)

  const today = new Date().toISOString().slice(0, 10)
  
  const allEvents = events ?? []
  const activeEvents = allEvents.filter((event) => event.end_date >= today)
  const pastEvents = allEvents.filter((event) => event.end_date < today)
  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Events"
        description="Create, publish, and manage your events."
        actions={<CreateEventDialog />}
      />

      {!events ? (
        <div className="dashboard-empty py-8 text-center text-destructive">
          <Calendar className="mx-auto mb-2 h-6 w-6 opacity-50" />
          <p className="text-sm font-medium">Failed to load Events</p>
          <p className="mt-1 text-xs opacity-80 max-w-md mx-auto">
              Please make sure you have applied the database migrations (`supabase db push`) so the new collaboration tables exist.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Active Events
            </h2>
            <div className="dashboard-surface p-2 sm:p-3">
            {activeEvents.length > 0 ? (
            <div className="dashboard-list space-y-2">
              {activeEvents.map(event => {
                const isOwner = event.organizer_id === user.id
                const myCollaboration = !isOwner ? (event.event_collaborators || []).find((c: any) => c.user_id === user.id) : null
                const permissionLabel = myCollaboration?.permission === 'write' ? 'Read & Write' : 'Read Only'
                
                return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="dashboard-list-item group flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-3.5 shadow-md shadow-black/5 transition-all hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 dark:border-white/10 dark:shadow-black/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                            {event.title}
                            {!isOwner && (
                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-sm font-medium">Shared</span>
                            )}
                        </span>
                        <Badge className="capitalize text-[10px] px-1.5 py-0" variant="secondary">{event.event_type}</Badge>
                        {event.event_level ? (
                          <Badge className="text-[10px] px-1.5 py-0" variant="outline">{formatEventLevelLabel(event.event_level)}</Badge>
                        ) : null}
                        {event.is_public ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-500">
                            <Globe className="h-2.5 w-2.5" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Lock className="h-2.5 w-2.5" /> Private
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {event.location}
                            </span>
                          </>
                        )}
                        {isOwner && event.event_collaborators && event.event_collaborators.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-primary">
                              <Share2 className="h-2.5 w-2.5" />
                              {event.event_collaborators.length} shared
                            </span>
                          </>
                        )}
                        {!isOwner && (
                            <>
                                <span>•</span>
                                <span>{permissionLabel}</span>
                            </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-full px-3 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                      Manage
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No active events</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a new event to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Past Events</h2>
        </div>
        <div className="dashboard-surface p-2 sm:p-3">
          {pastEvents.length > 0 ? (
            <div className="dashboard-list space-y-2">
              {pastEvents.map(event => {
                const isOwner = event.organizer_id === user.id
                const myCollaboration = !isOwner ? (event.event_collaborators || []).find((c: any) => c.user_id === user.id) : null
                const permissionLabel = myCollaboration?.permission === 'write' ? 'Read & Write' : 'Read Only'
                
                return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="dashboard-list-item group flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-3.5 shadow-md shadow-black/5 transition-all hover:-translate-y-0.5 hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 dark:border-white/10 dark:shadow-black/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                            {event.title}
                            {!isOwner && (
                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-sm font-medium">Shared</span>
                            )}
                        </span>
                        <Badge className="capitalize text-[10px] px-1.5 py-0" variant="secondary">{event.event_type}</Badge>
                        {event.event_level ? (
                          <Badge className="text-[10px] px-1.5 py-0" variant="outline">{formatEventLevelLabel(event.event_level)}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {event.location}
                            </span>
                          </>
                        )}
                        {!isOwner && (
                            <>
                                <span>•</span>
                                <span>{permissionLabel}</span>
                            </>
                        )}
                      </div>
                      <RegistrationDeadline
                        className="mt-1"
                        event={event}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-full px-3 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                      View
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No past events</p>
              <p className="mt-1 text-xs text-muted-foreground">Completed events will show up here.</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      <PaginationControls page={page} totalPages={totalPages} totalCount={count ?? 0} />
    </div>
  )
}

