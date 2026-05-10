'use server'

import { createClient } from '@/lib/supabase/server'

interface ContactFormData {
  name: string
  email: string
  message: string
  turnstileToken: string
}

export async function submitContactForm(data: ContactFormData) {
  try {
    // Verify Turnstile token
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: data.turnstileToken,
      }),
    })

    const turnstileResult = await turnstileResponse.json()

    if (!turnstileResult.success) {
      return {
        success: false,
        error: 'CAPTCHA verification failed. Please try again.',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert into contacts table
    const { error } = await supabase.from('contacts').insert([
      {
        name: data.name,
        email: data.email,
        message: data.message,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Failed to submit contact form. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return {
      success: false,
      error: 'An error occurred. Please try again later.',
    }
  }
}

export async function getContactSubmissions() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { success: false, data: [] }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return { success: false, data: [] }
  }
}
