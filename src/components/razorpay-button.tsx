'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Razorpay Payment Button embed.
 *
 * Razorpay's snippet is a <script> that replaces itself with the button, so it
 * has to be injected *inside* the <form> it should render into. `next/script`
 * can't express that — it controls when a script loads, not where in the DOM it
 * lands — so the tag is built by hand and appended to a ref'd form instead.
 *
 * The effect is guarded on the form already having children because React
 * StrictMode runs effects twice in development, which would otherwise mount two
 * buttons.
 */
export function RazorpayButton({ buttonId }: { buttonId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const form = formRef.current
    if (!form || form.childNodes.length > 0) return

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js'
    script.async = true
    script.dataset.payment_button_id = buttonId
    // A blocked or offline CDN would otherwise leave an empty box with no
    // explanation of why there's nothing to tap.
    script.onerror = () => setFailed(true)
    form.appendChild(script)
  }, [buttonId])

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">
        The payment button could not load. Please check your connection and
        refresh the page.
      </p>
    )
  }

  return <form ref={formRef} />
}
