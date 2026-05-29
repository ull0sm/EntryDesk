import { requireRole } from '@/lib/auth/require-role'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApprovalButtons } from '@/components/approvals/approval-buttons'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EventApprovalsPage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams?: { status?: string } | Promise<{ status?: string }>
}) {
    const { supabase, user, role } = await requireRole(['organizer', 'admin'], { redirectTo: '/dashboard' })
    const { id } = await params

    // Verify ownership of event
    const { data: event } = await supabase
        .from('events')
        .select('title, organizer_id')
        .eq('id', id)
        .single()

    if (!event) {
        return notFound()
    }

    // Get applications for this event
    const sp = await searchParams
    const statusParam = sp?.status
    const status = statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected'
        ? statusParam
        : 'pending'

    const { data: applications } = await supabase
        .from('event_applications')
        .select('*, profiles(full_name, email)')
        .eq('event_id', id)
        .eq('status', status)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle>
                                {status === 'pending'
                                    ? 'Pending Requests'
                                    : status === 'approved'
                                        ? 'Approved Coaches'
                                        : 'Rejected Requests'}
                            </CardTitle>
                            <CardDescription>{applications?.length || 0} requests.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {applications && applications.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Coach</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">{status === 'pending' ? 'Actions' : 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            {/* @ts-ignore */}
                                            <td className="p-4 align-middle font-medium">
                                                {/* @ts-ignore */}
                                                {app.profiles?.full_name || app.profiles?.email?.split('@')?.[0] || app.profiles?.email || '—'}
                                            </td>
                                            {/* @ts-ignore */}
                                            <td className="p-4 align-middle">{app.profiles?.email}</td>
                                            <td className="p-4 align-middle">{new Date(app.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle text-right">
                                                {status === 'pending' ? (
                                                    <ApprovalButtons applicationId={app.id} />
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                                                        {status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No {status} requests for this event.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
