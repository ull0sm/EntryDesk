'use client'

import { useState, useEffect, useRef } from 'react'
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
import { createStudent, updateStudent } from '@/app/dashboard/students/actions'
import { normalizeDobToIso } from '@/lib/date'
import { upsertEntry } from '@/app/dashboard/entries/actions'
import { isSimpleEntryEventType } from '@/lib/events/type'

interface Dojo {
    id: string
    name: string
}

interface Student {
    id: string
    name: string
    gender: string
    rank: string | null
    weight: number | null
    dojo_id: string
    date_of_birth: string | null
    [key: string]: any
}

interface StudentDialogProps {
    dojos: Dojo[]
    student?: Student
    open?: boolean
    onOpenChange?: (open: boolean) => void
    showTrigger?: boolean
    initialDojoId?: string
    entry?: any
    eventDays?: any[]
    eventType?: string | null
}

export function StudentDialog({ dojos, student, open, onOpenChange, showTrigger = true, initialDojoId, entry, eventDays, eventType }: StudentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const submitLockRef = useRef(false)

    // Controlled vs Uncontrolled logic
    const show = open !== undefined ? open : internalOpen
    const setShow = onOpenChange || setInternalOpen

    const isEditing = !!student

    const [selectedDojo, setSelectedDojo] = useState<string>(student?.dojo_id || initialDojoId || '')
    const [selectedGender, setSelectedGender] = useState<string>(student?.gender || '')
    const [selectedRank, setSelectedRank] = useState<string>(student?.rank || '')
    const [name, setName] = useState<string>(student?.name || '')
    const [weight, setWeight] = useState<string>(student?.weight?.toString() || '')
    const [dob, setDob] = useState<string>(normalizeDobToIso(student?.date_of_birth) || '')
    const [entryDayId, setEntryDayId] = useState<string>(entry?.event_day_id || '')
    const [entryType, setEntryType] = useState<string>(entry?.participation_type || '')
    const isSimpleEntryEvent = isSimpleEntryEventType(eventType)

    // Update form data whenever student prop changes or dialog opens
    useEffect(() => {
        if (show && student) {
            setSelectedDojo(student.dojo_id || '')
            setSelectedGender(student.gender || '')
            setSelectedRank(student.rank || '')
            setName(student.name || '')
            setWeight(student.weight?.toString() || '')
            setDob(normalizeDobToIso(student.date_of_birth) || '')
            if (entry) {
                setEntryDayId(entry.event_day_id || '')
                setEntryType(entry.participation_type || '')
            }
        } else if (show && !student) {
            // Create mode: prefer the dojo we navigated in with.
            setSelectedDojo(initialDojoId || '')
        } else if (!show && !student) {
            // Reset form when closing in create mode
            setSelectedDojo(initialDojoId || '')
            setSelectedGender('')
            setSelectedRank('')
            setName('')
            setWeight('')
            setDob('')
            setEntryDayId('')
            setEntryType('')
        }
    }, [show, student, entry, initialDojoId])

    const handleSubmit = async (formData: FormData) => {
        if (submitLockRef.current || isSubmitting) return;
        submitLockRef.current = true;
        // Append all current state values to formData
        formData.append('name', name)
        formData.append('dojo_id', selectedDojo)
        formData.append('gender', selectedGender)
        formData.append('rank', selectedRank)
        formData.append('weight', weight)
        formData.append('dob', dob)

        setIsSubmitting(true)
        try {
            if (isEditing) {
                await updateStudent(student.id, formData)
            } else {
                await createStudent(formData)
            }

            // If this dialog was opened from the entries table with an entry,
            // also update the entry's day/type.
            if (entry) {
                const entryForm = new FormData()
                entryForm.append('event_id', entry.event_id)
                entryForm.append('student_id', entry.student_id)
                entryForm.append('category_id', entry.category_id || '')
                if (entryDayId) entryForm.append('event_day_id', entryDayId)
                if (entryType) entryForm.append('participation_type', entryType)
                await upsertEntry(entryForm)
            }

            setShow(false)
        } catch (error) {
            alert('Failed to save student')
        } finally {
            submitLockRef.current = false;
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={show} onOpenChange={setShow}>
            {!isEditing && showTrigger && (
                <DialogTrigger asChild>
                    <Button>Add Student</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update student details.' : 'Add a new student to your roster.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dojo" className="text-right">Dojo</Label>
                            <div className="col-span-3">
                                <Select value={selectedDojo} onValueChange={setSelectedDojo} required disabled={isEditing}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a Dojo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dojos.map(dojo => (
                                            <SelectItem key={dojo.id} value={dojo.id}>{dojo.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gender" className="text-right">Gender</Label>
                            <div className="col-span-3">
                                <Select value={selectedGender} onValueChange={setSelectedGender} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rank" className="text-right">Rank/Belt</Label>
                            <div className="col-span-3">
                                <Select value={selectedRank} onValueChange={setSelectedRank} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="white">White</SelectItem>
                                        <SelectItem value="yellow">Yellow</SelectItem>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="brown">Brown</SelectItem>
                                        <SelectItem value="black">Black</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="weight" className="text-right">Weight (kg)</Label>
                            <Input id="weight" name="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dob" className="text-right">DOB</Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        {entry && !isSimpleEntryEvent && eventDays && eventDays.length > 0 && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Day</Label>
                                    <div className="col-span-3">
                                        <Select value={entryDayId} onValueChange={setEntryDayId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventDays.map((d: any) => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name || d.date}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Type</Label>
                                    <div className="col-span-3">
                                        <Select value={entryType} onValueChange={setEntryType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kata">Kata</SelectItem>
                                                <SelectItem value="kumite">Kumite</SelectItem>
                                                <SelectItem value="both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving...
                                </span>
                            ) : (
                                'Save Student'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
