import { createFileRoute, Link } from '@tanstack/react-router'
import { ServerCrash } from 'lucide-react'

export const Route = createFileRoute('/(errors)/500')({
  component: Error500,
})

function Error500() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex justify-center">
          <ServerCrash className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-7xl font-bold text-muted-foreground">500</div>
        <h1 className="text-2xl font-semibold tracking-tight">Internal server error</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. Try refreshing the page, or contact support if the
          problem persists.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Refresh page
          </button>
          <Link
            to="/help-center"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
