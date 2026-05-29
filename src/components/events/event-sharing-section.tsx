'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addEventCollaborator, removeEventCollaborator, updateEventCollaborator } from '@/app/dashboard/events/[id]/settings/collaborators'
import { toast } from 'sonner'
import { Loader2, Trash2, Users2, Share2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Collaborator = {
  user_id: string
  permission: 'read' | 'write'
  profiles: {
    email: string
    full_name: string | null
  }
}

interface EventSharingSectionProps {
  event: {
    id: string
    title: string
  }
  collaborators: Collaborator[]
}

export function EventSharingSection({ event, collaborators = [] }: EventSharingSectionProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'read' | 'write'>('read')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      await addEventCollaborator(event.id, email, permission)
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
      await removeEventCollaborator(event.id, userId)
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
      await updateEventCollaborator(event.id, userId, newPermission)
      toast.success('Permission updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permission')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="dashboard-surface border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-muted-foreground" />
          Event Sharing & Collaboration
        </CardTitle>
        <CardDescription>
          Invite other organisers to help manage this event. Read-only users can view entries, while Read & Write users can edit settings and manage entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="flex items-end gap-2 max-w-xl">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="organiser@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="w-[130px] space-y-2">
            <Label htmlFor="permission">Access Level</Label>
            <Select value={permission} onValueChange={(v: 'read' | 'write') => setPermission(v)} disabled={isSubmitting}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="write">Read & Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!email || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
          </Button>
        </form>

        <div className="space-y-4 max-w-xl">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users2 className="h-4 w-4 text-muted-foreground" />
            Current Collaborators ({collaborators.length})
          </h4>
          
          <div className="space-y-3">
            {collaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground border rounded-md p-4 bg-muted/20 text-center">No collaborators invited yet.</p>
            ) : (
              collaborators.map((c) => (
                <div key={c.user_id} className="flex items-center justify-between gap-2 rounded-md border p-3 bg-background">
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
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read" className="text-xs">Read Only</SelectItem>
                        <SelectItem value="write" className="text-xs">Read & Write</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(c.user_id)}
                      disabled={loadingId === c.user_id}
                      title="Remove Collaborator"
                    >
                      {loadingId === c.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
