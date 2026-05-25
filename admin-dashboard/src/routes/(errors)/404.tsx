import { createFileRoute, Link } from '@tanstack/react-router'
import { Compass, SearchX } from 'lucide-react'

export const Route = createFileRoute('/(errors)/404')({
  component: Error404,
})

function Error404() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex items-center justify-center gap-3">
          <SearchX className="h-9 w-9 text-muted-foreground" />
          <Compass className="h-9 w-9 text-muted-foreground" />
        </div>
        <div className="text-7xl font-bold text-muted-foreground">404</div>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Go back
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
