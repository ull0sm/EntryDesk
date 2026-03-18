'use client'

import { useState } from 'react'
import { updateEventSettings } from '@/app/dashboard/events/[id]/actions'
import { DeleteEventForm } from '@/components/events/delete-event-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, Clock } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { EVENT_LEVEL_OPTIONS, type EventLevel } from '@/lib/events/level'
import { isEventTypeRequiringLevel } from '@/lib/events/type'

interface EventSettingsFormProps {
    event: {
        id: string
        title: string
        location: string | null
        event_type?: string | null
        event_level?: EventLevel | null
        is_registration_open: boolean
        is_public: boolean
        temporary_registration_closes_at?: string | null
    }
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

export function EventSettingsForm({ event }: EventSettingsFormProps) {
    const [title, setTitle] = useState(event.title)
    const [location, setLocation] = useState(event.location || '')
    const [eventLevel, setEventLevel] = useState<EventLevel | ''>(event.event_level || '')
    const [isPublic, setIsPublic] = useState(event.is_public)
    const [isSaving, setIsSaving] = useState(false)
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
    const [tempClosesAt, setTempClosesAt] = useState<string | null>(event.temporary_registration_closes_at || null)
    const requiresEventLevel = isEventTypeRequiringLevel(event.event_type)

    const handleTemporaryOpen = async (minutes: number) => {
        setIsSaving(true)
        try {
            const newTime = minutes > 0 
                ? new Date(Date.now() + minutes * 60000).toISOString()
                : null
            
            await updateEventSettings(event.id, { temporary_registration_closes_at: newTime })
            setTempClosesAt(newTime)
            toast.success(minutes > 0 ? `Registration opened for ${minutes} minutes` : 'Temporary open closed')
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to update temporary open status'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await updateEventSettings(event.id, {
                title,
                location,
                event_level: requiresEventLevel ? (eventLevel || null) : null,
            })
            toast.success("Event details updated successfully")
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to update event details'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleVisibilityToggle = async (checked: boolean) => {
        if (isTogglingVisibility || checked === isPublic) return

        const message = checked
            ? 'Make this event public? It will be visible on the home page and public listings.'
            : 'Make this event private? It will be hidden from the home page and public listings.'

        const confirmed = window.confirm(message)
        if (!confirmed) return

        setIsTogglingVisibility(true)
        setIsPublic(checked)
        try {
            await updateEventSettings(event.id, { is_public: checked })
            toast.success(`Event is now ${checked ? 'public' : 'private'}`)
        } catch (error) {
            setIsPublic(!checked)
            toast.error(getErrorMessage(error, 'Failed to update event visibility'))
        } finally {
            setIsTogglingVisibility(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <Card className={tempClosesAt && new Date(tempClosesAt) > new Date() ? "border-emerald-500/50 shadow-sm" : ""}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Temporary Open (Short Burst)
                    </CardTitle>
                    <CardDescription>Temporarily open registration for last-minute adjustments. It will automatically close when time expires.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 rounded-lg border p-4">
                        {tempClosesAt && new Date(tempClosesAt) > new Date() ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-emerald-600 dark:text-emerald-500">
                                        Temporarily Open
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Closes at {new Date(tempClosesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(tempClosesAt).toLocaleDateString()})
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => handleTemporaryOpen(0)} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Close Now
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Open For:</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Select a duration below to open registration immediately.
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Button variant="secondary" onClick={() => handleTemporaryOpen(15)} disabled={isSaving}>15 mins</Button>
                                    <Button variant="secondary" onClick={() => handleTemporaryOpen(60)} disabled={isSaving}>1 hour</Button>
                                    <Button variant="secondary" onClick={() => handleTemporaryOpen(180)} disabled={isSaving}>3 hours</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Visibility</CardTitle>
                    <CardDescription>Control whether this event appears in public listings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Public event</Label>
                            <p className="text-sm text-muted-foreground">
                                Public events appear on the home page and events browser.
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={handleVisibilityToggle}
                            disabled={isTogglingVisibility}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update the basic details of your event.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveGeneral} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Name</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Spring Karate Tournament"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Address / Location</Label>
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="E.g. 123 Main St, City, ST 12345"
                            />
                        </div>
                        {requiresEventLevel && (
                            <div className="space-y-2">
                                <Label htmlFor="event_level">Event Level</Label>
                                <Select value={eventLevel || undefined} onValueChange={(value) => setEventLevel(value as EventLevel)}>
                                    <SelectTrigger id="event_level">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_LEVEL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save General Settings
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="danger-zone" className="border-destructive/20 border rounded-lg px-4 bg-destructive/5 overflow-hidden">
                    <AccordionTrigger className="text-destructive hover:text-destructive hover:no-underline py-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertTriangle className="h-5 w-5" />
                            Advanced Options (Danger Zone)
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-md bg-background/50">
                            <div>
                                <h4 className="font-semibold text-foreground">Delete Event</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Permanently remove this event and all its associated data. This action cannot be undone.
                                </p>
                            </div>
                            <div className="shrink-0 flex justify-end">
                                <DeleteEventForm eventId={event.id} eventTitle={event.title} />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
