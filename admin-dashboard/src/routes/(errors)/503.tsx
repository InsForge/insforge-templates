import { createFileRoute, Link } from '@tanstack/react-router'
import { Construction, Wrench } from 'lucide-react'

export const Route = createFileRoute('/(errors)/503')({
  component: Error503,
})

function Error503() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Wrench className="h-9 w-9 text-muted-foreground" />
          <Construction className="h-9 w-9 text-muted-foreground" />
        </div>
        <div className="text-7xl font-bold text-muted-foreground">503</div>
        <h1 className="text-2xl font-semibold tracking-tight">Service unavailable</h1>
        <p className="text-muted-foreground">
          We're performing some maintenance right now. Please try again in a few minutes.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
