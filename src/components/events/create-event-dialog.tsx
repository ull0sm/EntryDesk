'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createEvent } from '@/app/dashboard/events/actions'
import { Checkbox } from "@/components/ui/checkbox"
import { EVENT_LEVEL_OPTIONS } from '@/lib/events/level'
import { isEventTypeRequiringLevel } from '@/lib/events/type'

export function CreateEventDialog() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [eventType, setEventType] = useState<string>('')
    const [eventLevel, setEventLevel] = useState<string>('')
    const submitLockRef = useRef(false)
    const requiresEventLevel = isEventTypeRequiringLevel(eventType || null)

    useEffect(() => {
        if (!requiresEventLevel) {
            setEventLevel('')
        }
    }, [requiresEventLevel])

    const handleSubmit = async (formData: FormData) => {
        if (submitLockRef.current || isSubmitting) {
            return
        }

        // Manually add dates if using a range picker
        // Simple implementation: two separate date inputs for now to be safe with standard form data
        // But let's use the formData directly if we use hidden inputs
        try {
            submitLockRef.current = true
            setIsSubmitting(true)
            const result = await createEvent(formData)
            if (!result?.success) {
                alert(result?.error || 'Failed to create event')
                return
            }
            setOpen(false)
        } catch {
            alert('Failed to create event')
        } finally {
            submitLockRef.current = false
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Set up a new event with dates and registration settings.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" name="title" className="col-span-3" required placeholder="Winter Championship 2024" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="event_type" className="text-right">Type</Label>
                            <div className="col-span-3">
                                <Select name="event_type" value={eventType} onValueChange={setEventType} required>
                                    <SelectTrigger id="event_type">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tournament">Tournament</SelectItem>
                                        <SelectItem value="seminar">Seminar</SelectItem>
                                        <SelectItem value="test">Black Belt Test</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {requiresEventLevel && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="event_level" className="text-right">Level</Label>
                                <div className="col-span-3">
                                    <Select name="event_level" value={eventLevel} onValueChange={setEventLevel} required>
                                        <SelectTrigger id="event_level">
                                            <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EVENT_LEVEL_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input id="location" name="location" className="col-span-3" placeholder="City Arena" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start_date" className="text-right">Start Date</Label>
                            <Input id="start_date" type="date" name="start_date" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end_date" className="text-right">End Date</Label>
                            <Input id="end_date" type="date" name="end_date" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="registration_close_date" className="text-right">Registration Closes</Label>
                            <Input id="registration_close_date" type="date" name="registration_close_date" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_public" className="text-right">Public?</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Checkbox id="is_public" name="is_public" />
                                <label
                                    htmlFor="is_public"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Visible on home page
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                placeholder="Event details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Creating...
                                </span>
                            ) : (
                                'Create Event'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
