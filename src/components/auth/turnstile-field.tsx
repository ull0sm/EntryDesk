'use client'

import { useEffect, useId, useRef, useState } from 'react'

// The turnstile type is either provided globally or we cast window as any

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if ((window as any).turnstile) {
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstileScript = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile.'))
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

type TurnstileFieldProps = {
  formId: string
  onTokenChange?: (hasToken: boolean) => void
}

export function TurnstileField({ formId, onTokenChange }: TurnstileFieldProps) {
  const [token, setToken] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenChangeRef = useRef<typeof onTokenChange>(onTokenChange)
  const inputId = useId()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const configurationError = siteKey
    ? null
    : 'Security check is unavailable. Ask an admin to configure Turnstile.'

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    if (!siteKey) {
      return
    }

    let isMounted = true

    void loadTurnstileScript()
      .then(() => {
        if (!isMounted || !containerRef.current || !(window as any).turnstile) {
          return
        }

        widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (nextToken) => {
            if (isMounted) {
              setToken(nextToken)
              setLoadError(null)
              onTokenChangeRef.current?.(Boolean(nextToken))
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('turnstile_status', { detail: true }))
              }
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setToken('')
              onTokenChangeRef.current?.(false)
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('turnstile_status', { detail: false }))
            }
          },
          'error-callback': () => {
            if (isMounted) {
              setToken('')
              setLoadError('Security check failed. Refresh the challenge and try again.')
              onTokenChangeRef.current?.(false)
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('turnstile_status', { detail: false }))
            }
          },
        })
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Security check could not load. Check your connection and retry.')
          onTokenChangeRef.current?.(false)
        }
      })

    return () => {
      isMounted = false

      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current)
      }

      onTokenChangeRef.current?.(false)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('turnstile_status', { detail: false }))
      widgetIdRef.current = null
    }
  }, [siteKey])

  return (
    <div className="space-y-2">
      <input id={inputId} name="captchaToken" type="hidden" value={token} readOnly form={formId} />
      <div ref={containerRef} />
      {configurationError || loadError ? <p className="text-xs text-destructive">{configurationError ?? loadError}</p> : null}
      {!configurationError && !loadError ? (
        <p className="text-xs text-muted-foreground">Complete the security check before submitting.</p>
      ) : null}
    </div>
  )
}