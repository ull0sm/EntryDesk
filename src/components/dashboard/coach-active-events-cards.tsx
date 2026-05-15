'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Users, XCircle } from 'lucide-react'
import { ApplyButton } from '@/components/events/apply-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { formatDateRangeStable } from '@/lib/date'
import { RegistrationDeadline } from '@/components/events/registration-deadline'
import { isRegistrationClosed } from '@/lib/events/registration'
import { formatEventLevelLabel } from '@/lib/events/level'

type CoachActiveEvent = {
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

export function CoachActiveEventsCards({
    events,
    statusByEventId,
}: {
    events: CoachActiveEvent[]
    statusByEventId: Record<string, string>
}) {
    const [selectedEvent, setSelectedEvent] = useState<CoachActiveEvent | null>(null)

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => {
                    const status = statusByEventId[event.id]
                    const registrationClosed = isRegistrationClosed(event)
                    return (
                        <div key={event.id} className="group flex flex-col rounded-2xl border border-black/10 bg-gradient-to-b from-background/90 to-background/50 hover:bg-background/70 transition-colors p-5 shadow-md shadow-black/5 dark:border-white/10 dark:shadow-black/40">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                                        {event.event_type}
                                    </Badge>
                                    {event.event_level ? (
                                        <Badge variant="outline" className="border-border/60 bg-transparent">
                                            {formatEventLevelLabel(event.event_level)}
                                        </Badge>
                                    ) : null}
                                </div>
                                {status && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background border border-border text-[10px] font-medium shadow-sm">
                                        {getStatusIcon(status)}
                                        <span>{getStatusText(status)}</span>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{event.title}</h3>

                            <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDateRange(event.start_date, event.end_date)}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[200px]">{event.location}</span>
                                    </div>
                                )}
                                <RegistrationDeadline
                                    event={event}
                                />
                            </div>

                            <div className="mt-auto pt-4 flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-black/10 bg-white/5 hover:bg-white/10 hover:text-foreground dark:border-white/10"
                                    onClick={() => setSelectedEvent(event)}
                                >
                                    Details
                                </Button>
                                {status === 'approved' ? (
                                    <Link href={`/dashboard/entries/${event.id}`} className="w-full">
                                        <Button className="w-full rounded-xl">
                                            Entries
                                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <ApplyButton eventId={event.id} status={status} registrationClosed={registrationClosed} className="w-full rounded-xl" />
                                )}
                            </div>
                        </div>
                    )
                })}

                {events.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-black/10 rounded-2xl bg-white/5 dark:border-white/10">
                        No active events found.
                    </div>
                )}
            </div>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent
                    className="gap-5 border border-border/60 bg-background/95 p-6 sm:max-w-[680px]"
                    overlayClassName="bg-black/55 backdrop-blur-md"
                >
                    {selectedEvent ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="pr-8 text-3xl font-bold tracking-tight">{selectedEvent.title}</DialogTitle>
                                <DialogDescription className="text-sm">
                                    {formatEventMeta(selectedEvent.event_type, selectedEvent.event_level)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 border border-border/50 p-4 text-sm rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDateRange(selectedEvent.start_date, selectedEvent.end_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{selectedEvent.location || 'Location to be announced'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Open registration</span>
                                </div>
                                <RegistrationDeadline
                                    event={selectedEvent}
                                />
                            </div>

                            <div className="space-y-2 rounded-lg border border-border/50 p-4">
                                <h4 className="text-sm font-semibold tracking-tight">Description</h4>
                                <p className="text-sm text-muted-foreground">{selectedEvent.description || 'No description provided.'}</p>
                            </div>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    )
}

function getStatusIcon(status: string | undefined) {
    if (status === 'approved') return <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
    if (status === 'pending') return <Clock className="h-3 w-3 text-amber-600 dark:text-amber-500" />
    if (status === 'rejected') return <XCircle className="h-3 w-3 text-red-600 dark:text-red-500" />
    return null
}

function getStatusText(status: string | undefined) {
    if (status === 'approved') return 'Approved'
    if (status === 'pending') return 'Pending'
    if (status === 'rejected') return 'Rejected'
    return null
}

function formatDateRange(startDate: string, endDate: string) {
    return formatDateRangeStable(startDate, endDate)
}

function formatEventTypeLabel(eventType: string | null) {
    if (!eventType) return 'Tournament'

    const normalized = eventType.trim().toLowerCase().replace(/[_-]+/g, ' ')
    if (!normalized) return 'Tournament'
    if (normalized === 'test' || normalized === 'black belt test' || normalized === 'blackbelt test') {
        return 'Blackbelt Test'
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatEventMeta(eventType: string | null, eventLevel?: string | null) {
    const typeLabel = formatEventTypeLabel(eventType)
    const levelLabel = formatEventLevelLabel(eventLevel)

    return levelLabel ? `${typeLabel} • ${levelLabel}` : typeLabel
}
