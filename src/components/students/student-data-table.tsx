
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
    VisibilityState
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudentActions } from './student-actions'
import { Search, ChevronDown, ArrowUpDown } from 'lucide-react'
import Fuse from 'fuse.js'
import { normalizeDobToIso } from '@/lib/date'
import { useAppNavigation } from '@/components/app/navigation-provider'

interface Student {
    id: string
    name: string
    gender: string
    rank: string | null
    weight: number | null
    date_of_birth: string | null
    dojo_id: string
    dojos?: { name: string } | null
    registration_no?: string | null
    is_active?: boolean
    // Add other fields as needed
}

interface StudentDataTableProps {
    data: Student[]
    dojos: { id: string, name: string }[]
    initialDojoFilter?: string
}

export function StudentDataTable({ data, dojos, initialDojoFilter }: StudentDataTableProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { beginNavigation } = useAppNavigation()

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')

    const [dojoFilter, setDojoFilter] = useState<string>('all')

    // Fuse.js instance for fuzzy search
    const fuse = useMemo(() => new Fuse(data, {
        keys: ['name', 'dojos.name', 'rank'],
        threshold: 0.3, // Adjust for fuzziness (0.0 = exact, 1.0 = match anything)
        distance: 100,
    }), [data]);

    // Filtered Data based on Global Search (Fuse.js)
    const filteredData = useMemo(() => {
        if (!globalFilter) return data;
        return fuse.search(globalFilter).map(result => result.item);
    }, [data, globalFilter, fuse]);

    // Table Columns definition
    const columns: ColumnDef<Student>[] = [
        {
            accessorKey: "registration_no",
            header: "Reg ID",
            cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("registration_no") || "-"}</div>,
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium pl-4">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active") !== false; // Default true if undefined
                return (
                    <div className="flex items-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )
            },
            filterFn: (row, id, value) => {
                const isActive = row.getValue(id) !== false;
                if (value === 'all') return true;
                if (value === 'active') return isActive;
                if (value === 'inactive') return !isActive;
                return true;
            }
        },
        {
            accessorKey: "dojoName", // Virtual column for filtering
            id: "dojo",
            accessorFn: (row) => row.dojos?.name || "Unknown",
            header: "Dojo",
            cell: ({ row }) => <div>{row.original.dojos?.name}</div>,
            filterFn: (row, id, value) => {
                return value === "all" || row.getValue(id) === value
            },
        },
        {
            accessorKey: "gender",
            header: "Gender",
            cell: ({ row }) => <div className="capitalize">{row.getValue("gender")}</div>,
            filterFn: (row, id, value) => {
                return value === "all" || row.getValue(id) === value
            },
        },
        {
            accessorKey: "rank",
            header: "Rank",
            cell: ({ row }) => <div className="capitalize">{row.getValue("rank") || "-"}</div>,
        },
        {
            accessorKey: "weight",
            header: "Weight",
            cell: ({ row }) => {
                const w = row.getValue("weight")
                return <div>{w ? `${w} kg` : '-'}</div>
            },
        },
        {
            accessorKey: "date_of_birth",
            header: "DOB",
            cell: ({ row }) => {
                const raw = row.getValue("date_of_birth")
                const normalized = normalizeDobToIso(raw)
                return <div>{normalized || (raw != null ? String(raw) : '-')}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const student = row.original
                return <StudentActions student={student} dojos={dojos} />
            },
        },
    ]

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    // Filter Handlers
    const setFilter = (columnId: string, value: string) => {
        table.getColumn(columnId)?.setFilterValue(value === 'all' ? undefined : value)
    }

    useEffect(() => {
        const urlDojo = searchParams.get('dojo')
        const desired = urlDojo ?? initialDojoFilter ?? 'all'

        const exists = desired !== 'all' && dojos.some((d) => d.name === desired)
        const next = exists ? desired : 'all'

        setDojoFilter(next)
        table.getColumn('dojo')?.setFilterValue(next === 'all' ? undefined : next)
    }, [dojos, initialDojoFilter, searchParams, table])

    return (
        <div className="w-full space-y-4">
            {/* Search and Filters Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students (fuzzy)..."
                        value={globalFilter}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="h-11 rounded-full pl-8"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={dojoFilter}
                        onValueChange={(val) => {
                            setDojoFilter(val)
                            setFilter("dojo", val)

                            const params = new URLSearchParams(searchParams)
                            if (val === 'all') params.delete('dojo')
                            else params.set('dojo', val)

                            // Reset paging when switching filters.
                            params.delete('page')

                            beginNavigation()
                            router.push(`?${params.toString()}`)
                        }}
                    >
                        <SelectTrigger className="h-11 w-[140px] rounded-full">
                            <SelectValue placeholder="All Dojos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Dojos</SelectItem>
                            {dojos.map(dojo => (
                                <SelectItem key={dojo.id} value={dojo.name}>{dojo.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={(val) => setFilter("gender", val)}>
                        <SelectTrigger className="h-11 w-[110px] rounded-full">
                            <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select onValueChange={(val) => setFilter("is_active", val)}>
                        <SelectTrigger className="h-11 w-[120px] rounded-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto h-11 rounded-full">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/20 dark:border-white/[0.10] dark:bg-white/[0.02]">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="py-1 text-sm text-muted-foreground">
                Showing {table.getFilteredRowModel().rows.length} row(s) on this page.
            </div>
        </div>
    )
}
