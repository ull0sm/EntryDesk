import { getUserProfile } from '@/lib/auth/require-role'
import { DashboardPageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Calendar, Users, ClipboardList, LayoutGrid, CheckSquare, FolderOpen, ListTodo, MapPin, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CoachActiveEventsCards } from '@/components/dashboard/coach-active-events-cards'
import { formatDateRangeStable } from '@/lib/date'
import { RegistrationDeadline } from '@/components/events/registration-deadline'
import { formatEventLevelLabel } from '@/lib/events/level'

type PublicEvent = {
    id: string
    title: string
    start_date: string
    end_date: string
    location: string | null
    event_type: string | null
    event_level?: string | null
    description?: string | null
    registration_close_date?: string | null
    is_registration_open?: boolean | null
    temporary_registration_closes_at?: string | null
}

type ApprovedEvent = {
    id: string
    title: string
    start_date: string
    end_date: string
    location: string | null
    event_type: string | null
    event_level?: string | null
    registration_close_date?: string | null
    is_registration_open?: boolean | null
    temporary_registration_closes_at?: string | null
}

type ApprovedApplication = {
    event_id: string
    status: string
    events: ApprovedEvent[] | null
}

type OrganizerEvent = {
    id: string
    title: string
    start_date: string
    end_date: string
    location: string | null
    event_type: string | null
    event_level?: string | null
    registration_close_date?: string | null
    is_registration_open?: boolean | null
    temporary_registration_closes_at?: string | null
    organizer_id: string
}

