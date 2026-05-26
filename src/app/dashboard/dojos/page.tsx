import { requireRole } from '@/lib/auth/require-role'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Users } from 'lucide-react'
import { DojoDialog } from '@/components/dojos/dojo-dialog'
import { DojoActions } from '@/components/dojos/dojo-actions'
import { DashboardPageHeader } from '@/components/dashboard/page-header'
import { PaginationControls } from '@/components/ui/pagination-controls'
import Link from 'next/link'

export default async function DojosPage({
    searchParams,
}: {
    searchParams?: Promise<{ page?: string }>
}) {
    const { supabase, user } = await requireRole('coach', { redirectTo: '/dashboard' })
    const sp = await searchParams
    const page = Math.max(1, Number(sp?.page) || 1)
    const limit = 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Fetch coach's dojos with student count
    const { data: dojos, count } = await supabase
        .from('dojos')
        .select('*, students(count)', { count: 'exact' })
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

    const totalPages = Math.ceil((count ?? 0) / limit)

    return (
        <div className="space-y-4">
            <DashboardPageHeader
                title="Dojos"
                description="Manage your schools and locations."
                actions={
                    <DojoDialog>
                        <Button size="sm">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Dojo
                        </Button>
                    </DojoDialog>
                }
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dojos && dojos.length > 0 ? (
                    dojos.map((dojo) => {
                        const studentCount = Number(dojo.students?.[0]?.count ?? 0)

                        return (
                        <div
                            key={dojo.id}
                            className="dashboard-surface dashboard-list-item group relative p-3"
                        >
                            <Link
                                href={{ pathname: '/dashboard/students', query: { dojo: dojo.name } }}
                                className="absolute inset-0 z-10"
                            >
                                <span className="sr-only">View students for {dojo.name}</span>
                            </Link>
                            <div className="flex items-start justify-between gap-2">
                                <div className="pointer-events-none relative z-20 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                                        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{dojo.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Users className="h-2.5 w-2.5" />
                                            <span>{studentCount} students</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-20">
                                    <DojoActions dojo={dojo} studentCount={studentCount} />
                                </div>
                            </div>
                        </div>
                        )
                    })
                ) : (
                    <div className="dashboard-empty col-span-full py-8 text-center">
                        <LayoutGrid className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">No dojos yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Create your first dojo to start adding students.</p>
                        <div className="mt-3">
                            <DojoDialog>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                    Create your first dojo
                                </Button>
                            </DojoDialog>
                        </div>
                    </div>
                )}
            </div>

            <PaginationControls page={page} totalPages={totalPages} totalCount={count ?? 0} />
        </div>
    )
}
