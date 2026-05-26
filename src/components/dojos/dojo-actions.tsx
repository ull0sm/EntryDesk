'use client'

import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DojoDialog } from "./dojo-dialog"
import { useState } from "react"
import { deleteDojo } from "@/app/dashboard/dojos/actions"

export function DojoActions({ dojo, studentCount }: { dojo: { id: string, name: string }, studentCount: number }) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const canDelete = studentCount === 0

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this dojo? All students in this dojo needs to be reassigned or will be deleted.')) {
            await deleteDojo(dojo.id)
        }
    }

  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canDelete ? (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            ) : (
                <DropdownMenuLabel className="max-w-56 whitespace-normal text-xs font-normal text-muted-foreground">
                    Delete unavailable: remove {studentCount} student{studentCount === 1 ? '' : 's'} first.
                </DropdownMenuLabel>
            )}
        </DropdownMenuContent>
        </DropdownMenu>

        <DojoDialog open={isEditOpen} onOpenChange={setIsEditOpen} dojo={dojo}>
             {/* Hidden trigger because we control it via state */}
             <span className="hidden"></span>
        </DojoDialog>
    </>
  )
}
