import { requireRole } from '@/lib/auth/require-role'
import { StudentDialog } from '@/components/students/student-dialog'
import { StudentBulkUpload } from '@/components/students/student-bulk-upload'
import { StudentDataTable } from '@/components/students/student-data-table'
import { DashboardPageHeader } from '@/components/dashboard/page-header'
import { PaginationControls } from '@/components/ui/pagination-controls'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { supabase, user } = await requireRole('coach', { redirectTo: '/dashboard' })

  // URL Params
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams['page']) || 1

  const dojoParamRaw = resolvedSearchParams['dojo']
  const dojoParam = Array.isArray(dojoParamRaw) ? dojoParamRaw[0] : dojoParamRaw
  const limit = 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Fetch Dojos for filter dropdown (add filter later if needed) and for Dialogs
  const { data: dojos } = await supabase
    .from('dojos')
    .select('id, name')

  const selectedDojo = dojoParam ? (dojos || []).find((d) => d.name === dojoParam) : undefined
  const selectedDojoId = selectedDojo?.id

  let studentsQuery = supabase
    .from('students')
    .select('*, dojos(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (selectedDojoId) {
    studentsQuery = studentsQuery.eq('dojo_id', selectedDojoId)
  }

  const { data: students, count } = await studentsQuery.range(from, to)

  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Students"
        description="Manage your athletes across all dojos."
        actions={
          <>
            <StudentBulkUpload dojos={dojos || []} initialDojoId={selectedDojoId} />
            <StudentDialog dojos={dojos || []} initialDojoId={selectedDojoId} />
          </>
        }
      />

      <div className="dashboard-surface p-4 sm:p-5">
        <StudentDataTable data={students || []} dojos={dojos || []} initialDojoFilter={selectedDojo?.name} />
      </div>

      <PaginationControls page={page} totalPages={totalPages} totalCount={count ?? 0} />
    </div>
  )
}
