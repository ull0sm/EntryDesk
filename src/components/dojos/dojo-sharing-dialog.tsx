'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addDojoCollaborator, removeDojoCollaborator, updateDojoCollaborator } from '@/app/dashboard/dojos/collaborators'
import { toast } from 'sonner'
import { Loader2, Trash2, Users2 } from 'lucide-react'

type Collaborator = {
  user_id: string
  permission: 'read' | 'write'
  profiles: {
    email: string
    full_name: string | null
  }
}

interface DojoSharingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dojo: {
    id: string
    name: string
  }
  collaborators: Collaborator[]
}

export function DojoSharingDialog({ open, onOpenChange, dojo, collaborators = [] }: DojoSharingDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'read' | 'write'>('read')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      await addDojoCollaborator(dojo.id, email, permission)
      toast.success('Collaborator added successfully')
      setEmail('')
      setPermission('read')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add collaborator')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    setLoadingId(userId)
    try {
      await removeDojoCollaborator(dojo.id, userId)
      toast.success('Collaborator removed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove collaborator')
    } finally {
      setLoadingId(null)
    }
  }

  const handleUpdate = async (userId: string, newPermission: 'read' | 'write') => {
    setLoadingId(userId)
    try {
      await updateDojoCollaborator(dojo.id, userId, newPermission)
      toast.success('Permission updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permission')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Dojo: {dojo.name}</DialogTitle>
          <DialogDescription>
            Invite other coaches to collaborate on this dojo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="mt-4 flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="coach@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="w-[110px] space-y-2">
            <Label htmlFor="permission">Access</Label>
            <Select value={permission} onValueChange={(v: 'read' | 'write') => setPermission(v)} disabled={isSubmitting}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!email || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users2 className="h-4 w-4 text-muted-foreground" />
            Current Collaborators
          </h4>
          
          <div className="space-y-3">
            {collaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collaborators yet.</p>
            ) : (
              collaborators.map((c) => (
                <div key={c.user_id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={c.permission} 
                      onValueChange={(v: 'read' | 'write') => handleUpdate(c.user_id, v)}
                      disabled={loadingId === c.user_id}
                    >
                      <SelectTrigger className="w-[85px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read" className="text-xs">Read</SelectItem>
                        <SelectItem value="write" className="text-xs">Write</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(c.user_id)}
                      disabled={loadingId === c.user_id}
                    >
                      {loadingId === c.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
