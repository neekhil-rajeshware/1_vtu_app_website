import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { buttonClass, Container } from '@/components/ui'

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-bold tracking-tight text-gradient-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        This page does not exist
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        The link may be out of date, or the page may have been renamed. Everything
        about the app is still one tap away.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonClass('primary', 'md')}>
          <Home className="h-4 w-4" />
          Back to home
        </Link>
        <Link href="/features" className={buttonClass('outline', 'md')}>
          Browse features
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Container>
  )
}
