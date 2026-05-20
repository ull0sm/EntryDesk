'use client'

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2, PlusCircle, Filter, Pencil } from "lucide-react"
import { bulkCreateEntries } from "@/app/dashboard/entries/actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { StudentDialog } from "@/components/students/student-dialog"
import { normalizeDobToIso } from "@/lib/date"
import { toast } from "sonner"
import { isSimpleEntryEventType } from '@/lib/events/type'

interface CoachStudentRegisterProps {
    students: any[]
    existingStudentIds: Set<string>
    eventId: string
    eventDays: any[]
    eventType?: string | null
    dojos: any[]
}

export function CoachStudentRegister({ students, existingStudentIds, eventId, eventDays, eventType, dojos }: CoachStudentRegisterProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isAdding, setIsAdding] = useState(false)
    const [participationType, setParticipationType] = useState('both')
    const [selectedDayId, setSelectedDayId] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [editingStudent, setEditingStudent] = useState<any>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const isSimpleEntryEvent = isSimpleEntryEventType(eventType)

    // Filters
    const [filterDojo, setFilterDojo] = useState('all')
    const [filterGender, setFilterGender] = useState('all')
    const [filterRank, setFilterRank] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    // Derived Filter Options
    const uniqueDojos = Array.from(new Set(students.map(s => s.dojos?.name))).filter(Boolean).sort()
    const uniqueRanks = Array.from(new Set(students.map(s => s.rank))).filter(Boolean).sort()

    // Filter Logic
    const availableStudents = students.filter(s => !existingStudentIds.has(s.id))

    const filteredStudents = availableStudents.filter(s => {
        const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDojo = filterDojo === 'all' || s.dojos?.name === filterDojo
        const matchesGender = filterGender === 'all' || s.gender === filterGender
        const matchesRank = filterRank === 'all' || s.rank === filterRank
        const isActive = s.is_active !== false
        const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && isActive) || (filterStatus === 'inactive' && !isActive)

        return matchesSearch && matchesDojo && matchesGender && matchesRank && matchesStatus
    })

    const isAllFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id))
    const isIndeterminate = selectedIds.size > 0 && !isAllFilteredSelected

    const handleSelectAll = (checked: boolean) => {
        const next = new Set(selectedIds)
        if (checked) {
            filteredStudents.forEach(s => next.add(s.id))
        } else {
            filteredStudents.forEach(s => next.delete(s.id))
        }
        setSelectedIds(next)
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const next = new Set(selectedIds)
        if (checked) {
            next.add(id)
        } else {
            next.delete(id)
        }
        setSelectedIds(next)
    }

    const handleAdd = async () => {
        const count = selectedIds.size
        if (count === 0) return

        // Validate Day Selection if days exist
        if (!isSimpleEntryEvent && eventDays.length > 0 && (!selectedDayId || selectedDayId === 'all')) {
            alert("Please select an Event Day before adding students.")
            return
        }

        setIsAdding(true)
        try {
            const entries = Array.from(selectedIds).map(id => ({
                student_id: id,
                participation_type: isSimpleEntryEvent ? null : participationType,
                event_day_id: isSimpleEntryEvent ? null : (selectedDayId !== 'all' ? selectedDayId : null)
            }))
            await bulkCreateEntries(eventId, entries)
            setSelectedIds(new Set())
            toast.success(`${count} student${count > 1 ? 's' : ''} added to event`)
        } catch (e) {
            console.error(e)
            const message = e instanceof Error ? e.message : 'Failed to add students to event'
            toast.error(message)
        } finally {
            setIsAdding(false)
        }
    }

    const startEdit = (student: any) => {
        setEditingStudent(student)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <StudentDialog
                dojos={dojos}
                student={editingStudent}
                eventType={eventType}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 rounded-2xl border border-white/[0.10] bg-muted/20 p-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1 md:flex-initial">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                        placeholder="Search name..."
                        className="h-11 w-full sm:w-[190px] lg:w-[260px] rounded-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger className="h-11 w-full sm:w-[130px] rounded-full">
                        <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterRank} onValueChange={setFilterRank}>
                    <SelectTrigger className="h-11 w-full sm:w-[150px] rounded-full">
                        <SelectValue placeholder="Rank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ranks</SelectItem>
                        {uniqueRanks.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterDojo} onValueChange={setFilterDojo}>
                    <SelectTrigger className="h-11 w-full sm:w-[160px] rounded-full">
                        <SelectValue placeholder="Dojo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Dojos</SelectItem>
                        {uniqueDojos.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-11 w-full sm:w-[140px] rounded-full">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.10] bg-muted/10 px-3 py-3 md:flex-row md:items-center">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Selection:</span>
                    <div>
                        <span className="text-sm font-bold">{selectedIds.size}</span>
                        <span className="text-sm text-muted-foreground ml-1">students</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <div className="flex gap-2 min-w-max">
                        {/* Event Day Selector (Conditional) */}
                        {!isSimpleEntryEvent && eventDays.length > 0 && (
                            <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                                <SelectTrigger className="w-[140px] sm:w-[180px] rounded-full border-white/[0.12] bg-background/50">
                                    <SelectValue placeholder="Select Day (Required)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" disabled>Select Day...</SelectItem>
                                    {eventDays.map(day => (
                                        <SelectItem key={day.id} value={day.id}>{day.name || day.date}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {!isSimpleEntryEvent && (
                            <Select value={participationType} onValueChange={setParticipationType}>
                                <SelectTrigger className="w-[110px] sm:w-[140px] rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="both">Both</SelectItem>
                                    <SelectItem value="kata">Kata</SelectItem>
                                    <SelectItem value="kumite">Kumite</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        <Button size="sm" onClick={handleAdd} disabled={isAdding || selectedIds.size === 0} className="min-w-[120px] rounded-full bg-emerald-600 hover:bg-emerald-700">
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                            Add
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative h-[400px] w-full overflow-x-auto overflow-y-auto rounded-2xl border border-white/[0.10] bg-background/20 dark:bg-white/[0.02]">
                <table className="w-full min-w-[600px] caption-bottom text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-muted/35 backdrop-blur-sm [&_tr]:border-b">
                        <tr className="border-b border-white/[0.12] transition-colors hover:bg-muted/45 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle w-[50px]">
                                <Checkbox
                                    checked={isAllFilteredSelected}
                                    onCheckedChange={(c) => handleSelectAll(!!c)}
                                    ref={input => {
                                        if (input) {
                                            // @ts-ignore
                                            input.indeterminate = isIndeterminate
                                        }
                                    }}
                                />
                            </th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Dojo</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Rank</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Gender / Age</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {availableStudents.length === 0 ? "All students are already entered!" : "No students match your search."}
                                </td>
                            </tr>
                        ) : filteredStudents.map((student) => (
                            <tr key={student.id} className="border-b border-white/[0.10] transition-colors hover:bg-muted/35 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">
                                    <Checkbox
                                        checked={selectedIds.has(student.id)}
                                        onCheckedChange={(c) => handleSelectOne(student.id, !!c)}
                                    />
                                </td>
                                <td className="p-4 align-middle font-medium">
                                    <div className="flex items-center gap-2">
                                        {student.name}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => startEdit(student)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </td>
                                <td className="p-4 align-middle">
                                    {student.is_active !== false ? (
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Inactive</span>
                                    )}
                                </td>
                                <td className="p-4 align-middle">{student.dojos?.name || '-'}</td>
                                <td className="p-4 align-middle">{student.rank}</td>
                                <td className="p-4 align-middle text-muted-foreground capitalize">
                                    {student.gender}, {(() => {
                                        const iso = normalizeDobToIso(student.date_of_birth)
                                        return iso ? `${new Date().getFullYear() - new Date(iso).getFullYear()}yrs` : 'Age N/A'
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-muted-foreground text-right pl-1">
                Showing {filteredStudents.length} of {availableStudents.length} available students.
            </p>
        </div>
    )
}
