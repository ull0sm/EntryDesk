'use client'

import { useEffect, useState } from 'react'
import { getContactSubmissions } from '@/app/contact/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Contact {
  id: string
  name: string
  email: string
  message: string
  created_at: string
}

export function ContactSubmissionsTable() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContacts = async () => {
      const result = await getContactSubmissions()
      if (result.success) {
        setContacts(result.data)
      }
      setLoading(false)
    }

    fetchContacts()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (contacts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No contact submissions yet.</div>
  }

  return (
    <div className="rounded-lg border border-border/40">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{contact.name}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell className="max-w-md truncate">{contact.message}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(contact.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
