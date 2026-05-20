'use client'

import { useEffect, useMemo, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, Send, Filter, ChevronLeft, ChevronRight, AlertTriangle, Pencil } from "lucide-react"
import { bulkSubmitEntries, bulkDeleteEntries } from "@/app/dashboard/entries/actions"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { StudentDialog } from "@/components/students/student-dialog"
import { isSimpleEntryEventType } from '@/lib/events/type'
import { updateEntryGenericChecked } from "@/app/dashboard/entries/actions"

interface CoachEntriesListProps {
    entries: any[]
    eventDays: any[]
    dojos: any[]
    eventType?: string | null
    statusPreset?: string
    isReadOnly?: boolean
}

const ITEMS_PER_PAGE = 50

export function CoachEntriesList({ entries, eventDays, dojos, eventType, statusPreset, isReadOnly = false }: CoachEntriesListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [editingStudent, setEditingStudent] = useState<any>(null)
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [genericCheckedMap, setGenericCheckedMap] = useState<Record<string, boolean>>(() => {
        const map: Record<string, boolean> = {}
        for (const entry of entries) {
            map[entry.id] = !!entry.generic_checked
        }
        return map
    })

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [beltFilter, setBeltFilter] = useState('all')
    const [dayFilter, setDayFilter] = useState('all')
    const [dojoFilter, setDojoFilter] = useState('all')
    const [paymentFilter, setPaymentFilter] = useState('all')
    const [page, setPage] = useState(1)
    const isSimpleEntryEvent = isSimpleEntryEventType(eventType)

    useEffect(() => {
        if (!statusPreset) return

        setStatusFilter(statusPreset)
        setPage(1)
        setSelectedIds(new Set())
    }, [statusPreset])

    // Derived filter options
    const uniqueRanks = Array.from(
        new Set(entries.map((e) => e.students?.rank).filter(Boolean))
    ).sort()

    const dojoNameById = useMemo(() => {
        const map = new Map<string, string>()
        dojos.forEach((dojo) => {
            if (dojo?.id && dojo?.name) {
                map.set(String(dojo.id), dojo.name)
            }
        })
        return map
    }, [dojos])

    const getDojoName = (entry: any) => {
        const joinedDojoName = entry.students?.dojos?.name
        if (joinedDojoName) return String(joinedDojoName)

        const dojoId = entry.students?.dojo_id
        if (!dojoId) return ''

        return dojoNameById.get(String(dojoId)) || ''
    }

    const getDojoId = (entry: any) => {
        const joinedDojoId = entry.students?.dojos?.id
        if (joinedDojoId) return String(joinedDojoId)

        const dojoId = entry.students?.dojo_id
        if (!dojoId) return ''

        return String(dojoId)
    }

    const dojoFilterOptions = useMemo(() => {
        const uniqueDojos = new Map<string, string>()

        entries.forEach((entry) => {
            const dojoId = getDojoId(entry)
            const dojoName = getDojoName(entry)
            if (dojoId && dojoName) {
                uniqueDojos.set(dojoId, dojoName)
            }
        })

        return Array.from(uniqueDojos.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [entries, dojos])

    useEffect(() => {
        if (dojoFilter === 'all') return
        const hasSelectedDojo = dojoFilterOptions.some((dojo) => dojo.id === dojoFilter)
        if (!hasSelectedDojo) {
            setDojoFilter('all')
            setPage(1)
        }
    }, [dojoFilter, dojoFilterOptions])

    // Filter Logic
    const filteredEntries = entries.filter(e => {
        const matchesSearch = (e.students?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter
        const matchesBelt = beltFilter === 'all' || e.students?.rank === beltFilter
        const matchesDay = isSimpleEntryEvent || dayFilter === 'all' || e.event_day_id === dayFilter
        const matchesDojo = dojoFilter === 'all' || getDojoId(e) === dojoFilter
        
        const isPaid = genericCheckedMap[e.id] ?? !!e.generic_checked
        const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'paid' && isPaid) || (paymentFilter === 'unpaid' && !isPaid)
        
        return matchesSearch && matchesStatus && matchesBelt && matchesDay && matchesDojo && matchesPayment
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
    const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    const paginatedEntries = filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    // Selection Logic
    const isAllSelected = filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.has(e.id))
    const isIndeterminate = selectedIds.size > 0 && !isAllSelected

    const handleSelectAll = (checked: boolean) => {
        const next = new Set(selectedIds)
        if (checked) {
            filteredEntries.forEach(e => next.add(e.id))
        } else {
            filteredEntries.forEach(e => next.delete(e.id))
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

    const handleSubmit = async () => {
        if (!confirm(`Submit ${selectedIds.size} entries?`)) return
        setIsSubmitting(true)
        try {
            const result = await bulkSubmitEntries(Array.from(selectedIds))
            if (result?.success === false && result?.message) {
                alert(result.message)
                return
            }
            setSelectedIds(new Set())
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to submit'
            alert(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} entries? This cannot be undone.`)) return
        setIsDeleting(true)
        try {
            await bulkDeleteEntries(Array.from(selectedIds))
            setSelectedIds(new Set())
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to delete'
            alert(message)
        } finally {
            setIsDeleting(false)
        }
    }

    const getMissingFields = (student: any) => {
        if (!student) return []
        const missing = []
        if (!student.rank) missing.push('Rank')
        if (!student.date_of_birth) missing.push('DOB')
        if (!student.gender) missing.push('Gender')
        return missing
    }

    const startEdit = (entry: any) => {
        setEditingStudent(entry.students)
        setEditingEntry(entry)
        setDialogOpen(true)
    }

    const handleToggleGeneric = async (entryId: string, checked: boolean) => {
        const previous = genericCheckedMap[entryId] ?? false
        setGenericCheckedMap((prev) => ({ ...prev, [entryId]: checked }))

        try {
            await updateEntryGenericChecked(entryId, checked, entries[0]?.event_id)
        } catch (error) {
            setGenericCheckedMap((prev) => ({ ...prev, [entryId]: previous }))
            alert('Failed to save payment status')
        }
    }

    return (
        <div className="space-y-4">
            {!isReadOnly && (
                <StudentDialog
                    dojos={dojos}
                    student={editingStudent}
                    entry={editingEntry}
                    eventDays={eventDays}
                    eventType={eventType}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    showTrigger={false}
                />
            )}

            <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.05] bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                    <Input
                        placeholder="Search student..."
                        className="h-11 w-[190px] rounded-full lg:w-[260px]"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-11 w-[150px] rounded-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={beltFilter} onValueChange={(v) => { setBeltFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-11 w-[150px] rounded-full">
                            <SelectValue placeholder="Belt" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Belts</SelectItem>
                            {uniqueRanks.map((r) => (
                                <SelectItem key={r} value={r as string}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!isSimpleEntryEvent && eventDays && eventDays.length > 0 && (
                        <Select value={dayFilter} onValueChange={(v) => { setDayFilter(v); setPage(1); }}>
                            <SelectTrigger className="h-11 w-[160px] rounded-full">
                                <SelectValue placeholder="Filter Day" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Days</SelectItem>
                                {eventDays.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name || d.date}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={dojoFilter} onValueChange={(v) => { setDojoFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-11 w-[170px] rounded-full">
                            <SelectValue placeholder="Filter Dojo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Dojos</SelectItem>
                            {dojoFilterOptions.map((dojo) => (
                                <SelectItem key={dojo.id} value={String(dojo.id)}>{dojo.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {!isReadOnly && (
                        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
                            <SelectTrigger className="h-11 w-[140px] rounded-full">
                                <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payments</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isReadOnly && selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-background/50 px-2 py-1">
                            <span className="text-sm font-medium mr-2 hidden md:inline">{selectedIds.size} selected</span>
                            <Button size="sm" className="rounded-full" onClick={handleSubmit} disabled={isSubmitting || isDeleting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                Submit
                            </Button>
                            <Button size="sm" variant="destructive" className="rounded-full" onClick={handleDelete} disabled={isSubmitting || isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative w-full min-h-[300px] overflow-auto rounded-2xl border border-white/[0.06] bg-background/20 dark:bg-white/[0.02]">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-muted/35 backdrop-blur-sm [&_tr]:border-b">
                        <tr className="border-b border-white/[0.06] transition-colors hover:bg-muted/45 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle w-[50px]">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(c) => handleSelectAll(!!c)}
                                    disabled={isReadOnly}
                                    ref={input => {
                                        if (input) {
                                            // @ts-ignore
                                            input.indeterminate = isIndeterminate
                                        }
                                    }}
                                />
                            </th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[80px]">Chest</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Student</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Dojo</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Belt</th>
                            {!isSimpleEntryEvent && <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Day</th>}
                            {!isSimpleEntryEvent && <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>}
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                            {!isReadOnly && <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[90px]">Payment</th>}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {paginatedEntries.length === 0 ? (
                            <tr>
                                <td colSpan={isSimpleEntryEvent ? 6 : 8} className="h-24 text-center text-muted-foreground">
                                    {filteredEntries.length === 0
                                        ? "No entries match your filters."
                                        : "No active entries. Go to 'Register' tab to add students."}
                                </td>
                            </tr>
                        ) : paginatedEntries.map((entry) => {
                            const missing = getMissingFields(entry.students)
                            const isEditable = !isReadOnly && entry.status === 'draft'
                            return (
                                <tr key={entry.id} className="border-b border-white/[0.05] transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle">
                                        <Checkbox
                                            checked={selectedIds.has(entry.id)}
                                            onCheckedChange={(c) => handleSelectOne(entry.id, !!c)}
                                            disabled={isReadOnly}
                                        />
                                    </td>
                                    {/* Chest No */}
                                    <td className="p-4 align-middle font-bold text-emerald-600 dark:text-emerald-400">
                                        {entry.chest_no || '-'}
                                    </td>
                                    {/* Student */}
                                    {/* @ts-ignore */}
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-2">
                                            {missing.length > 0 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Missing: {missing.join(', ')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <span>{entry.students?.name}</span>
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => startEdit(entry)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Dojo */}
                                    <td className="p-4 align-middle">{getDojoName(entry) || '-'}</td>

                                    {/* Belt */}
                                    <td className="p-4 align-middle capitalize">{entry.students?.rank || '-'}</td>

                                    {!isSimpleEntryEvent && (
                                        <>
                                            {/* Day */}
                                            {/* @ts-ignore */}
                                            <td className="p-4 align-middle">{entry.event_days?.name || '-'}</td>

                                            {/* Type */}
                                            <td className="p-4 align-middle capitalize">{entry.participation_type || '-'}</td>
                                        </>
                                    )}

                                    {/* Status */}
                                    <td className="p-4 align-middle">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
                                            entry.status === 'approved' ? "bg-emerald-100 text-emerald-800" :
                                                entry.status === 'rejected' ? "bg-red-100 text-red-800" :
                                                    entry.status === 'submitted' ? "bg-blue-100 text-blue-800" :
                                                        "text-foreground bg-yellow-100 text-yellow-800"
                                        )}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    
                                    {/* Payment Checkbox */}
                                    {!isReadOnly && (
                                        <td className="p-4 align-middle">
                                            <Checkbox
                                                checked={!!genericCheckedMap[entry.id]}
                                                onCheckedChange={(c) => handleToggleGeneric(entry.id, !!c)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2">
                    <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredEntries.length)} of {filteredEntries.length}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {safePage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
