'use client'

import { useState, useRef } from 'react'
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
import { createDojo, updateDojo } from '@/app/dashboard/dojos/actions'
import { Plus } from 'lucide-react'

interface DojoDialogProps {
  dojo?: {
    id: string
    name: string
  }
  children?: React.ReactNode // For custom triggers like span
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  triggerText?: string
  showPlusIcon?: boolean
  className?: string
}

export function DojoDialog({ 
  dojo, 
  children, 
  open, 
  onOpenChange,
  variant = 'default',
  size = 'default',
  triggerText = 'Add Dojo',
  showPlusIcon = false,
  className
}: DojoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const isEditing = !!dojo

  // Handle both controlled and uncontrolled state
  const show = open !== undefined ? open : isOpen
  const setShow = onOpenChange || setIsOpen

  const handleSubmit = async (formData: FormData) => {
    if (submitLockRef.current || isSubmitting) return;
    submitLockRef.current = true;
    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateDojo(dojo.id, formData)
      } else {
        await createDojo(formData)
      }
      setShow(false)
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Failed to save dojo'
      alert(message)
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false)
    }
  }

  const renderTrigger = () => {
    if (children) {
      return <DialogTrigger asChild>{children}</DialogTrigger>
    }
    return (
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {showPlusIcon && <Plus className="mr-1.5 h-3.5 w-3.5" />}
          {triggerText}
        </Button>
      </DialogTrigger>
    )
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {renderTrigger()}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Dojo' : 'Add New Dojo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Make changes to your dojo here. Click save when you're done."
              : "Add a new dojo to manage your students."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={dojo?.name}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

