import { ContactForm } from '@/components/contact/contact-form'

export const metadata = {
  title: 'Contact Us | EntryDesk',
  description: 'Get in touch with the EntryDesk team. We would love to hear from you.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 xl:px-8">
          <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 xl:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <ContactForm />
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Get in touch</h3>
              <p className="text-muted-foreground">
                Whether you have questions about EntryDesk, need support, or just want to say hello,
                feel free to reach out using the form above. We'll get back to you as soon as possible!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