export default async function DashboardPage() {
    const { supabase, user, profile, role } = await getUserProfile()

    const name = profile?.full_name || user.email
    const isOrganizer = role === 'organizer'

    const today = new Date().toISOString().slice(0, 10)

    let eventsCount = 0
    let pendingApprovalsCount = 0
    let dojosCount = 0
    let studentsCount = 0
    let entriesCount = 0
    let organizerActiveEvents: OrganizerEvent[] = []
    let publicEvents: PublicEvent[] = []
    let applications: Array<{ event_id: string; status: string }> = []
    let approvedApplications: ApprovedApplication[] = []

    if (isOrganizer) {
        const { data: organizerEventIds } = await supabase
            .from('events')
            .select('id')

        const myEventIds = (organizerEventIds ?? []).map((e) => e.id)
        eventsCount = myEventIds.length

        const { data: activeOrganizerEvents } = await supabase
            .from('events')
            .select('id, title, start_date, end_date, location, event_type, event_level, registration_close_date, is_registration_open, temporary_registration_closes_at, organizer_id')
            .gte('end_date', today)
            .order('start_date', { ascending: true })

        organizerActiveEvents = (activeOrganizerEvents ?? []) as OrganizerEvent[]

        if (myEventIds.length) {
            const [{ count: pendingCount }] = await Promise.all([
                supabase
                    .from('event_applications')
                    .select('id', { count: 'exact', head: true })
                    .in('event_id', myEventIds)
                    .eq('status', 'pending'),
            ])
            pendingApprovalsCount = pendingCount ?? 0
        }
    } else {
        const { data: dojoIds } = await supabase
            .from('dojos')
            .select('id')

        const myDojoIds = (dojoIds ?? []).map((d) => d.id)
        dojosCount = myDojoIds.length

        type CountResult = { count: number | null }
        const noCount: CountResult = { count: 0 }

        const [entriesRes, publicEventsRes, applicationsRes, approvedAppsRes, studentsRes] = await Promise.all([
            supabase
                .from('entries')
                .select('id, events!inner(end_date)', { count: 'exact', head: true })
                .eq('coach_id', user.id)
                .gte('events.end_date', today),
            supabase
                .from('events')
                .select('id, title, start_date, end_date, location, event_type, event_level, description, is_public, registration_close_date, is_registration_open, temporary_registration_closes_at')
                .order('start_date', { ascending: true }),
            supabase
                .from('event_applications')
                .select('event_id, status')
                .eq('coach_id', user.id),
            supabase
                .from('event_applications')
                .select(`
                    event_id,
                    status,
                    events (
                        id,
                        title,
                        start_date,
                        end_date,
                        location,
                        event_type,
                        event_level,
                        registration_close_date,
                        is_registration_open,
                        temporary_registration_closes_at
                    )
                `)
                .eq('coach_id', user.id)
                .eq('status', 'approved'),
            myDojoIds.length
                ? supabase
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .in('dojo_id', myDojoIds)
                : Promise.resolve(noCount),
        ])

        entriesCount = entriesRes.count ?? 0
        publicEvents = ((publicEventsRes.data ?? []) as PublicEvent[])
        applications = ((applicationsRes.data ?? []) as Array<{ event_id: string; status: string }>)
        approvedApplications = ((approvedAppsRes.data ?? []) as ApprovedApplication[])
        studentsCount = (studentsRes as CountResult).count ?? 0
    }

    const approvedEvents = (approvedApplications ?? [])
        .flatMap((app) => app.events || [])
        .filter((event): event is ApprovedEvent => !!event && event.end_date >= today)

    const activePublicEvents = (publicEvents ?? [])
        .filter((event) => event.end_date >= today)

    const statusByEventId = Object.fromEntries(applications.map((app) => [app.event_id, app.status])) as Record<string, string>

    return (
        <div className="space-y-8">
            <DashboardPageHeader
                title={`Welcome, ${name?.split(' ')[0] ?? 'User'}`}
                description={isOrganizer ? 'Manage events, approvals, and exports.' : 'Manage your dojos, students, and entries.'}
                actions={
                    isOrganizer ? (
                        <Link href="/dashboard/events">
                            <Button size="sm" className="shadow-lg shadow-primary/20 rounded-full">Manage Events</Button>
                        </Link>
                    ) : (
                        null
                    )
                }
            />

            {/* Bento Grid Metrics */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
                {isOrganizer ? (
                    <>
                        {/* Events Tile */}
                        <Link
                            href="/dashboard/events"
                            className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-b from-background/95 to-background/60 p-5 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.25)] transition-all hover:bg-background/80 hover:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.30)] hover:-translate-y-1 dark:border-white/10 dark:bg-background/40 dark:from-background/60 dark:to-background/30 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Events</span>
                                </div>
                                <div className="text-3xl font-bold tabular-nums text-foreground">{eventsCount ?? 0}</div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Active tournaments</div>
                            </div>
                        </Link>

                        {/* Pending Approvals Tile */}
                        <Link
                            href="/dashboard/approvals"
                            className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-b from-background/95 to-background/60 p-5 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.25)] transition-all hover:bg-background/80 hover:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.30)] hover:-translate-y-1 dark:border-white/10 dark:bg-background/40 dark:from-background/60 dark:to-background/30 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CheckSquare className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <CheckSquare className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Approvals</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tabular-nums text-foreground">{pendingApprovalsCount ?? 0}</span>
                                    {(pendingApprovalsCount ?? 0) > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/20">
                                            Pending
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Coach applications</div>
                            </div>
                        </Link>

                        {/* Quick Actions - spans 2 cols */}
                        <div className="group relative col-span-1 overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-b from-background/95 to-background/60 p-4 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.25)] sm:col-span-2 dark:border-white/10 dark:bg-background/40 dark:from-background/60 dark:to-background/30 dark:shadow-black/40">
                            <div className="mb-3 flex items-center gap-2.5 text-muted-foreground">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    <ListTodo className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider">Quick Actions</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Link href="/dashboard/events" className="h-full">
                                    <div className="dashboard-list-item flex h-[92px] items-center gap-3 rounded-xl bg-background/30 p-3.5 transition-colors hover:bg-background/50 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">Create Event</div>
                                            <div className="text-xs text-muted-foreground leading-tight">Start a new tournament</div>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/dashboard/approvals" className="h-full">
                                    <div className="dashboard-list-item flex h-[92px] items-center gap-3 rounded-xl bg-background/30 p-3.5 transition-colors hover:bg-background/50 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                                            <CheckSquare className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">Review Queue</div>
                                            <div className="text-xs text-muted-foreground leading-tight">Process applications</div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Dojos Tile */}
                        <Link
                            href="/dashboard/dojos"
                            className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-6 shadow-md shadow-black/5 transition-all hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 dark:border-white/10 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <LayoutGrid className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <LayoutGrid className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Dojos</span>
                                </div>
                                <div className="text-3xl font-bold tabular-nums text-foreground">{dojosCount ?? 0}</div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Managed dojos</div>
                            </div>
                        </Link>

                        {/* Students Tile */}
                        <Link
                            href="/dashboard/students"
                            className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-6 shadow-md shadow-black/5 transition-all hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 dark:border-white/10 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
                                </div>
                                <div className="text-3xl font-bold tabular-nums text-foreground">{studentsCount ?? 0}</div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Total Athletes</div>
                            </div>
                        </Link>

                        {/* Entries Tile */}
                        <Link
                            href="/dashboard/entries"
                            className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-6 shadow-md shadow-black/5 transition-all hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 dark:border-white/10 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ClipboardList className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Entries</span>
                                </div>
                                <div className="text-3xl font-bold tabular-nums text-foreground">{entriesCount ?? 0}</div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Tournament entries</div>
                            </div>
                        </Link>

                        {/* Browse Events Tile (Now just a consistent tile, maybe keep it or merge intent later, but user said remove separate section)
                            User said "remove browse events separate section and add it in the home itself"
                            The tile was there, but the section below is what they want. 
                            I'll keep this tile as a stats summary maybe? Or remove it since the full list is below?
                            "add it down these ui elements as browse events"
                            I think keeping the tile is fine as a quick link, but the full list is requested below.
                        */}
                        <Link
                            href="/dashboard/events-browser"
                            className="group relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 p-6 shadow-md shadow-black/5 transition-all hover:bg-background/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 dark:border-white/10 dark:shadow-black/40"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FolderOpen className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                        <FolderOpen className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Public Events</span>
                                </div>
                                <div className="text-3xl font-bold tabular-nums text-foreground">{activePublicEvents?.length ?? 0}</div>
                                <div className="mt-1 text-xs text-muted-foreground font-medium">Available now</div>
                            </div>
                        </Link>
                    </>
                )}
            </div>

            {isOrganizer && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-tight">Your Active Events</h2>
                        </div>
                    </div>

                    <div className="dashboard-surface">
                        {organizerActiveEvents.length > 0 ? (
                            <div className="dashboard-list">
                                {organizerActiveEvents.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/dashboard/events/${event.id}`}
                                        className="dashboard-list-item block p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-medium flex items-center gap-2">
                                                        {event.title}
                                                        {event.organizer_id !== user.id && (
                                                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-sm font-medium">Shared</span>
                                                        )}
                                                    </span>
                                                    {event.event_type ? (
                                                        <Badge className="px-1.5 py-0 text-[10px] capitalize" variant="secondary">
                                                            {event.event_type}
                                                        </Badge>
                                                    ) : null}
                                                        {event.event_level ? (
                                                            <Badge className="px-1.5 py-0 text-[10px]" variant="outline">
                                                                {formatEventLevelLabel(event.event_level)}
                                                            </Badge>
                                                        ) : null}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <span>{formatDateRangeStable(event.start_date, event.end_date)}</span>
                                                    {event.location ? (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-0.5">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                {event.location}
                                                            </span>
                                                        </>
                                                    ) : null}
                                                </div>
                                                <RegistrationDeadline
                                                    className="mt-1"
                                                    event={event}
                                                />
                                            </div>
                                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                                <p className="text-sm font-medium">No active events</p>
                                <p className="mt-1 text-xs text-muted-foreground">Create an event to see it here.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Coach: Approved + Active Events (home) */}
            {!isOrganizer && (
                <div className="pt-4 space-y-8">
                    <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Approved Events</h2>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                <Link href="/dashboard/entries">View Entries</Link>
                            </Button>
                        </div>

                        <div className="dashboard-surface">
                            {approvedEvents.length > 0 ? (
                                <div className="dashboard-list">
                                    {approvedEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/dashboard/entries/${event.id}`}
                                            className="dashboard-list-item group flex items-center justify-between gap-4 p-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate">{event.title}</span>
                                                        <Badge className="capitalize text-[10px] px-1.5 py-0" variant="secondary">{event.event_type}</Badge>
                                                        {event.event_level ? (
                                                            <Badge className="text-[10px] px-1.5 py-0" variant="outline">{formatEventLevelLabel(event.event_level)}</Badge>
                                                        ) : null}
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Approved</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span className="flex items-center gap-0.5">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {formatDateRangeStable(event.start_date, event.end_date ?? event.start_date)}
                                                        </span>
                                                        {event.location && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-0.5">
                                                                    <MapPin className="h-2.5 w-2.5" />
                                                                    {event.location}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <RegistrationDeadline
                                                        className="mt-1"
                                                        event={event}
                                                    />
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                Manage
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <ClipboardList className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                                    <p className="text-sm font-medium">No approved events yet</p>
                                    <p className="mt-1 text-xs text-muted-foreground">When you’re approved, events show up here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <FolderOpen className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Active Events</h2>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                <Link href="/dashboard/events-browser">All Events</Link>
                            </Button>
                        </div>

                        <CoachActiveEventsCards
                            events={activePublicEvents}
                            statusByEventId={statusByEventId}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
