'use client'

import { Button } from "@/components/ui/button"
import { applyToEvent } from "@/app/dashboard/events-browser/actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ApplyButtonProps {
    eventId: string
    status?: string // 'pending', 'approved', 'rejected' or undefined
    registrationClosed?: boolean
    className?: string
}

export function ApplyButton({ eventId, status, registrationClosed = false, className }: ApplyButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleApply = async () => {
        setIsLoading(true)
        try {
            const result = await applyToEvent(eventId)
            if (result?.success === false && result?.message) {
                alert(result.message)
                return
            }

            // Re-fetch the Server Component data (applications/status) immediately.
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error applying to event'
            alert(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (status === 'approved') {
        return <Button variant="secondary" disabled className={`bg-emerald-100 text-emerald-800 ${className || ''}`}>Approved</Button>
    }

    if (status === 'pending') {
        return <Button variant="outline" disabled className={className}>Pending Approval</Button>
    }

    if (status === 'rejected') {
        return <Button variant="destructive" disabled className={className}>Rejected</Button>
    }

    if (registrationClosed) {
        return <Button variant="outline" disabled className={className}>Registration Closed</Button>
    }

    return (
        <Button onClick={handleApply} disabled={isLoading} className={className}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Request to Participate
        </Button>
    )
}
