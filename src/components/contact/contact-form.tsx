'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Turnstile } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitContactForm } from '@/app/contact/actions'
import { useState } from 'react'

interface ContactFormInputs {
  name: string
  email: string
  message: string
}

export function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isTurnstileReady, setIsTurnstileReady] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormInputs>({
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormInputs) => {
    if (!turnstileToken) {
      setMessage({ type: 'error', text: 'Please complete the CAPTCHA verification' })
      return
    }

    startTransition(async () => {
      const result = await submitContactForm({
        ...data,
        turnstileToken,
      })

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        reset()
        setTurnstileToken(null)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <Input
            {...register('name', { required: 'Name is required' })}
            placeholder="Your name"
            disabled={isPending}
            id="name"
          />
          {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email',
              },
            })}
            type="email"
            placeholder="your.email@example.com"
            disabled={isPending}
            id="email"
          />
          {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Message
          </label>
          <Textarea
            {...register('message', { required: 'Message is required' })}
            placeholder="Your message here..."
            disabled={isPending}
            rows={5}
            id="message"
          />
          {errors.message && <span className="text-red-500 text-sm mt-1">{errors.message.message}</span>}
        </div>

        <div>
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            onSuccess={(token) => {
              setTurnstileToken(token)
              setIsTurnstileReady(true)
            }}
            onError={() => {
              setTurnstileToken(null)
              setMessage({ type: 'error', text: 'CAPTCHA verification failed' })
            }}
            onExpire={() => {
              setTurnstileToken(null)
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || !turnstileToken || !isTurnstileReady}
          className="w-full"
        >
          {isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  )
}
