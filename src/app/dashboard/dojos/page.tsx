import { requireRole } from '@/lib/auth/require-role'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Users, Share2 } from 'lucide-react'
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

    // Fetch dojos (owned and shared) with student count and collaborators
    // If table doesn't exist, this fails and returns null dojos
    const { data: dojos, count } = await supabase
        .from('dojos')
        .select(`
            *, 
            students(count),
            dojo_collaborators (
                user_id,
                permission,
                profiles (
                    email,
                    full_name
                )
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    const totalPages = Math.ceil((count ?? 0) / limit)
    
    const myDojos = dojos?.filter(d => d.coach_id === user.id) || []
    const sharedDojos = dojos?.filter(d => d.coach_id !== user.id) || []

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Dojos"
                description="Manage your schools and locations."
                actions={
                    <DojoDialog size="sm" showPlusIcon={true} triggerText="Add Dojo" />
                }
            />

            {dojos && dojos.length === 0 ? (
                <div className="dashboard-empty py-8 text-center">
                    <LayoutGrid className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No dojos yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Create your first dojo to start adding students.</p>
                    <div className="mt-3">
                        <DojoDialog 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs" 
                            triggerText="Create your first dojo" 
                        />
                    </div>
                </div>
            ) : !dojos ? (
                <div className="dashboard-empty py-8 text-center text-destructive">
                    <LayoutGrid className="mx-auto mb-2 h-6 w-6 opacity-50" />
                    <p className="text-sm font-medium">Failed to load Dojos</p>
                    <p className="mt-1 text-xs opacity-80 max-w-md mx-auto">
                        Please make sure you have applied the database migrations (`supabase db push`) so the new collaboration tables exist.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">My Dojos</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {dojos.map((dojo) => {
                            const studentCount = Number(dojo.students?.[0]?.count ?? 0)
                            const collaborators = dojo.dojo_collaborators || []
                            const isOwner = dojo.coach_id === user.id
                            const myCollaboration = !isOwner ? collaborators.find((c: any) => c.user_id === user.id) : null
                            const permissionLabel = myCollaboration?.permission === 'write' ? 'Read & Write' : 'Read Only'
                            const canEdit = isOwner || myCollaboration?.permission === 'write'

                            return (
                                <div key={dojo.id} className="dashboard-surface dashboard-list-item group relative p-3">
                                    <Link href={{ pathname: '/dashboard/students', query: { dojo: dojo.name } }} className="absolute inset-0 z-10">
                                        <span className="sr-only">View students for {dojo.name}</span>
                                    </Link>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="pointer-events-none relative z-20 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                                                <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    {dojo.name}
                                                    {!isOwner && (
                                                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-sm font-medium">Shared</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Users className="h-2.5 w-2.5" />
                                                    <span>{studentCount} students</span>
                                                    {isOwner && collaborators.length > 0 && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <Share2 className="h-2.5 w-2.5" />
                                                            <span>{collaborators.length} shared</span>
                                                        </>
                                                    )}
                                                    {!isOwner && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <span>{permissionLabel}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <div className="relative z-20">
                                                <DojoActions dojo={dojo} studentCount={studentCount} isOwner={isOwner} collaborators={isOwner ? collaborators : []} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <PaginationControls page={page} totalPages={totalPages} totalCount={count ?? 0} />
        </div>
    )
}
