'use client'

import { CoachOverview } from "./coach-overview"
import { CoachEntriesList } from "./coach-entries-list"
import { CoachStudentRegister } from "./coach-student-register"
import { useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RegistrationDeadline } from "@/components/events/registration-deadline"

interface CoachDashboardProps {
    event: any
    eventType?: string | null
    stats: any
    entries: any[]
    students: any[]
    eventDays: any[]
    dojos: any[]
    isPastEvent?: boolean
    isRegistrationClosed?: boolean
}

export function CoachDashboard({ event, eventType, stats, entries, students, eventDays, dojos, isPastEvent = false, isRegistrationClosed = false }: CoachDashboardProps) {
    const existingStudentIds = useMemo(() => new Set(entries.map(e => e.student_id)), [entries])

    const [statusPreset, setStatusPreset] = useState<string>('all')
    const [registerOpen, setRegisterOpen] = useState(false)
    const entriesRef = useRef<HTMLDivElement | null>(null)

    const selectStatus = useCallback((nextStatus: string) => {
        setStatusPreset(nextStatus)
        // Jump user straight to the entries table.
        entriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                            {isPastEvent && (
                                <span className="rounded-full border border-black/10 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-white/10">
                                    Event Ended
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            {isPastEvent
                                ? "This event has ended. You can view entries and details."
                                : isRegistrationClosed
                                    ? "Registration for this event has ended. You can still view entries and details."
                                    : "Manage your team's participation."}
                        </p>
                        <RegistrationDeadline event={event} className="animate-pulse-gentle mt-1.5 text-sm sm:hidden" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <RegistrationDeadline event={event} className="animate-pulse-gentle text-sm hidden sm:flex" />
                        {!isPastEvent && !isRegistrationClosed && <Button onClick={() => setRegisterOpen(true)}>Register athletes</Button>}
                    </div>
                </div>
            </div>

            <CoachOverview stats={stats} entries={entries} onSelectStatus={selectStatus} />

            <div ref={entriesRef} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Entries</h3>
                        <p className="text-sm text-muted-foreground">Filter, submit, and manage your entries.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => selectStatus('all')}>All</Button>
                        <Button variant="outline" onClick={() => selectStatus('draft')}>Drafts</Button>
                        <Button variant="outline" onClick={() => selectStatus('submitted')}>Submitted</Button>
                        <Button variant="outline" onClick={() => selectStatus('approved')}>Approved</Button>
                    </div>
                </div>
                <CoachEntriesList
                    entries={entries}
                    eventDays={eventDays}
                    dojos={dojos}
                    eventType={eventType}
                    statusPreset={statusPreset}
                    isReadOnly={isPastEvent}
                />
            </div>

            {!isPastEvent && (
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                    <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] md:w-full max-h-[95vh] flex flex-col overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Register athletes</DialogTitle>
                            <DialogDescription>
                                Pick students from your roster and add them to this event.
                            </DialogDescription>
                        </DialogHeader>

                        <CoachStudentRegister
                            students={students}
                            existingStudentIds={existingStudentIds}
                            eventId={event.id}
                            eventDays={eventDays}
                            eventType={eventType}
                            dojos={dojos}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
